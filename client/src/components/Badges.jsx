import { cx, PREFERENCE_LABELS } from '../utils.js';

const BOOK_STATUS = {
  available: 'bg-moss/20 text-[#cfe3c2] border-moss/40',
  reserved: 'bg-brass/15 text-brass-light border-brass/40',
  unavailable: 'bg-oxblood/20 text-[#f0b7ae] border-oxblood/40',
};

const REQUEST_STATUS = {
  pending: 'bg-brass/15 text-brass-light border-brass/40',
  accepted: 'bg-moss/20 text-[#cfe3c2] border-moss/40',
  rejected: 'bg-oxblood/20 text-[#f0b7ae] border-oxblood/40',
  cancelled: 'bg-leather/50 text-dust border-leather',
};

const base = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase';

export function StatusBadge({ status, className }) {
  return <span className={cx(base, BOOK_STATUS[status], className)}>{status}</span>;
}

export function RequestStatusBadge({ status, className }) {
  return <span className={cx(base, REQUEST_STATUS[status], className)}>{status}</span>;
}

export function PreferenceBadge({ preference, className }) {
  return (
    <span className={cx(base, 'border-leather bg-ink/60 text-vellum', className)}>
      {PREFERENCE_LABELS[preference] ?? preference}
    </span>
  );
}
