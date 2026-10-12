import { Router } from 'express';
import { all, get, run, transaction, nowIso } from '../db.js';
import { badRequest, conflict, forbidden, notFound, parseId } from '../http.js';
import { cleanMultiline, cleanText } from '../validation.js';
import { REQUEST_TYPES, findOwner } from '../constants.js';
import { presentRequest } from '../covers.js';

const router = Router();

// Requests are always returned together with a few details of their book.
const REQUEST_SELECT = `
  SELECT r.*, b.title AS bookTitle, b.author AS bookAuthor, b.coverImage AS bookCover,
         b.status AS bookStatus, b.exchangePreference AS bookPreference, b.price AS bookPrice
  FROM BookRequests r
  JOIN Books b ON b.id = r.bookId`;

const ORDER = `ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.updatedAt DESC, r.id DESC`;

const findRequest = (id) => get(`${REQUEST_SELECT} WHERE r.id = ?`, [id]);

/** POST /api/requests  { bookId, requesterId, requestType, message } */
router.post('/', (req, res) => {
  const body = req.body ?? {};
  const errors = {};

  const book = get('SELECT * FROM Books WHERE id = ?', [Number(body.bookId) || 0]);
  if (!book) throw notFound('That book no longer exists.');

  const requester = findOwner(cleanText(body.requesterId));
  if (!requester) errors.requesterId = 'Please choose who is making the request.';

  const requestType = cleanText(body.requestType);
  if (!REQUEST_TYPES.includes(requestType)) errors.requestType = 'Request type must be borrow, exchange or purchase.';

  const message = cleanMultiline(body.message);
  if (message && message.length > 500) errors.message = 'Message must be 500 characters or fewer.';

  if (Object.keys(errors).length) throw badRequest(Object.values(errors)[0], errors);

  // Business rules
  if (requester.id === book.ownerId) throw conflict('You cannot request your own book.');
  if (book.status !== 'available') {
    throw conflict(`“${book.title}” is currently ${book.status} and cannot be requested.`);
  }
  const duplicate = get(
    `SELECT id FROM BookRequests WHERE bookId = ? AND requesterId = ? AND status = 'pending'`,
    [book.id, requester.id],
  );
  if (duplicate) throw conflict('You already have a pending request for this book.');

  const now = nowIso();
  const { lastInsertRowid } = run(
    `INSERT INTO BookRequests (bookId, requesterId, requesterName, ownerId, ownerName,
                               requestType, message, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [book.id, requester.id, requester.name, book.ownerId, book.ownerName, requestType, message, now, now],
  );

  res.status(201).json(presentRequest(findRequest(lastInsertRowid)));
});

/** GET /api/requests/incoming/:ownerId — requests for books this owner listed. */
router.get('/incoming/:ownerId', (req, res) => {
  res.json(all(`${REQUEST_SELECT} WHERE r.ownerId = ? ${ORDER}`, [req.params.ownerId]).map(presentRequest));
});

/** GET /api/requests/outgoing/:requesterId — requests this user has sent. */
router.get('/outgoing/:requesterId', (req, res) => {
  res.json(all(`${REQUEST_SELECT} WHERE r.requesterId = ? ${ORDER}`, [req.params.requesterId]).map(presentRequest));
});

/**
 * PATCH /api/requests/:id/status  { status, actorId }
 *  - accepted / rejected: only the book's owner
 *  - cancelled: only the requester
 *  - only pending requests can change
 *  - accepting reserves the book and declines the other pending requests for it
 */
router.patch('/:id/status', (req, res) => {
  const body = req.body ?? {};
  const request = findRequest(parseId(req.params.id, 'Request'));
  if (!request) throw notFound('Request not found.');

  const status = cleanText(body.status);
  if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
    throw badRequest('Status must be accepted, rejected or cancelled.');
  }

  const actorId = cleanText(body.actorId);
  if (status === 'cancelled' && actorId !== request.requesterId) {
    throw forbidden('Only the person who sent this request can cancel it.');
  }
  if (status !== 'cancelled' && actorId !== request.ownerId) {
    throw forbidden(`Only the owner (${request.ownerName}) can accept or reject this request.`);
  }
  if (request.status !== 'pending') {
    throw conflict(`This request has already been ${request.status}.`);
  }

  const now = nowIso();
  const autoRejected = transaction(() => {
    if (status !== 'accepted') {
      run('UPDATE BookRequests SET status = ?, updatedAt = ? WHERE id = ?', [status, now, request.id]);
      return 0;
    }

    const book = get('SELECT status, title FROM Books WHERE id = ?', [request.bookId]);
    if (book.status !== 'available') {
      throw conflict(`“${book.title}” is already ${book.status}, so this request cannot be accepted.`);
    }
    run(`UPDATE BookRequests SET status = 'accepted', updatedAt = ? WHERE id = ?`, [now, request.id]);
    run(`UPDATE Books SET status = 'reserved', updatedAt = ? WHERE id = ?`, [now, request.bookId]);
    const { changes } = run(
      `UPDATE BookRequests SET status = 'rejected', updatedAt = ?
       WHERE bookId = ? AND status = 'pending' AND id <> ?`,
      [now, request.bookId, request.id],
    );
    return changes;
  });

  res.json({ request: presentRequest(findRequest(request.id)), autoRejected });
});

export default router;
