import { useMemo } from 'react';
import { Atom, BookHeart, Briefcase, Cpu, Feather, Landmark, Library, Shapes, Sigma, Sparkles, Terminal, Wrench } from 'lucide-react';
import BookCover from '../components/BookCover.jsx';
import PageBanner from '../components/PageBanner.jsx';

const ICONS = {
  Fiction: BookHeart,
  Literature: Feather,
  Science: Atom,
  Technology: Cpu,
  'Computer Science': Terminal,
  Engineering: Wrench,
  Mathematics: Sigma,
  History: Landmark,
  Business: Briefcase,
  'Self-Help': Sparkles,
  Other: Shapes,
};

export default function CategoriesPage({ meta, allBooks, onSelectGenre }) {
  const byGenre = useMemo(() => {
    const groups = Object.fromEntries(meta.genres.map((genre) => [genre, []]));
    allBooks.forEach((book) => book.genre && groups[book.genre]?.push(book));
    return groups;
  }, [allBooks, meta.genres]);

  const uncategorised = allBooks.filter((book) => !book.genre).length;

  return (
    <>
      <PageBanner eyebrow="Browse the reading rooms" title="Categories">
        Pick a reading room to see every book shelved there.
      </PageBanner>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CategoryTile
            name="All Books"
            icon={Library}
            books={allBooks}
            onClick={() => onSelectGenre('all')}
          />
          {meta.genres.map((genre) => (
            <CategoryTile key={genre} name={genre} icon={ICONS[genre] ?? Shapes} books={byGenre[genre]} onClick={() => onSelectGenre(genre)} />
          ))}
        </div>
        {uncategorised > 0 && (
          <p className="mt-6 text-sm text-dust">{uncategorised} book{uncategorised === 1 ? ' has' : 's have'} no category yet and appear under All Books.</p>
        )}
      </div>
    </>
  );
}

function CategoryTile({ name, icon: Icon, books, onClick }) {
  const covers = books.slice(0, 3);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group panel relative flex min-h-44 items-stretch overflow-hidden p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-brass/60"
    >
      <div className="relative z-10 flex flex-1 flex-col">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brass/30 bg-brass/10 text-brass">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-auto pt-6 font-serif text-2xl font-bold transition group-hover:text-brass-light">{name}</h2>
        <p className="text-sm text-dust">{books.length} {books.length === 1 ? 'book' : 'books'}</p>
      </div>
      <div className="relative h-32 w-36 shrink-0 self-end">
        {covers.map((book, index) => (
          <div
            key={book.id}
            className="absolute bottom-0 w-20"
            style={{ right: index * 26, transform: `rotate(${(index - 1) * 6}deg)`, zIndex: 3 - index }}
          >
            <BookCover src={book.coverImage} title={book.title} author={book.author} compact className="aspect-[2/3] w-full" />
          </div>
        ))}
      </div>
    </button>
  );
}
