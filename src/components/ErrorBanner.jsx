export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="font-bold text-red-500 hover:text-red-700"
          onClick={onDismiss}
          aria-label="Tutup"
        >
          &times;
        </button>
      )}
    </div>
  )
}
