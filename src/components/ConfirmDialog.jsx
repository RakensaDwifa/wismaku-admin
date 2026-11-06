import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <Modal onClose={onCancel} title={title}>
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <button
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <button
          className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
