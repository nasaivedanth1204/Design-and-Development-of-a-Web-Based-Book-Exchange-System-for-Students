import BookCover from './BookCover.jsx';
import { PreferenceBadge } from './Badges.jsx';
import { cx, formatPrice } from '../utils.js';

export default function BookCard({ book, onOpen, isMine }) {
  const unavailable = book.status !== 'available';
  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      className="group flex w-full flex-col text-left focus-visible:outline-none"
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:-rotate-1 group-focus-visible:-translate-y-2">
        <BookCover
          src={book.coverImage}
          title={book.title}
          author={book.author}
          className={cx('aspect-[2/3] w-full transition-shadow duration-300 group-hover:shadow-[8px_14px_26px_rgb(0_0_0/0.7)] group-focus-visible:ring-2 group-focus-visible:ring-brass', unavailable && 'opacity-70 saturate-50')}
        />
        <div className="pointer-events-none absolute inset-x-1.5 top-1.5 flex flex-wrap justify-between gap-1">
          {unavailable ? (
            <span className="rounded-full bg-ink/85 px-2 py-0.5 text-[0.62rem] font-semibold tracking-wider text-brass-light uppercase">{book.status}</span>
          ) : <span />}
          {isMine && <span className="rounded-full bg-brass/90 px-2 py-0.5 text-[0.62rem] font-bold tracking-wider text-ink uppercase">Yours</span>}
        </div>
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="line-clamp-2 font-serif text-[1.05rem] leading-snug font-semibold text-parchment transition-colors group-hover:text-brass-light">
          {book.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-vellum">{book.author}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {book.genre && <span className="text-[0.68rem] tracking-wider text-dust uppercase">{book.genre}</span>}
          <PreferenceBadge preference={book.exchangePreference} className="!px-2 !text-[0.6rem]" />
          {book.price !== null && <span className="text-xs font-semibold text-brass">{formatPrice(book.price)}</span>}
        </div>
      </div>
    </button>
  );
}
