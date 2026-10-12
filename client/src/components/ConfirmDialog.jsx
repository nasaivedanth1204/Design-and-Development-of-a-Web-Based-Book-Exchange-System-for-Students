import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={busy ? undefined : onCancel} title={title} size="sm">
      <div className="p-6 sm:p-7">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-oxblood/25 text-[#f0b7ae]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-vellum">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
