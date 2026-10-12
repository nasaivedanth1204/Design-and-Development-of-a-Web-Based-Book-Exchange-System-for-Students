import { useState } from 'react';
import { Feather } from 'lucide-react';
import { cx, hashString } from '../utils.js';

// Cloth-bound colours for the generated fallback cover.
const BINDINGS = [
  ['#4a1f1c', '#2a110f'], // oxblood
  ['#1f3a2e', '#10211a'], // bottle green
  ['#1d2c44', '#0f1828'], // navy
  ['#4a3418', '#2a1d0c'], // tan leather
  ['#3a2240', '#1f1124'], // plum
  ['#2f3a3f', '#181f22'], // slate
];

/**
 * Shows a book's cover image. If there is no image, or the image fails to load
 * (e.g. offline during the demo), a locally drawn "cloth-bound" cover with the
 * title and author is shown instead — the UI never shows a broken image.
 */
export default function BookCover({ src, title, author, className, compact = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const showImage = src && failedSrc !== src;
  const loaded = showImage && loadedSrc === src;

  return (
    <div className={cx('cover-sheen relative overflow-hidden rounded-[3px] rounded-r-md bg-mahogany shadow-[4px_6px_16px_rgb(0_0_0/0.55)]', className)}>
      {/* The drawn cover sits underneath until the real image has loaded. */}
      {!loaded && <FallbackCover title={title} author={author} compact={compact} />}
      {showImage && (
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={cx('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'absolute inset-0 opacity-0')}
        />
      )}
    </div>
  );
}

function FallbackCover({ title = 'Untitled', author, compact }) {
  const [from, to] = BINDINGS[hashString(`${title}|${author ?? ''}`) % BINDINGS.length];
  return (
    <div
      role="img"
      aria-label={`Cover of ${title}`}
      className="flex h-full w-full flex-col items-center justify-between p-[9%] text-center"
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-brass/45 p-[8%] outline outline-1 outline-offset-[3px] outline-brass/25">
        {!compact && <Feather className="h-4 w-4 shrink-0 text-brass/70" aria-hidden />}
        <p className={cx('line-clamp-4 font-serif leading-tight font-semibold text-[#ecd9ae]', compact ? 'text-[0.6rem]' : 'text-[clamp(0.8rem,1.4vw,1.05rem)]')}>
          {title}
        </p>
        {!compact && author && (
          <>
            <span className="h-px w-8 bg-brass/50" />
            <p className="line-clamp-2 font-serif text-[0.7rem] text-[#cdb98d] italic">{author}</p>
          </>
        )}
      </div>
    </div>
  );
}
