import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useData } from '../hooks/useData.js'
import { getBookings, updateBookingStatus, BOOKING_STATUS_LABELS } from '../services/booking.js'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PageLoader from '../components/PageLoader.jsx'

export default function OrdersPage() {
  const { user } = useAuth()
  const filter = { partnerEmail: user?.email }
  const { data, refresh } = useData(() => getBookings(filter), [user?.email])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  if (!data) return <PageLoader />

  const changeStatus = async (id, status) => {
    setBusyId(id)
    try {
      await updateBookingStatus(id, status)
      await refresh()
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
      (b.propertyName || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-rd-text">Pesanan Masuk & Resepsionis</h1>
        <p className="text-sm text-rd-muted">
          Pantau tamu yang menginap, perbarui status kedatangan tamu, dan rincian bagi hasil.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'confirmed', 'completed', 'pending', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-rd text-white'
                  : 'bg-white border border-rd-border text-rd-text hover:bg-rd-soft'
              }`}
            >
              {st === 'all' ? 'Semua Pesanan' : BOOKING_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID booking / nama tamu..."
          className="rounded-lg border border-rd-border bg-white px-3 py-1.5 text-sm focus:border-rd focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Tidak ada pesanan yang sesuai" description="Ubah filter atau pencarian Anda." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">ID & Tanggal</th>
                <th className="px-4 py-3 font-bold">Properti & Kamar</th>
                <th className="px-4 py-3 font-bold">Tamu</th>
                <th className="px-4 py-3 font-bold">Bagi Hasil (Net 85%)</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi Resepsionis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-rd-border last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-rd">{b.id}</div>
                    <div className="text-xs text-rd-muted mt-0.5">
                      {b.checkIn ?? '—'} s.d. {b.checkOut ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-rd-text">{b.propertyName}</div>
                    <div className="text-xs text-rd-muted">
                      {b.roomTypeName || 'Standar'} ({b.rooms || 1} kamar, {b.nights || 1} malam)
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-rd-text">{b.guestName}</div>
                    <div className="text-xs text-rd-muted">{b.phone || b.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-emerald-700">
                      Rp {(b.partnerNet || b.totalPrice * 0.85).toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-rd-muted">
                      Kotor: Rp {(b.totalPrice || 0).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={b.status}>{BOOKING_STATUS_LABELS[b.status] || b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => changeStatus(b.id, 'completed')}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === b.id ? '...' : 'Tamu Selesai (Check-Out)'}
                        </button>
                      )}
                      {b.status !== 'completed' && b.status !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => changeStatus(b.id, 'cancelled')}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Batal
                        </button>
                      )}
                      {b.status === 'completed' && (
                        <span className="text-xs font-bold text-emerald-600">Selesai Menginap</span>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="text-xs font-bold text-rd-muted">Telah Dibatalkan</span>
                      )}
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
