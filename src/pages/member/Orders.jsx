import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getBookings, BOOKING_STATUS_LABELS } from '../../services/booking.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function MemberOrders() {
  const { user } = useAuth()
  const { data } = useData(() => getBookings({ email: user?.email }), [user?.email])

  if (!data) return <PageLoader />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-rd-text">Pesanan Saya</h1>
      {data.length === 0 ? (
        <EmptyState title="Belum ada pesanan" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Properti</th>
                <th className="px-4 py-3 font-bold">Tanggal</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="border-b border-rd-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
                  <td className="px-4 py-3 font-semibold text-rd-text">{b.propertyName}</td>
                  <td className="px-4 py-3 text-rd-muted">
                    {b.checkIn ?? '—'} s.d. {b.checkOut ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-rd-text">
                    Rp {b.totalPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={b.status}>{BOOKING_STATUS_LABELS[b.status] || b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
