import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useData } from '../hooks/useData.js'
import { getBookings, updateBookingStatus, BOOKING_STATUS_LABELS } from '../services/booking.js'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageLoader from '../components/PageLoader.jsx'

export default function OrdersPage() {
  const { user } = useAuth()
  const filter = { partnerEmail: user?.email }
  const { data, refresh } = useData(() => getBookings(filter), [user?.email])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [activeBooking, setActiveBooking] = useState(null)

  if (!data) return <PageLoader />

  const changeStatus = async (id, status) => {
    setBusyId(id)
    try {
      await updateBookingStatus(id, status)
      await refresh()
      if (activeBooking && activeBooking.id === id) {
        setActiveBooking({ ...activeBooking, status })
      }
    } finally {
      setBusyId(null)
    }
  }

  const filtered = data.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      String(b.id).toLowerCase().includes(q) ||
      (b.guestName || '').toLowerCase().includes(q) ||
      (b.propertyName || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q)
    )
  })

  const totalBookings = data.length
  const confirmedCount = data.filter((b) => b.status === 'confirmed').length
  const completedCount = data.filter((b) => b.status === 'completed').length
  const totalPartnerNet = data
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.partnerNet || b.totalPrice * 0.85), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pesanan Masuk & Resepsionis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Layanan front desk untuk validasi check-in tamu, status reservasi menginap, dan transparansi bagi
          hasil kamar.
        </p>
      </div>

      {/* Grid Metrik Resepsionis */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Reservasi Masuk"
          value={totalBookings}
          hint="Semua transaksi pemesanan"
          badge="Total"
        />
        <StatCard
          label="Siap Check-In / Menginap"
          value={confirmedCount}
          hint="Tamu telah melunasi pesanan"
          badge={confirmedCount > 0 ? `${confirmedCount} Tamu` : 'Clear'}
        />
        <StatCard
          label="Tamu Selesai Menginap"
          value={completedCount}
          hint="Pesanan tuntas (Check-out)"
          badge="Completed"
        />
        <StatCard
          label="Total Hak Bersih Mitra"
          value={`Rp ${totalPartnerNet.toLocaleString('id-ID')}`}
          hint="85% dari pesanan valid"
          badge="Net 85%"
        />
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'confirmed', label: 'Siap Check-In' },
            { id: 'completed', label: 'Selesai Menginap' },
            { id: 'pending', label: 'Menunggu Bayar' },
            { id: 'cancelled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID Booking, nama tamu, no HP..."
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan yang sesuai"
          description="Coba ubah kata kunci pencarian atau filter status reservasi Anda."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">ID & Tanggal Menginap</th>
                <th className="px-4 py-3">Properti & Kamar</th>
                <th className="px-4 py-3">Data Tamu</th>
                <th className="px-4 py-3">Bagi Hasil (Net 85%)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi Resepsionis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-teal-700">{b.id}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {b.checkIn ?? '—'} s.d. {b.checkOut ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{b.propertyName}</div>
                    <div className="text-xs text-slate-500">
                      {b.roomTypeName || 'Kamar Standar'} ({b.rooms || 1} kamar, {b.nights || 1} malam)
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{b.guestName}</div>
                    <div className="text-xs text-slate-500">{b.phone || b.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-emerald-700">
                      Rp {(b.partnerNet || b.totalPrice * 0.85).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Kotor: Rp {(b.totalPrice || 0).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={b.status}>{BOOKING_STATUS_LABELS[b.status] || b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveBooking(b)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Detail
                      </button>

                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => changeStatus(b.id, 'completed')}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === b.id ? '...' : 'Selesai (Check-Out)'}
                        </button>
                      )}

                      {b.status === 'pending' && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => changeStatus(b.id, 'cancelled')}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Tamu & Reservasi */}
      {activeBooking && (
        <Modal title={`Detail Reservasi #${activeBooking.id}`} onClose={() => setActiveBooking(null)}>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Properti</div>
                  <div className="text-base font-extrabold text-slate-900">{activeBooking.propertyName}</div>
                </div>
                <Badge status={activeBooking.status} />
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {activeBooking.roomTypeName} • {activeBooking.rooms || 1} Kamar • {activeBooking.nights || 1}{' '}
                Malam
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-100 p-3">
                <span className="font-bold text-slate-400 block mb-1">Check-In</span>
                <span className="font-extrabold text-slate-800">{activeBooking.checkIn}</span>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <span className="font-bold text-slate-400 block mb-1">Check-Out</span>
                <span className="font-extrabold text-slate-800">{activeBooking.checkOut}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Tamu:</span>
                <span className="font-bold text-slate-900">{activeBooking.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Telepon:</span>
                <span className="font-mono font-bold text-teal-700">{activeBooking.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Tamu:</span>
                <span className="font-mono text-slate-700">{activeBooking.email || '—'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">Total Biaya Tamu:</span>
                <span className="font-bold text-slate-800">
                  Rp {(activeBooking.totalPrice || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Hak Bersih Mitra (85%):</span>
                <span>
                  Rp {(activeBooking.partnerNet || activeBooking.totalPrice * 0.85).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {activeBooking.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => changeStatus(activeBooking.id, 'completed')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Tamu Selesai (Check-Out)
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveBooking(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
