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
      <p className="text-sm text-rd-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn btn-outline btn-sm" type="button" onClick={onCancel}>
          Batal
        </button>
        <button className="btn btn-danger btn-sm" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
