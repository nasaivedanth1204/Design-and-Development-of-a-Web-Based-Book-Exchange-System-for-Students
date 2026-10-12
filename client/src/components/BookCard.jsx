import { BookOpen, Check, Send, Settings2 } from 'lucide-react';
import BookCover from './BookCover.jsx';
import { PreferenceBadge } from './Badges.jsx';
import { cx, formatPrice } from '../utils.js';

/**
 * One book in the catalogue grid: cover, title, author, genre and the two
 * main actions (View details / Request). The request button reflects the real
 * state — your own book, already requested by you, or not available.
 */
export default function BookCard({ book, onOpen, onRequest, isMine, requested }) {
  const available = book.status === 'available';

  let requestButton;
  if (isMine) {
    requestButton = (
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="inline-flex items-center gap-1.5 rounded-md border border-brass/40 px-2.5 py-1.5 text-xs font-semibold text-brass-light transition hover:bg-brass/15"
        aria-label={`Manage ${book.title}`}
      >
        <Settings2 className="h-3.5 w-3.5" /> Manage
      </button>
    );
  } else if (requested) {
    requestButton = (
      <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold tracking-wider text-brass-light uppercase">
        <Check className="h-3.5 w-3.5" /> Requested
      </span>
    );
  } else if (!available) {
    requestButton = <span className="text-[0.7rem] font-semibold tracking-wider text-dust uppercase">{book.status}</span>;
  } else {
    requestButton = (
      <button
        type="button"
        onClick={() => onRequest(book)}
        className="inline-flex items-center gap-1.5 rounded-md bg-brass/90 px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-brass-light active:scale-95"
        aria-label={`Request ${book.title}`}
      >
        <Send className="h-3.5 w-3.5" /> Request
      </button>
    );
  }

  return (
    <article className="group flex h-full flex-col rounded-xl border border-leather/80 bg-mahogany/95 p-3 shadow-lg shadow-black/30 transition duration-300 ease-out hover:-translate-y-1 hover:border-brass/40 hover:shadow-2xl hover:shadow-black/50 motion-reduce:hover:translate-y-0">
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="relative block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        aria-label={`View details of ${book.title} by ${book.author}`}
      >
        <BookCover
          src={book.coverImage}
          title={book.title}
          author={book.author}
          className={cx('aspect-[2/3] w-full', !available && 'opacity-75 saturate-50')}
        />
        <div className="pointer-events-none absolute inset-x-1.5 top-1.5 flex flex-wrap justify-between gap-1">
          {!available ? (
            <span className="rounded-full bg-ink/85 px-2 py-0.5 text-[0.62rem] font-semibold tracking-wider text-brass-light uppercase">{book.status}</span>
          ) : <span />}
          {isMine && <span className="rounded-full bg-brass/90 px-2 py-0.5 text-[0.62rem] font-bold tracking-wider text-ink uppercase">Yours</span>}
        </div>
      </button>

      <div className="mt-3 flex min-w-0 flex-1 flex-col">
        {book.genre && <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-brass/90 uppercase">{book.genre}</p>}
        <h3 className="mt-0.5 line-clamp-2 font-serif text-[1.1rem] leading-snug font-semibold text-parchment">
          <button type="button" onClick={() => onOpen(book)} className="text-left transition-colors hover:text-brass-light">
            {book.title}
          </button>
        </h3>
        <p className="mt-0.5 truncate text-xs text-vellum">{book.author}</p>
        <div className="mt-2 mb-3 flex flex-wrap items-center gap-1.5">
          <PreferenceBadge preference={book.exchangePreference} className="!px-2 !text-[0.6rem]" />
          {book.price !== null && <span className="text-xs font-semibold text-brass">{formatPrice(book.price)}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-leather/70 pt-2.5">
          <button
            type="button"
            onClick={() => onOpen(book)}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs font-medium text-vellum transition hover:bg-walnut hover:text-parchment"
          >
            <BookOpen className="h-3.5 w-3.5" /> Details
          </button>
          {requestButton}
        </div>
      </div>
    </article>
  );
}
