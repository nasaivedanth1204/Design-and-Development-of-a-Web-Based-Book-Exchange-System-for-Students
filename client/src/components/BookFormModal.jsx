import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Link2, Loader2, Save, Trash2, Upload } from 'lucide-react';
import Modal from './Modal.jsx';
import BookCover from './BookCover.jsx';
import { PREFERENCE_LABELS, cx } from '../utils.js';
import { api } from '../api.js';

const EMPTY = {
  title: '',
  author: '',
  publisher: '',
  publicationYear: '',
  genre: '',
  description: '',
  ownerId: '',
  exchangePreference: 'exchange',
  price: '',
  status: 'available',
  coverMode: 'none', // upload | url | none | keep
  coverUrl: '',
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Add a Book / Edit Book form. Pass `book` to edit, leave it null to add. */
export default function BookFormModal({ open, book, onClose, meta, currentUserId, onSaved, notify }) {
  const isEdit = Boolean(book);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setErrors({});
    if (book) {
      setForm({
        ...EMPTY,
        ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, book[key] ?? EMPTY[key]])),
        publicationYear: book.publicationYear ?? '',
        price: book.price ?? '',
        coverMode: book.coverImage ? 'keep' : 'none',
        coverUrl: '',
      });
    } else {
      setForm({ ...EMPTY, ownerId: currentUserId ?? meta.owners[0]?.id ?? '' });
    }
  }, [open, book, currentUserId, meta.owners]);

  // Live preview of the chosen cover.
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => filePreview && URL.revokeObjectURL(filePreview), [filePreview]);

  const previewSrc = {
    upload: filePreview,
    url: form.coverUrl.trim() || null,
    keep: book?.coverImage ?? null,
    none: null,
  }[form.coverMode];

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const pickFile = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (!ACCEPTED_TYPES.includes(chosen.type)) {
      setErrors((e) => ({ ...e, coverImage: 'Please choose a JPG, PNG, WEBP or GIF image.' }));
      return;
    }
    if (chosen.size > meta.maxUploadMb * 1024 * 1024) {
      setErrors((e) => ({ ...e, coverImage: `Image must be smaller than ${meta.maxUploadMb} MB.` }));
      return;
    }
    setErrors(({ coverImage, ...rest }) => rest);
    setFile(chosen);
    setForm((current) => ({ ...current, coverMode: 'upload' }));
  };

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.author.trim()) next.author = 'Author is required.';
    const year = String(form.publicationYear).trim();
    const maxYear = new Date().getFullYear() + 1;
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1000 || Number(year) > maxYear)) {
      next.publicationYear = `Enter a 4-digit year up to ${maxYear}.`;
    }
    const price = String(form.price).trim();
    if (form.exchangePreference === 'sell' && price && !(Number(price) >= 0)) next.price = 'Price must be 0 or more.';
    if (!isEdit && !form.ownerId) next.ownerId = 'Choose an owner.';
    if (form.coverMode === 'url' && form.coverUrl.trim() && !/^https?:\/\/\S+$/i.test(form.coverUrl.trim())) {
      next.coverImage = 'Image URL must start with http:// or https://';
    }
    if (form.coverMode === 'upload' && !file) next.coverImage = 'Choose an image file to upload.';
    return next;
  }

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      notify('error', Object.values(next)[0]);
      return;
    }

    const data = new FormData();
    ['title', 'author', 'publisher', 'publicationYear', 'genre', 'description', 'exchangePreference'].forEach((key) =>
      data.append(key, String(form[key] ?? '').trim()),
    );
    data.append('price', form.exchangePreference === 'sell' ? String(form.price).trim() : '');
    if (isEdit) {
      data.append('status', form.status);
      data.append('actorId', currentUserId);
    } else {
      data.append('ownerId', form.ownerId);
    }
    const coverMode = form.coverMode === 'url' && !form.coverUrl.trim() ? 'none' : form.coverMode;
    data.append('coverMode', coverMode);
    if (coverMode === 'url') data.append('coverUrl', form.coverUrl.trim());
    if (coverMode === 'upload' && file) data.append('coverFile', file);

    setSaving(true);
    try {
      // The UI only updates after the server confirms the book was saved in SQLite.
      const saved = isEdit ? await api.updateBook(book.id, data) : await api.createBook(data);
      onSaved(saved, isEdit);
    } catch (error) {
      setErrors(error.details ?? {});
      notify('error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const error = (key) => errors[key] && <p className="mt-1 text-xs text-[#f0b7ae]">{errors[key]}</p>;
  const optional = <span className="tracking-normal text-dust normal-case">(optional)</span>;

  const coverTabs = [
    ...(isEdit && book?.coverImage ? [{ mode: 'keep', label: 'Current', icon: ImagePlus }] : []),
    { mode: 'upload', label: 'Upload', icon: Upload },
    { mode: 'url', label: 'Image URL', icon: Link2 },
    { mode: 'none', label: 'No cover', icon: Trash2 },
  ];

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} size="lg" labelledBy="book-form-title">
      <form onSubmit={submit} noValidate className="p-6 sm:p-8">
        <p className="eyebrow">{isEdit ? 'Edit listing' : 'Add to the library'}</p>
        <h2 id="book-form-title" className="mt-1 font-serif text-3xl font-bold">{isEdit ? 'Edit book' : 'Add a Book'}</h2>
        <p className="mt-1 text-sm text-dust">Only title and author are required — leave anything else blank.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-[13rem_1fr]">
          {/* Cover */}
          <div>
            <span className="label">Cover image</span>
            <BookCover src={previewSrc} title={form.title || 'Your book'} author={form.author} className="mx-auto aspect-[2/3] w-40 md:w-full" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coverTabs.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverMode: mode }))}
                  className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition', form.coverMode === mode ? 'border-brass bg-brass/15 text-brass-light' : 'border-leather text-vellum hover:border-brass/50')}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
            {form.coverMode === 'upload' && (
              <label className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-leather bg-ink/40 px-3 py-4 text-center text-xs text-vellum transition hover:border-brass/60">
                <Upload className="h-4 w-4 text-brass" />
                {file ? <span className="break-all text-parchment">{file.name}</span> : 'Choose an image'}
                <span className="text-dust">JPG, PNG, WEBP or GIF · max {meta.maxUploadMb} MB</span>
                <input type="file" accept={ACCEPTED_TYPES.join(',')} onChange={pickFile} className="sr-only" />
              </label>
            )}
            {form.coverMode === 'url' && (
              <input type="url" className={cx('field mt-3', errors.coverImage && 'field-error')} placeholder="https://…/cover.jpg" value={form.coverUrl} onChange={set('coverUrl')} aria-label="Cover image URL" />
            )}
            {error('coverImage')}
          </div>

          {/* Details */}
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="f-title">Title *</label>
              <input id="f-title" className={cx('field', errors.title && 'field-error')} value={form.title} onChange={set('title')} maxLength={200} placeholder="e.g. The Pragmatic Programmer" autoFocus />
              {error('title')}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="f-author">Author *</label>
              <input id="f-author" className={cx('field', errors.author && 'field-error')} value={form.author} onChange={set('author')} maxLength={200} placeholder="e.g. Andrew Hunt" />
              {error('author')}
            </div>
            <div>
              <label className="label" htmlFor="f-publisher">Publisher {optional}</label>
              <input id="f-publisher" className={cx('field', errors.publisher && 'field-error')} value={form.publisher} onChange={set('publisher')} maxLength={150} />
              {error('publisher')}
            </div>
            <div>
              <label className="label" htmlFor="f-year">Publication year {optional}</label>
              <input id="f-year" inputMode="numeric" className={cx('field', errors.publicationYear && 'field-error')} value={form.publicationYear} onChange={set('publicationYear')} placeholder="e.g. 2019" maxLength={4} />
              {error('publicationYear')}
            </div>
            <div>
              <label className="label" htmlFor="f-genre">Category {optional}</label>
              <select id="f-genre" className={cx('field', errors.genre && 'field-error')} value={form.genre} onChange={set('genre')}>
                <option value="">— Not specified —</option>
                {meta.genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              {error('genre')}
            </div>
            <div>
              <label className="label" htmlFor="f-owner">Owner</label>
              {isEdit ? (
                <input id="f-owner" className="field opacity-70" value={book.ownerName} disabled />
              ) : (
                <select id="f-owner" className={cx('field', errors.ownerId && 'field-error')} value={form.ownerId} onChange={set('ownerId')}>
                  {meta.owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                </select>
              )}
              {error('ownerId')}
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="label">Exchange preference</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {meta.exchangePreferences.map((pref) => (
                  <label key={pref} className={cx('cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition', form.exchangePreference === pref ? 'border-brass bg-brass/15 text-brass-light' : 'border-leather bg-ink/50 text-vellum hover:border-brass/50')}>
                    <input type="radio" name="exchangePreference" value={pref} checked={form.exchangePreference === pref} onChange={set('exchangePreference')} className="sr-only" />
                    {PREFERENCE_LABELS[pref]}
                  </label>
                ))}
              </div>
            </fieldset>

            {form.exchangePreference === 'sell' && (
              <div>
                <label className="label" htmlFor="f-price">Price (₹) {optional}</label>
                <input id="f-price" type="number" min="0" step="1" className={cx('field', errors.price && 'field-error')} value={form.price} onChange={set('price')} placeholder="Leave blank if negotiable" />
                {error('price')}
              </div>
            )}

            {isEdit && (
              <div>
                <label className="label" htmlFor="f-status">Availability</label>
                <select id="f-status" className="field" value={form.status} onChange={set('status')}>
                  {meta.bookStatuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="label" htmlFor="f-desc">Description {optional}</label>
              <textarea id="f-desc" rows={3} maxLength={2000} className={cx('field resize-y', errors.description && 'field-error')} value={form.description} onChange={set('description')} placeholder="Condition, edition, notes in the margins…" />
              {error('description')}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-leather/60 pt-5 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to library'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
