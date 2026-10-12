import { findOwner } from './constants.js';
import { SEED_BOOKS, SEED_REQUESTS, coverFor } from './seedData.js';

const HOUR = 60 * 60 * 1000;

/** Inserts the sample books and requests. Called once, inside a transaction. */
export function seedDatabase({ run, get }) {
  const now = Date.now();

  SEED_BOOKS.forEach((book, index) => {
    const owner = findOwner(book.owner);
    // Spread the "added" dates over the past few weeks (in a shuffled order)
    // so that "Recently added" shows a mix of categories.
    const createdAt = new Date(now - (((index * 17) % SEED_BOOKS.length) + 1) * 7 * HOUR).toISOString();

    run(
      `INSERT INTO Books (title, author, publisher, publicationYear, genre, coverImage, description,
                          ownerId, ownerName, exchangePreference, price, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)`,
      [
        book.title,
        book.author,
        book.publisher ?? null,
        book.publicationYear ?? null,
        book.genre ?? null,
        coverFor(book.isbn),
        book.description ?? null,
        owner.id,
        owner.name,
        book.preference,
        book.preference === 'sell' ? (book.price ?? null) : null,
        createdAt,
        createdAt,
      ],
    );
  });

  SEED_REQUESTS.forEach((request, index) => {
    const book = get('SELECT id, ownerId, ownerName FROM Books WHERE title = ?', [request.bookTitle]);
    const requester = findOwner(request.requester);
    if (!book || !requester || book.ownerId === requester.id) return;
    const createdAt = new Date(now - (index + 1) * 3 * HOUR).toISOString();
    run(
      `INSERT INTO BookRequests (bookId, requesterId, requesterName, ownerId, ownerName,
                                 requestType, message, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [book.id, requester.id, requester.name, book.ownerId, book.ownerName,
        request.requestType, request.message, createdAt, createdAt],
    );
  });
}
