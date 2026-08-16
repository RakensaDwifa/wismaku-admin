import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getProperties } from '../../services/property.js'
import { getBookings } from '../../services/booking.js'
import { getCoupons } from '../../services/coupon.js'
import StatCard from '../../components/StatCard.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function MitraDashboard() {
  const { user } = useAuth()
  const { data: properties } = useData(() => getProperties({ partnerEmail: user?.email }), [user?.email])
  const { data: bookings } = useData(() => getBookings({ partnerEmail: user?.email }), [user?.email])
  const { data: coupons } = useData(() => getCoupons({ partnerEmail: user?.email }), [user?.email])

  if (!properties || !bookings || !coupons) return <PageLoader />

  const totalRooms = properties.reduce((a, p) => a + (p.roomTypes?.length || 0), 0)
  const revenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((a, b) => a + b.totalPrice, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-rd-text">Dashboard Mitra</h1>
        <p className="text-sm text-rd-muted">Ringkasan properti, pesanan, dan kupon Anda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properti" value={properties.length} />
        <StatCard label="Tipe Kamar" value={totalRooms} />
        <StatCard label="Pesanan" value={bookings.length} />
        <StatCard
          label="Pendapatan"
          value={`Rp ${revenue.toLocaleString('id-ID')}`}
          hint="Pesanan dikonfirmasi & selesai"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rd-text">Properti Terbaru</h2>
            <Link to="/mitra/properti" className="text-sm font-bold text-rd hover:underline">
              Kelola
            </Link>
          </div>
          <ul className="space-y-2">
            {properties.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-rd-text">{p.name}</p>
                  <p className="text-xs text-rd-muted">{p.city}</p>
                </div>
                <span className="text-xs font-bold text-rd-muted">{p.roomTypes?.length} kamar</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rd-text">Kupon</h2>
            <Link to="/mitra/kupon" className="text-sm font-bold text-rd hover:underline">
              Kelola
            </Link>
          </div>
          <ul className="space-y-2">
            {coupons.length === 0 && <li className="text-sm text-rd-muted">Belum ada kupon.</li>}
            {coupons.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-rd-text">{c.code}</p>
                  <p className="text-xs text-rd-muted">{c.label}</p>
                </div>
                <span className="text-xs font-bold text-rd">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
