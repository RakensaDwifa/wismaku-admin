export default function PageLoader({ label = 'Memuat...' }) {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="size-9 animate-spin rounded-full border-4 border-rd-border border-t-rd" />
        <p className="text-sm font-medium text-rd-muted">{label}</p>
      </div>
    </div>
  )
}
