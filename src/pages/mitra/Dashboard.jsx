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

  const paidBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed')
  const grossRevenue = paidBookings.reduce((a, b) => a + (b.totalPrice || 0), 0)
  const platformFee = paidBookings.reduce(
    (a, b) => a + (b.platformFee || Math.round((b.totalPrice || 0) * 0.15)),
    0,
  )
  const netRevenue = grossRevenue - platformFee

  const pendingCheckIn = bookings.filter((b) => b.status === 'confirmed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-rd-text">Dashboard Mitra Extranet</h1>
        <p className="text-sm text-rd-muted">
          Ringkasan operasional properti, arus kas reservasi, dan transparansi bagi hasil WismaKu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properti Dikelola" value={properties.length} hint="Terhubung di sistem katalog" />
        <StatCard label="Tipe Kamar" value={totalRooms} hint="Kamar aktif dipasarkan" />
        <StatCard
          label="Tamu Menginap / Datang"
          value={pendingCheckIn}
          hint="Pesanan lunas menunggu check-out"
        />
        <StatCard
          label="Pendapatan Bersih (85%)"
          value={`Rp ${netRevenue.toLocaleString('id-ID')}`}
          hint={`Kotor: Rp ${grossRevenue.toLocaleString('id-ID')}`}
        />
      </div>

      <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
        <h2 className="mb-4 text-base font-extrabold text-rd-text">Rincian Bagi Hasil & Keuangan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-rd-soft p-4">
            <div className="text-xs font-bold text-rd-muted">Total Omzet Pesanan (Gross)</div>
            <div className="mt-1 text-xl font-extrabold text-rd-text">
              Rp {grossRevenue.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-rd-muted">
              Dari {paidBookings.length} pesanan terkonfirmasi/selesai
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <div className="text-xs font-bold text-amber-700">Potongan Bagi Hasil WismaKu (15%)</div>
            <div className="mt-1 text-xl font-extrabold text-amber-900">
              Rp {platformFee.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-amber-700">Biaya pemeliharaan sistem & payment gateway</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="text-xs font-bold text-emerald-700">Hak Bersih Mitra (Net Payout)</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-900">
              Rp {netRevenue.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-emerald-700">Siap dicairkan via transfer bank berkala</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rd-text">Properti Saya</h2>
            <Link to="/mitra/properti" className="text-sm font-bold text-rd hover:underline">
              Kelola Kamar & Harga
            </Link>
          </div>
          <ul className="space-y-2">
            {properties.slice(0, 4).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-rd-border pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-rd-text">{p.name}</p>
                  <p className="text-xs text-rd-muted">{p.city}</p>
                </div>
                <span className="text-xs font-bold text-rd-dark bg-rd-teal-bg px-2.5 py-1 rounded-full">
                  {p.roomTypes?.length || 0} Tipe Kamar
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-rd-text">Kupon Khusus Properti</h2>
            <Link to="/mitra/kupon" className="text-sm font-bold text-rd hover:underline">
              Kelola Kupon
            </Link>
          </div>
          <ul className="space-y-2">
            {coupons.length === 0 && <li className="text-sm text-rd-muted">Belum ada kupon promo aktif.</li>}
            {coupons.slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 border-b border-rd-border pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-bold text-rd-text">{c.code}</p>
                  <p className="text-xs text-rd-muted">{c.label}</p>
                </div>
                <span className="text-xs font-bold text-rd bg-rd-soft px-2.5 py-1 rounded-full">
                  Diskon {c.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
