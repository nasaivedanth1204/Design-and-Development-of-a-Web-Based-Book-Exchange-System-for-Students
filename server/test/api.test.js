// End-to-end API tests. Run with:  npm test
// Each run starts the real server against a throwaway database in a temp
// folder, so your demo data in server/data/books.db is never touched.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import initSqlJs from 'sql.js';

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'book-exchange-test-'));
const PORT = 4500 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}/api`;
// Pretend only two sample covers have been downloaded: Clean Code and 1984.
const COVERS = path.join(TEMP, 'covers');
fs.mkdirSync(COVERS);
for (const isbn of ['9780132350884', '9780451524935']) fs.writeFileSync(path.join(COVERS, `${isbn}.jpg`), 'jpeg');
let server;

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/index.js'], {
      cwd: SERVER_DIR,
      env: {
        ...process.env,
        PORT: String(PORT),
        DB_PATH: path.join(TEMP, 'test.db'),
        UPLOADS_DIR: path.join(TEMP, 'uploads'),
        COVERS_DIR: COVERS,
      },
    });
    let output = '';
    const onData = (chunk) => {
      output += chunk;
      if (output.includes('API server running')) resolve(child);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('exit', (code) => reject(new Error(`Server exited (${code}):\n${output}`)));
  });
}

function stopServer(child) {
  return new Promise((resolve) => {
    child.removeAllListeners('exit');
    child.once('exit', resolve);
    child.kill();
  });
}

async function call(method, url, body) {
  const options = { method, headers: {} };
  if (body instanceof FormData) options.body = body;
  else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE}${url}`, options);
  return { status: response.status, body: await response.json() };
}

const form = (fields) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.append(key, value));
  return data;
};

before(async () => { server = await startServer(); });
after(async () => {
  if (server) await stopServer(server);
  fs.rmSync(TEMP, { recursive: true, force: true });
});

test('seeds 30–50 sample books on first start', async () => {
  const { status, body } = await call('GET', '/books');
  assert.equal(status, 200);
  assert.ok(body.length >= 30 && body.length <= 50, `got ${body.length} books`);
  assert.ok(body.every((book) => book.title && book.author));
});

test('seeded covers use local files when downloaded, otherwise the drawn fallback', async () => {
  const { body } = await call('GET', '/books');
  const byTitle = Object.fromEntries(body.map((book) => [book.title, book]));
  assert.equal(byTitle['Clean Code'].coverImage, '/images/books/9780132350884.jpg');
  assert.equal(byTitle['1984'].coverImage, '/images/books/9780451524935.jpg');
  assert.equal(byTitle['The Hobbit'].coverImage, null, 'cover file not downloaded → null → drawn cover');
  assert.ok(!body.some((book) => /^https?:/.test(book.coverImage ?? '')), 'no external cover URLs');

  // Downloading a cover later makes it appear without touching the database.
  fs.writeFileSync(path.join(COVERS, '9780547928227.jpg'), 'jpeg');
  const hobbit = (await call('GET', '/books?search=hobbit')).body[0];
  assert.equal(hobbit.coverImage, '/images/books/9780547928227.jpg');
  fs.rmSync(path.join(COVERS, '9780547928227.jpg'));

  // Request listings apply the same rule to the book's cover.
  const incoming = (await call('GET', '/requests/incoming/aarav')).body;
  assert.equal(incoming.find((r) => r.bookTitle === 'Clean Code').bookCover, '/images/books/9780132350884.jpg');
  assert.equal(incoming.find((r) => r.bookTitle.startsWith('Sapiens')).bookCover, null);
});

test('editing a seeded book whose cover is not downloaded keeps its stored cover path', async () => {
  const sapiens = (await call('GET', '/books?search=sapiens')).body[0];
  assert.equal(sapiens.coverImage, null);
  const edited = await call('PUT', `/books/${sapiens.id}`, form({ actorId: sapiens.ownerId, description: 'Updated.', coverMode: 'keep' }));
  assert.equal(edited.status, 200);
  fs.writeFileSync(path.join(COVERS, '9780062316097.jpg'), 'jpeg');
  assert.equal((await call('GET', `/books/${sapiens.id}`)).body.coverImage, '/images/books/9780062316097.jpg');
  fs.rmSync(path.join(COVERS, '9780062316097.jpg'));
});

test('search is case-insensitive, tolerates whitespace and covers several fields', async () => {
  const byTitle = await call('GET', `/books?search=${encodeURIComponent('   the   HOBBIT  ')}`);
  assert.deepEqual(byTitle.body.map((b) => b.title), ['The Hobbit']);

  const byAuthorAndYear = await call('GET', '/books?search=orwell%201949');
  assert.deepEqual(byAuthorAndYear.body.map((b) => b.title), ['1984']);

  const byPublisher = await call('GET', '/books?search=mit%20press');
  assert.ok(byPublisher.body.length >= 2);

  const none = await call('GET', '/books?search=zzzzqqq');
  assert.deepEqual(none.body, []);

  const wildcard = await call('GET', '/books?search=%25');
  assert.deepEqual(wildcard.body, [], '"%" is searched literally');
});

test('category filter and sorting work', async () => {
  const { body } = await call('GET', '/books?genre=mathematics&sort=year-old');
  assert.ok(body.length > 0 && body.every((b) => b.genre === 'Mathematics'));
  const years = body.map((b) => b.publicationYear);
  assert.deepEqual(years, [...years].sort((a, b) => a - b));

  const byTitle = (await call('GET', '/books?sort=title')).body.map((b) => b.title.toLowerCase());
  assert.deepEqual(byTitle, [...byTitle].sort());
});

test('adding a book with only required fields stores NULLs', async () => {
  const { status, body } = await call('POST', '/books', form({ title: '  Minimal   Book ', author: 'Someone', ownerId: 'kabir', publisher: '', publicationYear: '', genre: '' }));
  assert.equal(status, 201);
  assert.equal(body.title, 'Minimal Book');
  assert.equal(body.publisher, null);
  assert.equal(body.publicationYear, null);
  assert.equal(body.genre, null);
  assert.equal(body.coverImage, null);
  assert.equal(body.ownerName, 'Kabir Mehta');
});

let addedBook;
test('adding a fully populated book with an uploaded cover', async () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a3d40000000049454e44ae426082', 'hex');
  const data = form({
    title: 'Operating System Concepts', author: 'Silberschatz', publisher: 'Wiley', publicationYear: '2018',
    genre: 'Computer Science', description: 'The dinosaur book.', ownerId: 'priya', exchangePreference: 'sell', price: '650',
  });
  data.append('coverFile', new Blob([png], { type: 'image/png' }), 'cover.png');
  const { status, body } = await call('POST', '/books', data);
  assert.equal(status, 201);
  assert.match(body.coverImage, /^\/uploads\/.+\.png$/);
  assert.equal(body.price, 650);
  addedBook = body;

  const image = await fetch(`http://localhost:${PORT}${body.coverImage}`);
  assert.equal(image.status, 200);

  const found = await call('GET', '/books?search=silberschatz&genre=Computer%20Science');
  assert.equal(found.body[0].id, body.id);
  const owned = await call('GET', '/books/owner/priya');
  assert.ok(owned.body.some((b) => b.id === body.id));
});

test('invalid books are rejected with field errors', async () => {
  const missing = await call('POST', '/books', form({ title: '', author: '', ownerId: 'priya' }));
  assert.equal(missing.status, 400);
  assert.ok(missing.body.details.title && missing.body.details.author);

  const badYear = await call('POST', '/books', form({ title: 'X', author: 'Y', ownerId: 'priya', publicationYear: 'abc' }));
  assert.equal(badYear.status, 400);

  const uploadsBefore = fs.readdirSync(path.join(TEMP, 'uploads')).length;

  const badFile = form({ title: 'X', author: 'Y', ownerId: 'priya' });
  badFile.append('coverFile', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt');
  const wrongType = await call('POST', '/books', badFile);
  assert.equal(wrongType.status, 400);
  assert.match(wrongType.body.details.coverImage, /JPG, PNG, WEBP or GIF/);

  const tooBig = form({ title: 'Big cover', author: 'Y', ownerId: 'priya' });
  tooBig.append('coverFile', new Blob([Buffer.alloc(3 * 1024 * 1024 + 10, 1)], { type: 'image/png' }), 'big.png');
  const oversized = await call('POST', '/books', tooBig);
  assert.equal(oversized.status, 400);
  assert.match(oversized.body.error, /smaller than 3 MB/);

  // A valid image with an invalid form must not leave its file behind either.
  const orphan = form({ title: '', author: 'Y', ownerId: 'priya' });
  orphan.append('coverFile', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'x.png');
  assert.equal((await call('POST', '/books', orphan)).status, 400);

  await new Promise((resolve) => setTimeout(resolve, 100)); // file removal is async
  assert.equal(fs.readdirSync(path.join(TEMP, 'uploads')).length, uploadsBefore, 'no orphaned upload files');
  const titles = (await call('GET', '/books?search=big%20cover')).body;
  assert.equal(titles.length, 0, 'failed saves are not stored');
});

test('only the owner can edit; edits are saved', async () => {
  const denied = await call('PUT', `/books/${addedBook.id}`, form({ actorId: 'rahul', title: 'Hacked' }));
  assert.equal(denied.status, 403);

  const { status, body } = await call('PUT', `/books/${addedBook.id}`, form({ actorId: 'priya', title: 'Operating System Concepts (10th ed.)', exchangePreference: 'lend', coverMode: 'keep' }));
  assert.equal(status, 200);
  assert.equal(body.title, 'Operating System Concepts (10th ed.)');
  assert.equal(body.price, null, 'price is cleared when not selling');
  assert.equal(body.coverImage, addedBook.coverImage);
});

let requestId;
test('request workflow: create, duplicate, own book, accept, reserve', async () => {
  const own = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'priya', requestType: 'borrow' });
  assert.equal(own.status, 409);

  const created = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'rahul', requestType: 'borrow', message: '  Please!  ' });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'pending');
  assert.equal(created.body.message, 'Please!');
  requestId = created.body.id;

  const duplicate = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'rahul', requestType: 'exchange' });
  assert.equal(duplicate.status, 409);

  const second = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'sneha', requestType: 'borrow' });
  assert.equal(second.status, 201);

  const badType = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'kabir', requestType: 'steal' });
  assert.equal(badType.status, 400);

  const incoming = await call('GET', '/requests/incoming/priya');
  assert.ok(incoming.body.some((r) => r.id === requestId && r.bookTitle));

  const wrongActor = await call('PATCH', `/requests/${requestId}/status`, { status: 'accepted', actorId: 'rahul' });
  assert.equal(wrongActor.status, 403);

  const accepted = await call('PATCH', `/requests/${requestId}/status`, { status: 'accepted', actorId: 'priya' });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.request.status, 'accepted');
  assert.equal(accepted.body.autoRejected, 1);

  const book = await call('GET', `/books/${addedBook.id}`);
  assert.equal(book.body.status, 'reserved');

  const again = await call('PATCH', `/requests/${requestId}/status`, { status: 'rejected', actorId: 'priya' });
  assert.equal(again.status, 409, 'only pending requests can change');

  const onReserved = await call('POST', '/requests', { bookId: addedBook.id, requesterId: 'kabir', requestType: 'borrow' });
  assert.equal(onReserved.status, 409);

  const outgoing = await call('GET', '/requests/outgoing/sneha');
  assert.equal(outgoing.body.find((r) => r.bookId === addedBook.id).status, 'rejected');
});

test('reject and cancel', async () => {
  const hobbit = (await call('GET', '/books?search=hobbit')).body[0];
  const r1 = await call('POST', '/requests', { bookId: hobbit.id, requesterId: 'kabir', requestType: 'borrow' });
  const rejected = await call('PATCH', `/requests/${r1.body.id}/status`, { status: 'rejected', actorId: hobbit.ownerId });
  assert.equal(rejected.body.request.status, 'rejected');
  assert.equal((await call('GET', `/books/${hobbit.id}`)).body.status, 'available');

  const r2 = await call('POST', '/requests', { bookId: hobbit.id, requesterId: 'kabir', requestType: 'borrow' });
  assert.equal(r2.status, 201, 'can request again after a rejection');
  const cancelled = await call('PATCH', `/requests/${r2.body.id}/status`, { status: 'cancelled', actorId: 'kabir' });
  assert.equal(cancelled.body.request.status, 'cancelled');
});

test('data survives a backend restart', async () => {
  await stopServer(server);
  server = await startServer();
  const { body } = await call('GET', `/books/${addedBook.id}`);
  assert.equal(body.title, 'Operating System Concepts (10th ed.)');
  assert.equal(body.status, 'reserved');
  const all = await call('GET', '/books');
  assert.ok(all.body.length <= 52, 'seed data was not inserted twice');
  const outgoing = await call('GET', '/requests/outgoing/rahul');
  assert.equal(outgoing.body.find((r) => r.id === requestId).status, 'accepted');
});

test('deleting a book removes its requests and uploaded cover', async () => {
  const denied = await call('DELETE', `/books/${addedBook.id}?actorId=rahul`);
  assert.equal(denied.status, 403);

  const { status, body } = await call('DELETE', `/books/${addedBook.id}?actorId=priya`);
  assert.equal(status, 200);
  assert.equal(body.removedRequests, 2);
  assert.equal((await call('GET', `/books/${addedBook.id}`)).status, 404);
  const outgoing = await call('GET', '/requests/outgoing/rahul');
  assert.ok(!outgoing.body.some((r) => r.bookId === addedBook.id));
  assert.equal(fs.existsSync(path.join(TEMP, 'uploads', path.basename(addedBook.coverImage))), false);
});

test('unknown ids and endpoints return 404 JSON', async () => {
  assert.equal((await call('GET', '/books/999999')).status, 404);
  assert.equal((await call('GET', '/books/abc')).status, 404);
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.equal((await call('PATCH', '/requests/999999/status', { status: 'accepted', actorId: 'x' })).status, 404);
});

test('a database from the previous version gets local cover paths without losing user data', async () => {
  await stopServer(server);
  const dbFile = path.join(TEMP, 'test.db');
  const SQL = await initSqlJs({ locateFile: (file) => createRequire(import.meta.url).resolve(`sql.js/dist/${file}`) });
  const db = new SQL.Database(fs.readFileSync(dbFile));
  // Recreate what version 1 stored: remote Open Library URLs for seeded books.
  db.run(`UPDATE Books SET coverImage = 'https://covers.openlibrary.org/b/isbn/' || substr(coverImage, 15, 13) || '-L.jpg?default=false'
          WHERE coverImage LIKE '/images/books/%'`);
  db.run(`INSERT INTO Books (title, author, ownerId, ownerName, coverImage) VALUES ('Own URL', 'Me', 'kabir', 'Kabir Mehta', 'https://example.com/my-cover.jpg')`);
  db.run('PRAGMA user_version = 1');
  const before = db.exec('SELECT COUNT(*) FROM Books')[0].values[0][0];
  fs.writeFileSync(dbFile, db.export());
  db.close();

  server = await startServer();
  const { body } = await call('GET', '/books');
  assert.equal(body.length, before, 'no books added or lost');
  assert.ok(!body.some((book) => book.coverImage?.includes('openlibrary')), 'remote seed URLs migrated');
  assert.equal(body.find((book) => book.title === '1984').coverImage, '/images/books/9780451524935.jpg');
  assert.equal(body.find((book) => book.title === 'Own URL').coverImage, 'https://example.com/my-cover.jpg', 'user-supplied URL untouched');
});
