export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
      <p className="text-sm font-semibold text-rd-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-rd-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-rd-muted">{hint}</p>}
    </div>
  )
}
