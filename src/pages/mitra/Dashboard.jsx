import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getProperties } from '../../services/property.js'
import { getBookings } from '../../services/booking.js'
import { getCoupons } from '../../services/coupon.js'
import StatCard from '../../components/StatCard.jsx'
import Badge from '../../components/Badge.jsx'
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Ringkasan Operasional Mitra</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitoring terpusat properti penginapan, reservasi tamu, dan transparansi bagi hasil WismaKu.
        </p>
      </div>

      {/* Grid Metrik Utama */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Properti Dikelola"
          value={properties.length}
          hint="Terhubung di sistem katalog"
          badge="Katalog"
        />
        <StatCard label="Tipe Kamar" value={totalRooms} hint="Kamar aktif dipasarkan" />
        <StatCard
          label="Tamu Menginap / Datang"
          value={pendingCheckIn}
          hint="Pesanan lunas menunggu check-out"
          badge={pendingCheckIn > 0 ? `${pendingCheckIn} Aktif` : 'Clear'}
        />
        <StatCard
          label="Pendapatan Bersih (85%)"
          value={`Rp ${netRevenue.toLocaleString('id-ID')}`}
          hint={`Omzet Kotor: Rp ${grossRevenue.toLocaleString('id-ID')}`}
          badge="Net 85%"
        />
      </div>

      {/* Rincian Bagi Hasil & Keuangan */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Rincian Bagi Hasil & Keuangan</h2>
            <p className="text-xs text-slate-500">
              Skema pembagian hasil otomatis 85% untuk mitra pemilik penginapan dan 15% untuk biaya
              operasional platform.
            </p>
          </div>
          <Link to="/mitra/keuangan" className="text-xs font-bold text-teal-700 hover:underline">
            Riwayat Payouts & Rekening &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Omzet Pesanan (Gross)
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-slate-900">
              Rp {grossRevenue.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Dari {paidBookings.length} pesanan terkonfirmasi/selesai
            </div>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Potongan Bagi Hasil WismaKu (15%)
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-amber-900">
              Rp {platformFee.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-amber-700">Biaya pemeliharaan sistem & payment gateway</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Hak Bersih Mitra (Net Payout)
            </div>
            <div className="mt-1.5 text-xl font-extrabold text-emerald-900">
              Rp {netRevenue.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-emerald-700">Siap dicairkan via transfer bank berkala</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Properti Dikelola */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Properti Dikelola</h2>
              <p className="text-xs text-slate-500">Daftar penginapan aktif Anda di WismaKu</p>
            </div>
            <Link to="/mitra/properti" className="text-xs font-bold text-teal-700 hover:underline">
              Kelola Kamar & Harga ({properties.length})
            </Link>
          </div>

          {properties.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada properti terdaftar.</p>
          ) : (
            <div className="space-y-3">
              {properties.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate text-sm font-bold text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.city} • {p.area || 'Pusat Kota'}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">
                    {p.roomTypes?.length || 0} Tipe Kamar
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pesanan Masuk Terbaru */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Pesanan Masuk Terbaru</h2>
              <p className="text-xs text-slate-500">Reservasi tamu untuk kamar penginapan Anda</p>
            </div>
            <Link to="/mitra/pesanan" className="text-xs font-bold text-teal-700 hover:underline">
              Semua Pesanan ({bookings.length})
            </Link>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada transaksi pemesanan.</p>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700">{b.id}</span>
                      <span className="text-xs font-semibold text-slate-700">{b.guestName}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.propertyName} • Rp {Number(b.totalPrice || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <Badge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kupon Diskon Aktif */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Kupon Khusus Properti</h2>
            <p className="text-xs text-slate-500">Voucher potongan harga khusus untuk kamar mitra Anda</p>
          </div>
          <Link to="/mitra/kupon" className="text-xs font-bold text-teal-700 hover:underline">
            Kelola Kupon ({coupons.length})
          </Link>
        </div>
        {coupons.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada kupon promo aktif.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {coupons.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-800">{c.code}</span>
                  <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                    Diskon {c.pct}%
                  </span>
                </div>
                <div className="mt-1 truncate text-xs text-slate-600">{c.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
