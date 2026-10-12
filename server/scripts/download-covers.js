// Downloads the cover image of every seeded book (matched by ISBN) from the
// Open Library Covers API into client/public/images/books/<isbn>.jpg.
//
//   npm run covers:download            download missing covers only
//   npm run covers:download -- --force re-download everything
//
// Run it ONCE (it is not part of server startup). It is safe to re-run: files
// that already exist and are valid images are skipped. Every download is
// checked to really be an image (not an empty file or an HTML error page)
// before it is saved. Books with no ISBN, or whose cover Open Library does not
// have, simply keep the app's built-in drawn fallback cover.
//
// Cover source: Open Library Covers API — https://openlibrary.org/dev/docs/api/covers
// Open Library asks clients to identify themselves and not to bulk-download;
// this script makes at most one request per book, 3 at a time.
import fs from 'node:fs';
import path from 'node:path';
import { SEED_COVERS_DIR } from '../src/config.js';
import { SEED_BOOKS } from '../src/seedData.js';

const OUT_DIR = SEED_COVERS_DIR; // client/public/images/books (or COVERS_DIR in tests)
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
// COVERS_BASE_URL (and COVERS_DIR) exist only so the downloader can be tested
// against a local mock server.
const BASE_URL = process.env.COVERS_BASE_URL ?? 'https://covers.openlibrary.org';
const FORCE = process.argv.includes('--force');

const CONCURRENCY = 3;
const TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
const MIN_BYTES = 200;
const MIN_WIDTH = 60;
const MIN_HEIGHT = 90;
const USER_AGENT = 'Athenaeum-Student-Book-Exchange/1.0 (academic project; one-time seed cover download)';

/** Reads width/height from a JPEG or PNG buffer. Returns null if it is neither. */
export function imageInfo(buffer) {
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { type: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      // SOF0..SOF15 (except DHT/JPG/DAC) hold the image size
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { type: 'jpeg', height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
    return { type: 'jpeg', width: 0, height: 0 };
  }
  return null;
}

/** Returns a reason string if the buffer is not an acceptable cover, else null. */
export function rejectReason(buffer) {
  if (buffer.length < MIN_BYTES) return `too small (${buffer.length} bytes)`;
  const info = imageInfo(buffer);
  if (!info) return 'not a JPEG or PNG image';
  // A cut-off download still has a valid header, so also check the end marker.
  const complete = info.type === 'jpeg'
    ? buffer.subarray(-16).includes(Buffer.from([0xff, 0xd9]))
    : buffer.subarray(-16).includes(Buffer.from('IEND'));
  if (!complete) return 'incomplete image (download was cut off)';
  if (info.width < MIN_WIDTH || info.height < MIN_HEIGHT) return `image too small (${info.width}×${info.height}) — probably a placeholder`;
  return null;
}

const isValidFile = (file) => {
  try {
    return rejectReason(fs.readFileSync(file)) === null;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCover(isbn) {
  // default=false → Open Library answers 404 instead of a blank placeholder
  const url = `${BASE_URL}/b/isbn/${isbn}-L.jpg?default=false`;
  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 404) return { status: 'missing', reason: 'no cover on Open Library' };
      if (response.status === 403) return { status: 'failed', reason: 'access denied (HTTP 403)' };
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const type = response.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) return { status: 'failed', reason: `server sent ${type || 'no content type'}, not an image` };
      const buffer = Buffer.from(await response.arrayBuffer());
      const reason = rejectReason(buffer);
      if (reason) return { status: 'failed', reason };
      return { status: 'downloaded', buffer, url: response.url || url };
    } catch (error) {
      lastError = error.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS / 1000}s` : error.message;
      if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s
    }
  }
  return { status: 'failed', reason: lastError };
}

async function runPool(items, worker) {
  const results = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // One entry per ISBN, so a cover shared by several records downloads once.
  const byIsbn = new Map();
  for (const book of SEED_BOOKS) {
    if (book.isbn && !byIsbn.has(book.isbn)) byIsbn.set(book.isbn, book);
  }
  const withoutIsbn = SEED_BOOKS.filter((book) => !book.isbn);

  console.log(`Seed catalogue: ${SEED_BOOKS.length} books, ${byIsbn.size} unique ISBNs, ${withoutIsbn.length} without an ISBN.`);
  console.log(`Saving covers to ${OUT_DIR}\n`);

  const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const manifest = {};

  const results = await runPool([...byIsbn.values()], async (book) => {
    const file = path.join(OUT_DIR, `${book.isbn}.jpg`);
    if (!FORCE && isValidFile(file)) {
      manifest[book.isbn] = previous[book.isbn] ?? { title: book.title, source: 'Open Library Covers API' };
      return { book, status: 'kept' };
    }
    const result = await fetchCover(book.isbn);
    if (result.status === 'downloaded') {
      const temp = `${file}.part`;
      fs.writeFileSync(temp, result.buffer);
      fs.renameSync(temp, file);
      manifest[book.isbn] = {
        title: book.title,
        author: book.author,
        source: 'Open Library Covers API',
        url: result.url,
        downloadedAt: new Date().toISOString(),
      };
    } else if (fs.existsSync(file) && !isValidFile(file)) {
      fs.rmSync(file); // never leave a broken file behind
    }
    const icon = { downloaded: '✔', missing: '–', failed: '✖' }[result.status];
    console.log(`${icon} ${book.isbn}  ${book.title}${result.reason ? `  (${result.reason})` : ''}`);
    return { book, ...result };
  });

  // Records the source of every cover on disk (skipped when nothing was saved).
  if (Object.keys(manifest).length) {
    fs.writeFileSync(MANIFEST, `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)}\n`);
  }

  const count = (status) => results.filter((r) => r.status === status).length;
  console.log('\nSummary');
  console.log(`  downloaded now:        ${count('downloaded')}`);
  console.log(`  already present:       ${count('kept')}`);
  console.log(`  no cover available:    ${count('missing')}`);
  console.log(`  failed:                ${count('failed')}`);
  console.log(`  no ISBN (drawn cover): ${withoutIsbn.length}`);
  if (count('failed')) {
    console.log('\nSome downloads failed (network or service problem). Those books show the drawn');
    console.log('fallback cover. Run "npm run covers:download" again later to retry just those.');
  }
  console.log('\nTip: commit client/public/images/books/ so everyone who clones the repo gets the covers.');
  // Non-zero exit so scripts and CI notice when downloads failed.
  if (count('failed')) process.exitCode = 1;
}

// Only run when executed directly (the helpers above are also used by tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('download-covers.js')) {
  main().catch((error) => {
    console.error('✖ Cover download stopped unexpectedly:', error.message);
    process.exit(1);
  });
}
