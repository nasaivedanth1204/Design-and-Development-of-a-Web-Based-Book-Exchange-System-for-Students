export const PLACEHOLDER = '—';

export const show = (value) => (value === null || value === undefined || value === '' ? PLACEHOLDER : value);

export const PREFERENCE_LABELS = {
  exchange: 'Exchange',
  lend: 'Lend',
  'give away': 'Give away',
  sell: 'Sell',
};

export const REQUEST_TYPE_LABELS = {
  borrow: 'Borrow',
  exchange: 'Exchange',
  purchase: 'Purchase',
};

// The most natural request type for each listing type (pre-selected in the form).
export const DEFAULT_REQUEST_TYPE = {
  exchange: 'exchange',
  lend: 'borrow',
  'give away': 'borrow',
  sell: 'purchase',
};

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'author', label: 'Author (A–Z)' },
  { value: 'year-new', label: 'Year (newest)' },
  { value: 'year-old', label: 'Year (oldest)' },
];

export const formatPrice = (price) =>
  price === null || price === undefined ? null : `₹${Number(price).toLocaleString('en-IN')}`;

export function formatDate(iso, withTime = false) {
  if (!iso) return PLACEHOLDER;
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Stable FNV-1a hash, used to give fallback covers a consistent colour. */
export function hashString(text = '') {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export const cx = (...classes) => classes.filter(Boolean).join(' ');
