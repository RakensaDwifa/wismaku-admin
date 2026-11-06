export default function PageLoader({ label = 'Memuat data...' }) {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="size-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        <p className="text-xs font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  )
}
