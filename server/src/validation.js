import { GENRES, EXCHANGE_PREFERENCES, BOOK_STATUSES, findOwner } from './constants.js';

/** Trims a value and collapses repeated whitespace. Blank → null (stored as SQL NULL). */
export function cleanText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

/** Like cleanText but keeps line breaks (for descriptions and messages). */
export function cleanMultiline(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return text === '' ? null : text;
}

const has = (body, key) => Object.prototype.hasOwnProperty.call(body, key);

/**
 * Validates the book fields sent by the Add / Edit form.
 * Returns { values, errors }. `errors` maps field name → message.
 * When `existing` is given (edit), fields that were not sent keep their value.
 */
export function validateBook(body = {}, existing = null) {
  const errors = {};
  const pick = (key) => (existing && !has(body, key) ? existing[key] : body[key]);

  const title = cleanText(pick('title'));
  if (!title) errors.title = 'Title is required.';
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.';

  const author = cleanText(pick('author'));
  if (!author) errors.author = 'Author is required.';
  else if (author.length > 200) errors.author = 'Author must be 200 characters or fewer.';

  const publisher = cleanText(pick('publisher'));
  if (publisher && publisher.length > 150) errors.publisher = 'Publisher must be 150 characters or fewer.';

  let publicationYear = cleanText(pick('publicationYear'));
  if (publicationYear !== null) {
    const year = Number(publicationYear);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1000 || year > maxYear) {
      errors.publicationYear = `Publication year must be a whole number between 1000 and ${maxYear}.`;
    }
    publicationYear = year;
  }

  const genre = cleanText(pick('genre'));
  if (genre && !GENRES.includes(genre)) errors.genre = 'Please choose a category from the list.';

  const description = cleanMultiline(pick('description'));
  if (description && description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';

  const exchangePreference = cleanText(pick('exchangePreference')) ?? 'exchange';
  if (!EXCHANGE_PREFERENCES.includes(exchangePreference)) {
    errors.exchangePreference = 'Exchange preference must be exchange, lend, give away or sell.';
  }

  // Price only makes sense when selling; otherwise it is always NULL.
  let price = null;
  const rawPrice = cleanText(pick('price'));
  if (exchangePreference === 'sell' && rawPrice !== null) {
    price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      errors.price = 'Price must be a number between 0 and 100000.';
    } else {
      price = Math.round(price * 100) / 100;
    }
  }

  const status = cleanText(pick('status')) ?? 'available';
  if (!BOOK_STATUSES.includes(status)) errors.status = 'Status must be available, reserved or unavailable.';

  // Owner is chosen when the book is created and cannot be changed afterwards.
  let owner = null;
  if (existing) {
    owner = { id: existing.ownerId, name: existing.ownerName };
  } else {
    owner = findOwner(cleanText(body.ownerId));
    if (!owner) errors.ownerId = 'Please choose a valid owner.';
  }

  return {
    errors,
    values: { title, author, publisher, publicationYear, genre, description, exchangePreference, price, status, owner },
  };
}

/** Validates an external cover image URL. */
export function validateCoverUrl(value) {
  const url = cleanText(value);
  if (!url) return { url: null };
  if (url.length > 500) return { error: 'Image URL must be 500 characters or fewer.' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
  } catch {
    return { error: 'Image URL must start with http:// or https://' };
  }
  return { url };
}
