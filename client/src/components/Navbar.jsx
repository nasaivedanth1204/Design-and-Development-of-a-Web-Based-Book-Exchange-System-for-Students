import { BookMarked, Inbox, LayoutGrid, Library, Plus, UserRound } from 'lucide-react';
import { cx, initials } from '../utils.js';

const LINKS = [
  { view: 'library', label: 'Library', icon: Library },
  { view: 'categories', label: 'Categories', icon: LayoutGrid },
  { view: 'requests', label: 'Book Requests', icon: Inbox },
];

export default function Navbar({ view, onNavigate, onAddBook, owners, currentUserId, onChangeUser, pendingIncoming }) {
  const currentUser = owners.find((owner) => owner.id === currentUserId);

  const navButton = ({ view: target, label, icon: Icon }) => (
    <button
      key={target}
      type="button"
      onClick={() => onNavigate(target)}
      aria-current={view === target ? 'page' : undefined}
      className={cx(
        'relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
        view === target ? 'bg-brass/15 text-brass-light' : 'text-vellum hover:bg-mahogany hover:text-parchment',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {target === 'requests' && pendingIncoming > 0 && (
        <span className="ml-0.5 rounded-full bg-oxblood px-1.5 text-[0.7rem] leading-5 font-semibold text-parchment">
          {pendingIncoming}
        </span>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-leather/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <button type="button" onClick={() => onNavigate('library')} className="flex shrink-0 items-center gap-2.5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brass/40 bg-mahogany text-brass shadow-inner">
            <BookMarked className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-xl font-bold tracking-wide text-parchment">Athenaeum</span>
            <span className="hidden text-[0.65rem] tracking-[0.2em] text-dust uppercase sm:block">Student Book Exchange</span>
          </span>
        </button>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.slice(0, 2).map(navButton)}
          <button type="button" onClick={onAddBook} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vellum transition hover:bg-mahogany hover:text-parchment">
            <Plus className="h-4 w-4" /> Add a Book
          </button>
          {navButton(LINKS[2])}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-leather bg-walnut/80 py-1 pr-1 pl-1.5" title="Choose which mock student you are acting as">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/20 text-xs font-bold text-brass-light">
              {currentUser ? initials(currentUser.name) : <UserRound className="h-4 w-4" />}
            </span>
            <span className="hidden text-[0.65rem] leading-tight tracking-[0.15em] text-dust uppercase sm:block">Acting<br />as</span>
            <select
              value={currentUserId ?? ''}
              onChange={(event) => onChangeUser(event.target.value)}
              className="max-w-[9.5rem] rounded-lg bg-transparent py-1.5 pr-1 text-sm font-medium text-parchment focus:outline-none"
              aria-label="Acting as (mock owner)"
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id} className="bg-walnut">{owner.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onAddBook} className="btn btn-primary hidden sm:inline-flex lg:hidden">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* Compact navigation for phones and tablets */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-leather/50 px-3 py-2 lg:hidden" aria-label="Main mobile">
        {LINKS.slice(0, 2).map(navButton)}
        <button type="button" onClick={onAddBook} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vellum hover:bg-mahogany">
          <Plus className="h-4 w-4" /> Add a Book
        </button>
        {navButton(LINKS[2])}
      </nav>
    </header>
  );
}
