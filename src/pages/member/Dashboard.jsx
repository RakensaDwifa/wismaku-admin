import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getBookings, BOOKING_STATUS_LABELS } from '../../services/booking.js'
import StatCard from '../../components/StatCard.jsx'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'
import { Link } from 'react-router-dom'

export default function MemberDashboard() {
  const { user } = useAuth()
  const { data } = useData(() => getBookings({ email: user?.email }), [user?.email])

  if (!data) return <PageLoader />

  const total = data.length
  const aktif = data.filter((b) => b.status === 'confirmed' || b.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-rd-text">Halo, {user.name}</h1>
        <p className="text-sm text-rd-muted">Ringkasan aktivitas pemesanan Anda di WismaKu.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Pesanan" value={total} />
        <StatCard label="Pesanan Aktif" value={aktif} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-rd-text">Pesanan Terbaru</h2>
          <Link to="/member/pesanan" className="text-sm font-bold text-rd hover:underline">
            Lihat semua
          </Link>
        </div>
        {data.length === 0 ? (
          <EmptyState title="Belum ada pesanan" desc="Pesanan Anda akan muncul di sini." />
        ) : (
          <ul className="space-y-3">
            {data.slice(0, 3).map((b) => (
              <li key={b.id} className="rounded-xl border border-rd-border bg-white p-4 shadow-rd">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-rd-text">{b.propertyName}</p>
                    <p className="mt-0.5 text-sm text-rd-muted">
                      {b.id} · {b.checkIn ?? '—'} s.d. {b.checkOut ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge status={b.status}>{BOOKING_STATUS_LABELS[b.status] || b.status}</Badge>
                    <p className="mt-1 text-sm font-extrabold text-rd-text">
                      Rp {b.totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
