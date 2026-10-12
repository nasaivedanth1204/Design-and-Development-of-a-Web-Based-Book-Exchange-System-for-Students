import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx } from '../utils.js';

const STYLES = {
  success: { icon: CheckCircle2, className: 'border-moss/50 text-[#cfe3c2]' },
  error: { icon: XCircle, className: 'border-oxblood/60 text-[#f0b7ae]' },
  info: { icon: Info, className: 'border-ink-blue/60 text-[#c5d5e6]' },
};

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end" aria-live="polite">
      {toasts.map((toast) => {
        const { icon: Icon, className } = STYLES[toast.type] ?? STYLES.info;
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cx('pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-xl border bg-mahogany/95 px-4 py-3 text-sm shadow-xl shadow-black/50 backdrop-blur', className)}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-parchment">{toast.message}</p>
            <button type="button" onClick={() => onDismiss(toast.id)} className="text-dust hover:text-parchment" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
