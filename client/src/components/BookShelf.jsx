import BookCard from './BookCard.jsx';

/** The full collection, laid out on wooden shelves. */
export default function BookShelf({ books, onOpen, currentUserId }) {
  return (
    <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book) => (
        <div key={book.id} className="shelf-cell flex items-end">
          <div className="w-full self-start">
            <BookCard book={book} onOpen={onOpen} isMine={book.ownerId === currentUserId} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShelfSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="shelf-cell">
          <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-mahogany" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-mahogany" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-mahogany/70" />
        </div>
      ))}
    </div>
  );
}
