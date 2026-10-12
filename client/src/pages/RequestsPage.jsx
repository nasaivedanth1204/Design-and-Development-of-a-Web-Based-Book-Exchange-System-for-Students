import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Inbox, Library, Loader2, Pencil, RotateCcw, Send, Trash2, X } from 'lucide-react';
import BookCover from '../components/BookCover.jsx';
import { PreferenceBadge, RequestStatusBadge, StatusBadge } from '../components/Badges.jsx';
import { api } from '../api.js';
import { REQUEST_TYPE_LABELS, cx, formatDate, formatPrice } from '../utils.js';

const TABS = [
  { id: 'incoming', label: 'Incoming', icon: Inbox },
  { id: 'outgoing', label: 'Sent by me', icon: Send },
  { id: 'listings', label: 'My listings', icon: Library },
];

/**
 * Owner dashboard for the selected mock user:
 *  - Incoming: requests for my books (accept / reject)
 *  - Sent by me: my requests and their status (cancel while pending)
 *  - My listings: books I have added (edit / delete)
 */
export default function RequestsPage({ currentUser, tab, onTabChange, refreshKey, onDataChanged, notify, onOpenBook, onEditBook, onDeleteBook, onAddBook }) {
  const [data, setData] = useState({ incoming: [], outgoing: [], listings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const [incoming, outgoing, listings] = await Promise.all([
        api.incomingRequests(currentUser.id),
        api.outgoingRequests(currentUser.id),
        api.ownerBooks(currentUser.id),
      ]);
      setData({ incoming, outgoing, listings });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const changeStatus = async (request, status) => {
    setBusyId(request.id);
    try {
      const { autoRejected } = await api.updateRequestStatus(request.id, status, currentUser.id);
      const messages = {
        accepted: `Accepted ${request.requesterName}’s request. “${request.bookTitle}” is now reserved.`,
        rejected: `Rejected ${request.requesterName}’s request for “${request.bookTitle}”.`,
        cancelled: `Cancelled your request for “${request.bookTitle}”.`,
      };
      notify('success', messages[status] + (autoRejected ? ` ${autoRejected} other pending request${autoRejected === 1 ? ' was' : 's were'} declined automatically.` : ''));
      onDataChanged();
    } catch (err) {
      notify('error', err.message);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    incoming: data.incoming.filter((r) => r.status === 'pending').length,
    outgoing: data.outgoing.filter((r) => r.status === 'pending').length,
    listings: data.listings.length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="eyebrow">Circulation desk</p>
      <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">Book Requests</h1>
      <p className="mt-3 max-w-2xl text-vellum">
        Showing activity for <strong className="text-brass-light">{currentUser?.name}</strong>. Switch the
        “Acting as” selector at the top to see the exchange from another student’s side.
      </p>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto border-b border-leather/70" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTabChange(id)}
            className={cx('-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition', tab === id ? 'border-brass text-brass-light' : 'border-transparent text-vellum hover:text-parchment')}
          >
            <Icon className="h-4 w-4" /> {label}
            {counts[id] > 0 && <span className={cx('rounded-full px-1.5 text-[0.7rem] leading-5 font-semibold', id === 'listings' ? 'bg-leather text-vellum' : 'bg-oxblood text-parchment')}>{counts[id]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <div className="panel flex flex-col items-center px-6 py-12 text-center">
            <AlertCircle className="h-9 w-9 text-[#f0b7ae]" />
            <p className="mt-3 text-vellum">{error}</p>
            <button type="button" className="btn btn-primary mt-5" onClick={load}><RotateCcw className="h-4 w-4" /> Try again</button>
          </div>
        ) : loading && !data[tab].length ? (
          <div className="flex justify-center py-16 text-dust"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tab === 'listings' ? (
          <Listings books={data.listings} onOpenBook={onOpenBook} onEditBook={onEditBook} onDeleteBook={onDeleteBook} onAddBook={onAddBook} />
        ) : data[tab].length === 0 ? (
          <Empty tab={tab} />
        ) : (
          <ul className="grid gap-4">
            {data[tab].map((request) => (
              <RequestCard key={request.id} request={request} direction={tab} busy={busyId === request.id} onChangeStatus={changeStatus} onOpenBook={onOpenBook} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, direction, busy, onChangeStatus, onOpenBook }) {
  const incoming = direction === 'incoming';
  const pending = request.status === 'pending';
  return (
    <li className={cx('panel flex flex-col gap-4 p-4 sm:flex-row sm:p-5', !pending && 'opacity-80')}>
      <button type="button" onClick={() => onOpenBook(request.bookId)} className="w-16 shrink-0 self-start sm:w-20" aria-label={`Open ${request.bookTitle}`}>
        <BookCover src={request.bookCover} title={request.bookTitle} compact className="aspect-[2/3] w-full" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={request.status} />
          <span className="rounded-full border border-leather px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-vellum uppercase">{REQUEST_TYPE_LABELS[request.requestType]}</span>
          <span className="text-xs text-dust">{formatDate(request.createdAt, true)}</span>
        </div>
        <h3 className="mt-2 font-serif text-xl leading-snug font-semibold">
          <button type="button" className="text-left hover:text-brass-light" onClick={() => onOpenBook(request.bookId)}>{request.bookTitle}</button>
        </h3>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-vellum">
          <span className={cx(incoming && 'font-medium text-parchment')}>{request.requesterName}</span>
          <ArrowRight className="h-3.5 w-3.5 text-dust" />
          <span className={cx(!incoming && 'font-medium text-parchment')}>{request.ownerName}</span>
          {request.bookPrice !== null && request.requestType === 'purchase' && <span className="text-brass">· {formatPrice(request.bookPrice)}</span>}
        </p>
        {request.message ? (
          <blockquote className="mt-3 border-l-2 border-brass/40 pl-3 font-serif text-[0.98rem] text-vellum italic">“{request.message}”</blockquote>
        ) : (
          <p className="mt-3 text-xs text-dust italic">No message.</p>
        )}
        {request.status === 'accepted' && (
          <p className="mt-3 text-xs text-[#cfe3c2]">
            {incoming ? 'You accepted this request — the book is reserved for them.' : 'Accepted! Arrange the hand-over with the owner on campus.'}
          </p>
        )}
      </div>

      {pending && (
        <div className="flex gap-2 sm:flex-col sm:justify-center">
          {incoming ? (
            <>
              <button type="button" className="btn btn-success flex-1" disabled={busy} onClick={() => onChangeStatus(request, 'accepted')}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
              </button>
              <button type="button" className="btn btn-danger flex-1" disabled={busy} onClick={() => onChangeStatus(request, 'rejected')}>
                <X className="h-4 w-4" /> Reject
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost flex-1" disabled={busy} onClick={() => onChangeStatus(request, 'cancelled')}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Cancel request
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function Listings({ books, onOpenBook, onEditBook, onDeleteBook, onAddBook }) {
  if (books.length === 0) {
    return (
      <div className="panel flex flex-col items-center px-6 py-14 text-center">
        <Library className="h-10 w-10 text-brass/70" />
        <h3 className="mt-4 font-serif text-2xl font-semibold">No books listed yet</h3>
        <p className="mt-2 text-sm text-vellum">Add a book and it will appear here and in the library.</p>
        <button type="button" className="btn btn-primary mt-6" onClick={onAddBook}>Add a Book</button>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {books.map((book) => (
        <li key={book.id} className="panel flex gap-4 p-4">
          <button type="button" onClick={() => onOpenBook(book.id)} className="w-20 shrink-0 self-start" aria-label={`Open ${book.title}`}>
            <BookCover src={book.coverImage} title={book.title} author={book.author} compact className="aspect-[2/3] w-full" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="line-clamp-2 font-serif text-lg leading-snug font-semibold">{book.title}</h3>
            <p className="truncate text-xs text-vellum">{book.author}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge status={book.status} />
              <PreferenceBadge preference={book.exchangePreference} />
            </div>
            {book.pendingRequests > 0 && <p className="mt-2 text-xs text-brass-light">{book.pendingRequests} pending request{book.pendingRequests === 1 ? '' : 's'}</p>}
            <div className="mt-auto flex gap-2 pt-3">
              <button type="button" className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => onEditBook(book)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" className="btn btn-danger px-3 py-1.5 text-xs" onClick={() => onDeleteBook(book)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ tab }) {
  const text = tab === 'incoming'
    ? ['No requests yet', 'When another student requests one of your books, it will appear here for you to accept or reject.']
    : ['You haven’t requested any books', 'Open any book in the library that belongs to someone else and choose “Request This Book”.'];
  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      <Inbox className="h-10 w-10 text-brass/70" />
      <h3 className="mt-4 font-serif text-2xl font-semibold">{text[0]}</h3>
      <p className="mt-2 max-w-md text-sm text-vellum">{text[1]}</p>
    </div>
  );
}
