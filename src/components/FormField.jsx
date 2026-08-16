export default function FormField({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-rd-text">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-rd-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
