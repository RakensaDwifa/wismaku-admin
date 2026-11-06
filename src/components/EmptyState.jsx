export default function EmptyState({ title, desc, description }) {
  const text = description || desc
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-base font-extrabold text-slate-800">{title}</p>
      {text && <p className="mt-1 text-xs text-slate-500">{text}</p>}
    </div>
  )
}
