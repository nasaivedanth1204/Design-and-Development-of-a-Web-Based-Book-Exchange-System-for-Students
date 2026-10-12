import { Router } from 'express';
import { all, get, run, transaction, nowIso } from '../db.js';
import { badRequest, forbidden, notFound, parseId } from '../http.js';
import { cleanText, validateBook, validateCoverUrl } from '../validation.js';
import { uploadCover, publicPathFor, removeUploadedFile } from '../upload.js';

const router = Router();

// Every book row also reports how many pending requests it currently has.
const BOOK_COLUMNS = `
  b.*,
  (SELECT COUNT(*) FROM BookRequests r WHERE r.bookId = b.id AND r.status = 'pending') AS pendingRequests`;

const SORTS = {
  recent: 'b.createdAt DESC, b.id DESC',
  title: 'b.title COLLATE NOCASE ASC',
  author: 'b.author COLLATE NOCASE ASC, b.title COLLATE NOCASE ASC',
  'year-new': 'b.publicationYear DESC NULLS LAST, b.title COLLATE NOCASE ASC',
  'year-old': 'b.publicationYear ASC NULLS LAST, b.title COLLATE NOCASE ASC',
};

// "%" and "_" are LIKE wildcards; escape them so they are searched literally.
const escapeLike = (text) => text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

const findBook = (id) => get(`SELECT ${BOOK_COLUMNS} FROM Books b WHERE b.id = ?`, [id]);

/**
 * GET /api/books?search=&genre=&preference=&status=&sort=
 * Search is case-insensitive and ignores extra whitespace. Each word must
 * match at least one of: title, author, publisher, year or genre.
 */
router.get('/', (req, res) => {
  const where = [];
  const params = [];

  const search = cleanText(req.query.search);
  if (search) {
    for (const word of search.split(' ').slice(0, 8)) {
      const pattern = `%${escapeLike(word)}%`;
      where.push(`(b.title LIKE ? ESCAPE '\\' OR b.author LIKE ? ESCAPE '\\' OR b.publisher LIKE ? ESCAPE '\\'
                   OR CAST(b.publicationYear AS TEXT) LIKE ? ESCAPE '\\' OR b.genre LIKE ? ESCAPE '\\')`);
      params.push(pattern, pattern, pattern, pattern, pattern);
    }
  }

  const genre = cleanText(req.query.genre);
  if (genre && genre.toLowerCase() !== 'all') {
    where.push('b.genre = ? COLLATE NOCASE');
    params.push(genre);
  }

  const preference = cleanText(req.query.preference);
  if (preference && preference !== 'all') {
    where.push('b.exchangePreference = ?');
    params.push(preference);
  }

  const status = cleanText(req.query.status);
  if (status && status !== 'all') {
    where.push('b.status = ?');
    params.push(status);
  }

  const orderBy = SORTS[req.query.sort] ?? SORTS.recent;
  const sql = `SELECT ${BOOK_COLUMNS} FROM Books b
               ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY ${orderBy}`;
  res.json(all(sql, params));
});

/** GET /api/books/owner/:ownerId — every book listed by one mock owner. */
router.get('/owner/:ownerId', (req, res) => {
  res.json(all(`SELECT ${BOOK_COLUMNS} FROM Books b WHERE b.ownerId = ? ORDER BY b.createdAt DESC, b.id DESC`, [req.params.ownerId]));
});

/** GET /api/books/:id */
router.get('/:id', (req, res) => {
  const book = findBook(parseId(req.params.id, 'Book'));
  if (!book) throw notFound('Book not found.');
  res.json(book);
});

/**
 * Works out the coverImage value from the form.
 * coverMode: "upload" (file sent), "url" (coverUrl sent), "none" (remove), "keep" (edit only).
 */
function resolveCover(req, existingCover) {
  if (req.file) return { cover: publicPathFor(req.file) };
  const mode = cleanText(req.body.coverMode) ?? (cleanText(req.body.coverUrl) ? 'url' : existingCover !== undefined ? 'keep' : 'none');
  if (mode === 'keep') return { cover: existingCover ?? null };
  if (mode === 'url') {
    const { url, error } = validateCoverUrl(req.body.coverUrl);
    return error ? { error } : { cover: url };
  }
  return { cover: null };
}

function failValidation(req, errors) {
  if (req.file) removeUploadedFile(publicPathFor(req.file)); // don't keep orphaned files
  const first = Object.values(errors)[0];
  throw badRequest(first ?? 'Please check the form and try again.', errors);
}

/** POST /api/books — multipart form (so a cover file can be included) or JSON. */
router.post('/', uploadCover, (req, res) => {
  const { values, errors } = validateBook(req.body ?? {});
  const { cover, error: coverError } = resolveCover(req);
  if (coverError) errors.coverImage = coverError;
  if (Object.keys(errors).length) failValidation(req, errors);

  const now = nowIso();
  const { lastInsertRowid } = run(
    `INSERT INTO Books (title, author, publisher, publicationYear, genre, coverImage, description,
                        ownerId, ownerName, exchangePreference, price, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)`,
    [values.title, values.author, values.publisher, values.publicationYear, values.genre, cover,
      values.description, values.owner.id, values.owner.name, values.exchangePreference, values.price, now, now],
  );

  res.status(201).json(findBook(lastInsertRowid));
});

/** Loads a book and checks that the acting mock user owns it. */
function loadOwnedBook(id, actorId) {
  const book = findBook(parseId(id, 'Book'));
  if (!book) throw notFound('Book not found.');
  if (!actorId || actorId !== book.ownerId) {
    throw forbidden(`Only the owner (${book.ownerName}) can change or remove this book.`);
  }
  return book;
}

/** PUT /api/books/:id — edit a book (only by its owner). */
router.put('/:id', uploadCover, (req, res) => {
  const body = req.body ?? {};
  let book;
  try {
    book = loadOwnedBook(req.params.id, cleanText(body.actorId));
  } catch (error) {
    if (req.file) removeUploadedFile(publicPathFor(req.file));
    throw error;
  }

  const { values, errors } = validateBook(body, book);
  const { cover, error: coverError } = resolveCover(req, book.coverImage);
  if (coverError) errors.coverImage = coverError;
  if (Object.keys(errors).length) failValidation(req, errors);

  run(
    `UPDATE Books SET title = ?, author = ?, publisher = ?, publicationYear = ?, genre = ?, coverImage = ?,
                      description = ?, exchangePreference = ?, price = ?, status = ?, updatedAt = ?
     WHERE id = ?`,
    [values.title, values.author, values.publisher, values.publicationYear, values.genre, cover,
      values.description, values.exchangePreference, values.price, values.status, nowIso(), book.id],
  );

  if (book.coverImage !== cover) removeUploadedFile(book.coverImage);
  res.json(findBook(book.id));
});

/** DELETE /api/books/:id?actorId=... — its requests are removed too (ON DELETE CASCADE). */
router.delete('/:id', (req, res) => {
  const book = loadOwnedBook(req.params.id, cleanText(req.query.actorId ?? req.body?.actorId));

  const removedRequests = transaction(() => {
    const { count } = get('SELECT COUNT(*) AS count FROM BookRequests WHERE bookId = ?', [book.id]);
    run('DELETE FROM Books WHERE id = ?', [book.id]);
    return count;
  });

  removeUploadedFile(book.coverImage);
  res.json({ deleted: true, id: book.id, removedRequests });
});

export default router;
