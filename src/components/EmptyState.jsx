export default function EmptyState({ title, desc }) {
  return (
    <div className="rounded-xl border border-dashed border-rd-border bg-white px-6 py-12 text-center">
      <p className="text-base font-bold text-rd-text">{title}</p>
      {desc && <p className="mt-1 text-sm text-rd-muted">{desc}</p>}
    </div>
  )
}
