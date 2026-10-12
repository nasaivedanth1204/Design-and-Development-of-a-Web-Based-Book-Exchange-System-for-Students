import { useMemo } from 'react';
import { AlertCircle, BookOpenText, Plus, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import BookShelf, { ShelfSkeleton } from '../components/BookShelf.jsx';
import BookCard from '../components/BookCard.jsx';
import { PREFERENCE_LABELS, SORT_OPTIONS, cx } from '../utils.js';

export const DEFAULT_FILTERS = { search: '', genre: 'all', preference: 'all', status: 'all', sort: 'recent' };

export default function LibraryPage({ meta, filters, onFiltersChange, books, allBooks, loading, error, onRetry, onOpenBook, onAddBook, currentUserId }) {
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

  return (
    <div>
      {/* Hero + search */}
      <section className="relative overflow-hidden border-b border-leather/50">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12">
          <p className="eyebrow">The student library · est. on campus</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] font-bold text-parchment sm:text-6xl">
            Every book on this shelf belongs to <em className="text-brass-light">a fellow student.</em>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-vellum sm:text-lg">
            Browse {allBooks.length || 'the'} books, borrow what you need, and pass on what you have finished.
            <span className="text-dust"> {available} available right now.</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search books</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brass" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => set('search', event.target.value)}
                placeholder="Search by title, author, publisher, year or category…"
                className="w-full rounded-2xl border border-leather bg-walnut/90 py-4 pr-12 pl-12 text-base text-parchment shadow-xl shadow-black/30 placeholder:text-dust focus:border-brass/70 focus:ring-4 focus:ring-brass/15 focus:outline-none"
              />
              {filters.search && (
                <button type="button" onClick={() => set('search', '')} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-dust hover:bg-mahogany hover:text-parchment" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <button type="button" onClick={onAddBook} className="btn btn-primary px-6 py-4 text-base">
              <Plus className="h-5 w-5" /> Add a Book
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

        {/* Recently added */}
        {!isFiltered && featured.length > 0 && (
          <section className="mt-10" aria-labelledby="featured-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> New arrivals</p>
                <h2 id="featured-heading" className="mt-1 font-serif text-3xl font-bold">Recently added to the stacks</h2>
              </div>
            </div>
            <div className="scrollbar-thin -mx-4 mt-5 flex snap-x gap-5 overflow-x-auto px-4 pt-3 pb-6 sm:mx-0 sm:px-1">
              {featured.map((book) => (
                <div key={book.id} className="w-32 shrink-0 snap-start sm:w-40">
                  <BookCard book={book} onOpen={onOpenBook} isMine={book.ownerId === currentUserId} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full collection */}
        <section className="mt-10 pb-20" aria-labelledby="collection-heading" aria-busy={loading}>
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
              <BookShelf books={books} onOpen={onOpenBook} currentUserId={currentUserId} />
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
