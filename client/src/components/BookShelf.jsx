import BookCard from './BookCard.jsx';
import BookCover from './BookCover.jsx';

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

/** The full collection as a responsive grid of book cards. */
export default function BookShelf({ books, onOpen, onRequest, currentUserId, requestedIds }) {
  return (
    <div className={GRID}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onOpen={onOpen}
          onRequest={onRequest}
          isMine={book.ownerId === currentUserId}
          requested={requestedIds.has(book.id)}
        />
      ))}
    </div>
  );
}

/** "Recently added": covers standing on a wooden ledge, like a display shelf. */
export function FeaturedShelf({ books, onOpen }) {
  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pt-4 pb-8 sm:mx-0 sm:px-0">
      <div className="shelf-ledge flex min-w-max items-end gap-5 px-5 pb-[0.9rem] sm:gap-7 sm:px-8">
        {books.map((book) => (
          <button
            key={book.id}
            type="button"
            onClick={() => onOpen(book)}
            title={`${book.title} — ${book.author}`}
            aria-label={`View details of ${book.title} by ${book.author}`}
            className="group relative w-24 shrink-0 focus-visible:outline-none sm:w-32"
          >
            <BookCover
              src={book.coverImage}
              title={book.title}
              author={book.author}
              className="aspect-[2/3] w-full origin-bottom transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1.5deg] group-focus-visible:-translate-y-2 group-focus-visible:ring-2 group-focus-visible:ring-brass motion-reduce:group-hover:translate-y-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShelfSkeleton({ count = 12 }) {
  return (
    <div className={GRID} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-leather/60 bg-mahogany/70 p-3">
          <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-leather/60" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-leather/60" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-leather/40" />
        </div>
      ))}
    </div>
  );
}
