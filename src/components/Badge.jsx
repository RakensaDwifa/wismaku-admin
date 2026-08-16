const STYLES = {
  aktif: 'bg-emerald-100 text-emerald-700',
  nonaktif: 'bg-gray-200 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  ditolak: 'bg-red-100 text-red-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Badge({ status, children }) {
  const style = STYLES[status] || 'bg-rd-teal-bg text-rd-dark'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{children}</span>
}
