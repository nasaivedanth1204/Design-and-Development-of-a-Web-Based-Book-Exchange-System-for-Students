import { useMemo } from 'react';
import { AlertCircle, ArrowDown, BookOpenText, Plus, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import BookShelf, { FeaturedShelf, ShelfSkeleton } from '../components/BookShelf.jsx';
import { PREFERENCE_LABELS, SORT_OPTIONS, cx } from '../utils.js';

export const DEFAULT_FILTERS = { search: '', genre: 'all', preference: 'all', status: 'all', sort: 'recent' };

export default function LibraryPage({ meta, filters, onFiltersChange, books, allBooks, loading, error, onRetry, onOpenBook, onRequestBook, onAddBook, currentUserId, requestedIds }) {
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const isFiltered = Object.keys(DEFAULT_FILTERS).some((key) => key !== 'sort' && filters[key] !== DEFAULT_FILTERS[key]);
  const isDefault = !isFiltered && filters.sort === DEFAULT_FILTERS.sort;

  const genreCounts = useMemo(() => {
    const counts = {};
    allBooks.forEach((book) => { if (book.genre) counts[book.genre] = (counts[book.genre] ?? 0) + 1; });
    return counts;
  }, [allBooks]);

  const featured = useMemo(() => allBooks.slice(0, 10), [allBooks]); // allBooks is sorted newest first
  const available = allBooks.filter((book) => book.status === 'available').length;
  const scrollToCollection = () =>
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      {/* Hero: the entrance to the library */}
      <section className="library-backdrop relative border-b border-leather/50">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-9 sm:px-6 sm:pt-14 sm:pb-12">
          <p className="eyebrow ornament">Student Book Exchange</p>
          <h1 className="mt-3 font-serif text-6xl leading-none font-bold tracking-wide text-parchment drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] sm:text-8xl">
            Athenaeum
          </h1>
          <p className="mt-3 font-serif text-2xl text-brass-light italic sm:text-3xl">Discover, Share, and Exchange Books</p>
          <p className="mt-4 max-w-xl text-sm text-vellum sm:text-base">
            A shared shelf for students: {allBooks.length || 'many'} books listed by classmates,{' '}
            <span className="text-parchment">{available} available</span> to borrow, swap or buy today.
          </p>

          <div className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search books</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-sepia-soft" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => set('search', event.target.value)}
                placeholder="Search title, author, publisher, year or category…"
                className="w-full rounded-xl border-2 border-cream-deep bg-cream py-3.5 pr-11 pl-12 text-base text-sepia shadow-2xl shadow-black/50 placeholder:text-sepia-soft/80 focus:border-brass focus:ring-4 focus:ring-brass/30 focus:outline-none"
              />
              {filters.search && (
                <button type="button" onClick={() => set('search', '')} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-sepia-soft hover:bg-cream-deep hover:text-sepia" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <button type="button" onClick={scrollToCollection} className="btn btn-primary px-5 py-3.5 text-base">
              <ArrowDown className="h-5 w-5" /> Explore Library
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-vellum">
            <span>Have a book to share?</span>
            <button type="button" onClick={onAddBook} className="btn btn-ghost bg-ink/60 px-3.5 py-2 backdrop-blur">
              <Plus className="h-4 w-4" /> Add a Book
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Category chips */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-5 sm:mx-0 sm:flex-wrap sm:px-0" role="toolbar" aria-label="Categories">
          {['all', ...meta.genres].map((genre) => {
            const active = filters.genre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => set('genre', genre)}
                aria-pressed={active}
                className={cx('chip', active ? 'border-brass bg-brass text-ink' : 'border-leather bg-walnut/70 text-vellum hover:border-brass/60 hover:text-parchment')}
              >
                {genre === 'all' ? 'All Books' : genre}
                <span className={cx('text-xs', active ? 'text-ink/70' : 'text-dust')}>
                  {genre === 'all' ? allBooks.length : genreCounts[genre] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort and filters */}
        <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="hidden items-center gap-2 px-2 text-xs font-semibold tracking-[0.15em] text-dust uppercase sm:flex">
            <SlidersHorizontal className="h-4 w-4" /> Refine
          </span>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select label="Sort by" value={filters.sort} onChange={(v) => set('sort', v)} options={SORT_OPTIONS} />
            <Select
              label="Listed for"
              value={filters.preference}
              onChange={(v) => set('preference', v)}
              options={[{ value: 'all', label: 'Any listing' }, ...meta.exchangePreferences.map((p) => ({ value: p, label: PREFERENCE_LABELS[p] }))]}
            />
            <Select
              label="Availability"
              value={filters.status}
              onChange={(v) => set('status', v)}
              options={[{ value: 'all', label: 'Any status' }, ...meta.bookStatuses.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]}
            />
          </div>
          <button type="button" onClick={() => onFiltersChange(DEFAULT_FILTERS)} disabled={isDefault} className="btn btn-ghost sm:ml-auto">
            <RotateCcw className="h-4 w-4" /> Reset filters
          </button>
        </div>

        {/* Recently added — a display shelf */}
        {!isFiltered && featured.length > 0 && (
          <section className="mt-10" aria-labelledby="featured-heading">
            <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> New arrivals</p>
            <h2 id="featured-heading" className="mt-1 font-serif text-3xl font-bold">Recently added to the stacks</h2>
            <FeaturedShelf books={featured} onOpen={onOpenBook} />
          </section>
        )}

        {/* Full collection */}
        <section id="collection" className="mt-10 scroll-mt-28 pb-20" aria-labelledby="collection-heading" aria-busy={loading}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow flex items-center gap-1.5"><BookOpenText className="h-3.5 w-3.5" /> The collection</p>
              <h2 id="collection-heading" className="mt-1 font-serif text-3xl font-bold">
                {filters.genre === 'all' ? 'All books' : filters.genre}
              </h2>
            </div>
            {!loading && !error && (
              <p className="text-sm text-dust">
                {books.length} {books.length === 1 ? 'book' : 'books'}
                {filters.search.trim() && <> matching “<span className="text-vellum">{filters.search.trim()}</span>”</>}
              </p>
            )}
          </div>

          {error ? (
            <div className="panel flex flex-col items-center px-6 py-14 text-center">
              <AlertCircle className="h-10 w-10 text-[#f0b7ae]" />
              <h3 className="mt-4 font-serif text-2xl font-semibold">Couldn’t load the library</h3>
              <p className="mt-2 max-w-md text-sm text-vellum">{error}</p>
              <button type="button" onClick={onRetry} className="btn btn-primary mt-6"><RotateCcw className="h-4 w-4" /> Try again</button>
            </div>
          ) : loading && books.length === 0 ? (
            <ShelfSkeleton />
          ) : books.length === 0 ? (
            <div className="panel flex flex-col items-center px-6 py-16 text-center">
              <BookOpenText className="h-12 w-12 text-brass/70" />
              <h3 className="mt-4 font-serif text-2xl font-semibold">No books match your search</h3>
              <p className="mt-2 max-w-md text-sm text-vellum">
                Try a different spelling, another category, or clear the filters to see the whole collection.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => onFiltersChange(DEFAULT_FILTERS)} className="btn btn-ghost"><RotateCcw className="h-4 w-4" /> Reset filters</button>
                <button type="button" onClick={onAddBook} className="btn btn-primary"><Plus className="h-4 w-4" /> Add a Book</button>
              </div>
            </div>
          ) : (
            <div className={cx('transition-opacity', loading && 'opacity-60')}>
              <BookShelf books={books} onOpen={onOpenBook} onRequest={onRequestBook} currentUserId={currentUserId} requestedIds={requestedIds} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-[0.65rem] font-semibold tracking-[0.12em] text-dust uppercase">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field py-2 sm:w-auto">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
