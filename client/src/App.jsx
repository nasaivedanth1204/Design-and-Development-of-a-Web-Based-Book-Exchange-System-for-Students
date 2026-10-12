import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, Loader2, RotateCcw } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Toasts from './components/Toasts.jsx';
import BookDetailsModal from './components/BookDetailsModal.jsx';
import BookFormModal from './components/BookFormModal.jsx';
import RequestModal from './components/RequestModal.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import LibraryPage, { DEFAULT_FILTERS } from './pages/LibraryPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import RequestsPage from './pages/RequestsPage.jsx';
import { api } from './api.js';

const USER_KEY = 'athenaeum.currentUser';
const VIEWS = ['library', 'categories', 'requests'];
const REQUEST_TABS = ['incoming', 'outgoing', 'listings'];

// The current page lives in the URL hash (#/library, #/requests/outgoing …)
// so a browser refresh keeps you on the same page.
function readHash() {
  const [view, tab] = window.location.hash.replace(/^#\/?/, '').split('/');
  return {
    view: VIEWS.includes(view) ? view : 'library',
    tab: REQUEST_TABS.includes(tab) ? tab : 'incoming',
  };
}

function readStoredUser() {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);
  const [route, setRoute] = useState(readHash);
  const [currentUserId, setCurrentUserId] = useState(readStoredUser);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [outgoing, setOutgoing] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [detailsBook, setDetailsBook] = useState(null);
  const [formState, setFormState] = useState({ open: false, book: null });
  const [requestBook, setRequestBook] = useState(null);
  const [deleteState, setDeleteState] = useState({ book: null, busy: false });
  const [toasts, setToasts] = useState([]);

  const currentUser = meta?.owners.find((owner) => owner.id === currentUserId) ?? null;

  // ── Toast notifications ──────────────────────────────────────────────
  const notify = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), type === 'error' ? 7000 : 4500);
  }, []);
  const dismissToast = (id) => setToasts((list) => list.filter((toast) => toast.id !== id));

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  // ── Routing ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((view, tab) => {
    window.location.hash = view === 'requests' ? `/requests/${tab ?? 'incoming'}` : `/${view}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Initial metadata (owners, categories …), retried while the API boots ──
  const loadMeta = useCallback(async () => {
    setMetaError(null);
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      try {
        const data = await api.meta();
        setMeta(data);
        setCurrentUserId((id) => (data.owners.some((owner) => owner.id === id) ? id : data.owners[0].id));
        return;
      } catch (error) {
        if (attempt === 6) setMetaError(error.message);
        else await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }, []);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  useEffect(() => {
    if (!currentUserId) return;
    try { localStorage.setItem(USER_KEY, currentUserId); } catch { /* storage unavailable */ }
  }, [currentUserId]);

  // ── Books (always loaded from the database via the API) ──────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 250);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const latestQuery = useRef(0);
  const loadBooks = useCallback(async () => {
    const queryId = ++latestQuery.current;
    setLoading(true);
    try {
      const [filtered, everything] = await Promise.all([
        api.listBooks({ ...filters, search: debouncedSearch }),
        api.listBooks({ sort: 'recent' }),
      ]);
      if (queryId !== latestQuery.current) return; // a newer search has started
      setBooks(filtered);
      setAllBooks(everything);
      setLoadError(null);
    } catch (error) {
      if (queryId === latestQuery.current) setLoadError(error.message);
    } finally {
      if (queryId === latestQuery.current) setLoading(false);
    }
    // filters.search is intentionally replaced by the debounced value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.genre, filters.preference, filters.status, filters.sort]);

  useEffect(() => {
    if (meta) loadBooks();
  }, [meta, loadBooks, refreshKey]);

  // Requests for the current user: used for nav badge and "already requested" state.
  useEffect(() => {
    if (!meta || !currentUserId) return;
    let cancelled = false;
    Promise.all([api.outgoingRequests(currentUserId), api.incomingRequests(currentUserId)])
      .then(([out, incoming]) => {
        if (cancelled) return;
        setOutgoing(out);
        setPendingIncoming(incoming.filter((request) => request.status === 'pending').length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [meta, currentUserId, refreshKey]);

  // Keep an open details modal in sync with the latest data.
  useEffect(() => {
    if (!detailsBook) return;
    const fresh = allBooks.find((book) => book.id === detailsBook.id);
    if (fresh && fresh.updatedAt !== detailsBook.updatedAt) setDetailsBook(fresh);
    if (fresh && fresh.pendingRequests !== detailsBook.pendingRequests) setDetailsBook(fresh);
  }, [allBooks, detailsBook]);

  const pendingRequestFor = useMemo(() => {
    if (!detailsBook) return null;
    return outgoing.find((request) => request.bookId === detailsBook.id && request.status === 'pending') ?? null;
  }, [outgoing, detailsBook]);

  // ── Actions ──────────────────────────────────────────────────────────
  const openBook = useCallback(async (bookOrId) => {
    if (typeof bookOrId === 'object') {
      setDetailsBook(bookOrId);
      return;
    }
    try {
      setDetailsBook(await api.getBook(bookOrId));
    } catch (error) {
      notify('error', error.message);
    }
  }, [notify]);

  const openAddForm = () => setFormState({ open: true, book: null });
  const openEditForm = (book) => {
    setDetailsBook(null);
    setFormState({ open: true, book });
  };

  const handleSaved = (saved, isEdit) => {
    setFormState({ open: false, book: null });
    notify('success', isEdit ? `Saved changes to “${saved.title}”.` : `“${saved.title}” was added to the library.`);
    refresh();
    if (isEdit) setDetailsBook(saved);
    else if (route.view === 'categories') navigate('library');
  };

  const handleRequestCreated = (request) => {
    setRequestBook(null);
    notify('success', `Request sent to ${request.ownerName} for “${request.bookTitle}”.`);
    refresh();
  };

  const confirmDelete = async () => {
    const { book } = deleteState;
    setDeleteState({ book, busy: true });
    try {
      const result = await api.deleteBook(book.id, currentUserId);
      notify('success', `Deleted “${book.title}”${result.removedRequests ? ` and ${result.removedRequests} related request${result.removedRequests === 1 ? '' : 's'}` : ''}.`);
      setDeleteState({ book: null, busy: false });
      setDetailsBook(null);
      refresh();
    } catch (error) {
      notify('error', error.message);
      setDeleteState({ book, busy: false });
    }
  };

  const changeUser = (id) => {
    setCurrentUserId(id);
    const owner = meta.owners.find((o) => o.id === id);
    notify('info', `Now acting as ${owner?.name}.`);
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (!meta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <BookMarked className="h-12 w-12 text-brass" />
        <h1 className="mt-4 font-serif text-4xl font-bold">Athenaeum</h1>
        {metaError ? (
          <>
            <p className="mt-3 max-w-md text-vellum">{metaError}</p>
            <p className="mt-1 text-sm text-dust">Start everything with <code className="text-brass-light">npm run dev</code> from the project folder.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={loadMeta}><RotateCcw className="h-4 w-4" /> Try again</button>
          </>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-vellum"><Loader2 className="h-4 w-4 animate-spin" /> Opening the library…</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brass focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <Navbar
        view={route.view}
        onNavigate={navigate}
        onAddBook={openAddForm}
        owners={meta.owners}
        currentUserId={currentUserId}
        onChangeUser={changeUser}
        pendingIncoming={pendingIncoming}
      />

      <main id="main">
        {route.view === 'library' && (
          <LibraryPage
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            books={books}
            allBooks={allBooks}
            loading={loading}
            error={loadError}
            onRetry={loadBooks}
            onOpenBook={openBook}
            onAddBook={openAddForm}
            currentUserId={currentUserId}
          />
        )}
        {route.view === 'categories' && (
          <CategoriesPage
            meta={meta}
            allBooks={allBooks}
            onSelectGenre={(genre) => {
              setFilters({ ...DEFAULT_FILTERS, genre });
              navigate('library');
            }}
          />
        )}
        {route.view === 'requests' && (
          <RequestsPage
            currentUser={currentUser}
            tab={route.tab}
            onTabChange={(tab) => navigate('requests', tab)}
            refreshKey={refreshKey}
            onDataChanged={refresh}
            notify={notify}
            onOpenBook={openBook}
            onEditBook={openEditForm}
            onDeleteBook={(book) => setDeleteState({ book, busy: false })}
            onAddBook={openAddForm}
          />
        )}
      </main>

      <footer className="border-t border-leather/60 py-8 text-center text-xs text-dust">
        Athenaeum · Student Book Exchange — an academic full-stack project (React, Express &amp; SQLite).
      </footer>

      <BookDetailsModal
        book={detailsBook}
        open={Boolean(detailsBook)}
        onClose={() => setDetailsBook(null)}
        currentUser={currentUser}
        pendingRequest={pendingRequestFor}
        onRequest={(book) => {
          setDetailsBook(null);
          setRequestBook(book);
        }}
        onEdit={openEditForm}
        onDelete={(book) => setDeleteState({ book, busy: false })}
        onViewRequests={() => {
          setDetailsBook(null);
          navigate('requests', 'incoming');
        }}
      />

      <BookFormModal
        open={formState.open}
        book={formState.book}
        meta={meta}
        currentUserId={currentUserId}
        onClose={() => setFormState({ open: false, book: null })}
        onSaved={handleSaved}
        notify={notify}
      />

      <RequestModal
        key={requestBook?.id ?? 'none'}
        book={requestBook}
        open={Boolean(requestBook)}
        onClose={() => setRequestBook(null)}
        owners={meta.owners}
        requestTypes={meta.requestTypes}
        currentUserId={currentUserId}
        onCreated={handleRequestCreated}
        notify={notify}
      />

      <ConfirmDialog
        open={Boolean(deleteState.book)}
        title="Delete this book?"
        message={
          deleteState.book
            ? `“${deleteState.book.title}” will be permanently removed from the library${deleteState.book.pendingRequests ? `, along with its ${deleteState.book.pendingRequests} pending request${deleteState.book.pendingRequests === 1 ? '' : 's'}` : ' together with any requests made for it'}. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete book"
        busy={deleteState.busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteState({ book: null, busy: false })}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
