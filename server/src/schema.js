// The whole database schema. Every statement uses IF NOT EXISTS, so running it
// on every server start is safe and never touches existing data.
const NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))";

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS Books (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  title              TEXT    NOT NULL CHECK (length(trim(title)) > 0),
  author             TEXT    NOT NULL CHECK (length(trim(author)) > 0),
  publisher          TEXT,
  publicationYear    INTEGER CHECK (publicationYear IS NULL OR publicationYear BETWEEN 1000 AND 2100),
  genre              TEXT,
  coverImage         TEXT,
  description        TEXT,
  ownerId            TEXT    NOT NULL,
  ownerName          TEXT    NOT NULL,
  exchangePreference TEXT    NOT NULL DEFAULT 'exchange'
                     CHECK (exchangePreference IN ('exchange', 'lend', 'give away', 'sell')),
  price              REAL    CHECK (price IS NULL OR price >= 0),
  status             TEXT    NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'reserved', 'unavailable')),
  createdAt          TEXT    NOT NULL DEFAULT ${NOW},
  updatedAt          TEXT    NOT NULL DEFAULT ${NOW}
);

CREATE INDEX IF NOT EXISTS idx_books_owner ON Books (ownerId);
CREATE INDEX IF NOT EXISTS idx_books_genre ON Books (genre);

CREATE TABLE IF NOT EXISTS BookRequests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  bookId        INTEGER NOT NULL REFERENCES Books (id) ON DELETE CASCADE,
  requesterId   TEXT    NOT NULL,
  requesterName TEXT    NOT NULL,
  ownerId       TEXT    NOT NULL,
  ownerName     TEXT    NOT NULL,
  requestType   TEXT    NOT NULL CHECK (requestType IN ('borrow', 'exchange', 'purchase')),
  message       TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  createdAt     TEXT    NOT NULL DEFAULT ${NOW},
  updatedAt     TEXT    NOT NULL DEFAULT ${NOW},
  CHECK (requesterId <> ownerId)
);

CREATE INDEX IF NOT EXISTS idx_requests_book      ON BookRequests (bookId);
CREATE INDEX IF NOT EXISTS idx_requests_owner     ON BookRequests (ownerId);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON BookRequests (requesterId);

-- A requester may only have ONE pending request for the same book at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_request
  ON BookRequests (bookId, requesterId) WHERE status = 'pending';
`;
