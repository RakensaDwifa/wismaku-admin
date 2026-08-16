import { useAuth } from '../hooks/useAuth.js'
import { useData } from '../hooks/useData.js'
import { getBookings, updateBookingStatus, BOOKING_STATUS_LABELS } from '../services/booking.js'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageLoader from '../components/PageLoader.jsx'

const STATUS_FLOW = ['pending', 'confirmed', 'completed', 'cancelled']

export default function OrdersPage() {
  const { user } = useAuth()
  const filter = user.role === 'mitra' ? { partnerEmail: user.email } : {}
  const { data } = useData(() => getBookings(filter), [user.role, user.email])

  if (!data) return <PageLoader />

  const changeStatus = async (id, status) => {
    await updateBookingStatus(id, status)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-rd-text">Pesanan</h1>
      {data.length === 0 ? (
        <EmptyState title="Belum ada pesanan" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Properti</th>
                <th className="px-4 py-3 font-bold">Tamu</th>
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
                  <td className="px-4 py-3">
                    <div>{b.guestName}</div>
                    <div className="text-xs text-rd-muted">{b.email}</div>
                  </td>
                  <td className="px-4 py-3 text-rd-muted">
                    {b.checkIn ?? '—'} s.d. {b.checkOut ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-rd-text">
                    Rp {b.totalPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge status={b.status}>{BOOKING_STATUS_LABELS[b.status] || b.status}</Badge>
                      <select
                        className="rounded-lg border border-rd-border px-2 py-1 text-xs font-semibold text-rd-text"
                        value={b.status}
                        onChange={(e) => changeStatus(b.id, e.target.value)}
                        aria-label={`Ubah status ${b.id}`}
                      >
                        {STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>
                            {BOOKING_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
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
