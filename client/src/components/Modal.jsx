import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cx } from '../utils.js';

/** Accessible modal dialog: closes on Escape / backdrop click and locks page scroll. */
export default function Modal({ open, onClose, title, children, size = 'md', labelledBy }) {
  const panelRef = useRef(null);
  // Kept in a ref so a new onClose function on each render doesn't re-run the
  // effect below (which would steal focus from the input being typed in).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : title}
        className={cx(
          'relative flex max-h-[92vh] w-full animate-rise flex-col overflow-hidden rounded-t-2xl border border-leather bg-walnut shadow-2xl shadow-black/60 outline-none sm:rounded-2xl',
          widths[size],
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-ink/70 p-2 text-vellum transition hover:bg-ink hover:text-parchment"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="scrollbar-thin overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
