import { Clock, Pencil, Send, Trash2, UserRound } from 'lucide-react';
import Modal from './Modal.jsx';
import BookCover from './BookCover.jsx';
import { PREFERENCE_LABELS, formatDate, formatPrice, show } from '../utils.js';

const STATUS_DOT = { available: 'bg-[#4f7a3f]', reserved: 'bg-[#b07a22]', unavailable: 'bg-[#9a3a2e]' };

export default function BookDetailsModal({ book, open, onClose, currentUser, pendingRequest, onRequest, onEdit, onDelete, onViewRequests }) {
  if (!book) return null;
  const isOwner = currentUser?.id === book.ownerId;

  const details = [
    ['Author', book.author],
    ['Publisher', book.publisher],
    ['Published', book.publicationYear],
    ['Category', book.genre],
    ['Owner', book.ownerName],
    ['Listed for', PREFERENCE_LABELS[book.exchangePreference]],
    ['Price', book.exchangePreference === 'sell' ? (formatPrice(book.price) ?? 'Negotiable') : null],
    ['Availability', (
      <span key="s" className="inline-flex items-center gap-1.5 capitalize">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[book.status]}`} />{book.status}
      </span>
    )],
    ['Added', formatDate(book.createdAt)],
  ];

  let action;
  if (isOwner) {
    action = (
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => onEdit(book)}>
          <Pencil className="h-4 w-4" /> Edit book
        </button>
        <button type="button" className="btn btn-danger" onClick={() => onDelete(book)}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
        {book.pendingRequests > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onViewRequests}>
            {book.pendingRequests} pending request{book.pendingRequests === 1 ? '' : 's'} →
          </button>
        )}
      </div>
    );
  } else if (pendingRequest) {
    action = (
      <p className="flex items-center gap-2 rounded-lg border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass-light">
        <Clock className="h-4 w-4 shrink-0" /> You requested this book on {formatDate(pendingRequest.createdAt)}. Waiting for {book.ownerName} to respond.
      </p>
    );
  } else if (book.status !== 'available') {
    action = (
      <p className="rounded-lg border border-leather bg-ink/50 px-4 py-3 text-sm text-vellum">
        This book is currently <strong className="text-parchment">{book.status}</strong> and cannot be requested.
      </p>
    );
  } else {
    action = (
      <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => onRequest(book)}>
        <Send className="h-4 w-4" /> Request This Book
      </button>
    );
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" labelledBy="book-details-title">
      <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8 sm:p-8">
        <div className="mx-auto w-44 sm:w-full">
          <BookCover src={book.coverImage} title={book.title} author={book.author} className="aspect-[2/3] w-full" />
        </div>

        <div className="min-w-0">
          <p className="eyebrow">{book.genre ?? 'Uncategorised'}</p>
          <h2 id="book-details-title" className="mt-1 pr-8 font-serif text-3xl leading-tight font-bold sm:text-4xl">{book.title}</h2>
          <p className="mt-1 font-serif text-lg text-vellum italic">by {book.author}</p>

          <p className="mt-4 text-sm leading-relaxed text-vellum">
            {book.description ?? <span className="text-dust italic">No description has been added for this book.</span>}
          </p>

          {/* Library catalogue card */}
          <div className="mt-6 overflow-hidden rounded-md border border-cream-deep bg-cream text-sepia shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
            <div className="flex items-center justify-between border-b-2 border-[#b4553f]/70 px-4 pt-3 pb-2">
              <span className="font-serif text-sm font-semibold tracking-[0.2em] uppercase">Catalogue card</span>
              <span className="font-mono text-xs text-sepia-soft">No. {String(book.id).padStart(4, '0')}</span>
            </div>
            <dl className="grid grid-cols-1 px-4 pb-2 text-sm sm:grid-cols-2 sm:gap-x-6">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[#2b2017]/12 py-2 last:border-b-0 sm:block">
                  <dt className="text-[0.65rem] font-semibold tracking-[0.14em] text-sepia-soft uppercase">{label}</dt>
                  <dd className="text-right font-medium sm:mt-0.5 sm:text-left">{show(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-7">{action}</div>
          {isOwner ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-dust"><UserRound className="h-3.5 w-3.5" /> You are viewing your own listing.</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
