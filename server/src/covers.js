import fs from 'node:fs';
import path from 'node:path';
import { SEED_COVERS_DIR } from './config.js';

// Seeded books store a local cover path such as /images/books/9780132350884.jpg.
// Those files come from `npm run covers:download`. When a file is not on disk,
// the API reports the cover as null, so the browser shows its drawn fallback
// cover straight away instead of requesting a missing image. The database
// keeps the path, so the cover appears automatically once it is downloaded.
const SEED_PREFIX = '/images/books/';

export function presentCover(coverImage) {
  if (typeof coverImage !== 'string' || !coverImage.startsWith(SEED_PREFIX)) return coverImage;
  const file = path.join(SEED_COVERS_DIR, path.basename(coverImage));
  return fs.existsSync(file) ? coverImage : null;
}

export const presentBook = (book) => (book ? { ...book, coverImage: presentCover(book.coverImage) } : book);

export const presentRequest = (request) => (request ? { ...request, bookCover: presentCover(request.bookCover) } : request);
