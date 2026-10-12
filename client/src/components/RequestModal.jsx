import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import Modal from './Modal.jsx';
import BookCover from './BookCover.jsx';
import { DEFAULT_REQUEST_TYPE, PREFERENCE_LABELS, REQUEST_TYPE_LABELS, cx, formatPrice } from '../utils.js';
import { api } from '../api.js';

export default function RequestModal({ book, open, onClose, owners, requestTypes, currentUserId, onCreated, notify }) {
  // Requesters: everyone except the book's owner.
  const requesters = owners.filter((owner) => owner.id !== book?.ownerId);

  // App renders this with key={book.id}, so the form starts fresh for each book.
  const [form, setForm] = useState(() => ({
    requesterId: (currentUserId !== book?.ownerId ? currentUserId : requesters[0]?.id) ?? '',
    requestType: DEFAULT_REQUEST_TYPE[book?.exchangePreference] ?? 'borrow',
    message: '',
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!book) return null;

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.requesterId) nextErrors.requesterId = 'Please choose who is requesting.';
    if (form.message.length > 500) nextErrors.message = 'Message must be 500 characters or fewer.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const saved = await api.createRequest({ bookId: book.id, ...form });
      onCreated(saved);
    } catch (error) {
      setErrors(error.details ?? {});
      notify('error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} size="md" labelledBy="request-title">
      <form onSubmit={submit} className="p-6 sm:p-8" noValidate>
        <p className="eyebrow">Request a book</p>
        <h2 id="request-title" className="mt-1 font-serif text-3xl font-bold">Send a request</h2>

        <div className="mt-5 flex items-center gap-4 rounded-xl border border-leather bg-ink/50 p-3">
          <BookCover src={book.coverImage} title={book.title} author={book.author} compact className="aspect-[2/3] w-14 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-semibold">{book.title}</p>
            <p className="truncate text-xs text-vellum">{book.author}</p>
            <p className="mt-1 text-xs text-dust">
              Owner: <span className="text-vellum">{book.ownerName}</span> · Listed to {PREFERENCE_LABELS[book.exchangePreference]?.toLowerCase()}
              {book.price !== null && <> · <span className="text-brass">{formatPrice(book.price)}</span></>}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <label className="label" htmlFor="requesterId">Requested by</label>
            <select id="requesterId" className={cx('field', errors.requesterId && 'field-error')} value={form.requesterId} onChange={(e) => setForm({ ...form, requesterId: e.target.value })}>
              {requesters.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
            {errors.requesterId && <p className="mt-1 text-xs text-[#f0b7ae]">{errors.requesterId}</p>}
          </div>

          <fieldset>
            <legend className="label">Request type</legend>
            <div className="grid grid-cols-3 gap-2">
              {requestTypes.map((type) => (
                <label key={type} className={cx('cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm transition', form.requestType === type ? 'border-brass bg-brass/15 text-brass-light' : 'border-leather bg-ink/50 text-vellum hover:border-brass/50')}>
                  <input type="radio" name="requestType" value={type} checked={form.requestType === type} onChange={() => setForm({ ...form, requestType: type })} className="sr-only" />
                  {REQUEST_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
            {errors.requestType && <p className="mt-1 text-xs text-[#f0b7ae]">{errors.requestType}</p>}
          </fieldset>

          <div>
            <label className="label" htmlFor="message">Message <span className="tracking-normal text-dust normal-case">(optional)</span></label>
            <textarea id="message" rows={3} maxLength={500} placeholder={`Hi ${book.ownerName.split(' ')[0]}, I'd love to read this for…`} className={cx('field resize-none', errors.message && 'field-error')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <p className="mt-1 text-right text-xs text-dust">{form.message.length}/500</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
