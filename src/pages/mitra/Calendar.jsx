import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getBookings } from '../../services/booking.js'
import { getProperties } from '../../services/property.js'
import StatCard from '../../components/StatCard.jsx'
import Modal from '../../components/Modal.jsx'
import Badge from '../../components/Badge.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function CalendarPage() {
  const { user } = useAuth()
  const { data: bookings } = useData(() => getBookings({ partnerEmail: user?.email }), [user?.email])
  const { data: properties } = useData(() => getProperties({ partnerEmail: user?.email }), [user?.email])

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)) // Default Nov 2026
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [activeDateModal, setActiveDateModal] = useState(null)

  if (!bookings || !properties) return <PageLoader />

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-based

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const todayMonth = () => setCurrentDate(new Date(2026, 10, 1))

  // Hitung jumlah hari dalam bulan ini
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Hari pertama dalam minggu (0: Minggu, 1: Senin, dst)
  const firstDayIndex = new Date(year, month, 1).getDay()
  // Sesuaikan agar Senin = 0, Minggu = 6
  const startOffset = (firstDayIndex + 6) % 7

  // Filter properti & kapasitas total
  const selectedProps =
    selectedPropertyId === 'all'
      ? properties
      : properties.filter((p) => String(p.id) === String(selectedPropertyId))

  const totalCapacity =
    selectedProps.reduce((sum, p) => {
      const propUnits = (p.roomTypes || []).reduce((u, r) => u + Number(r.qty || 0), 0)
      return sum + (propUnits > 0 ? propUnits : 5)
    }, 0) || 5

  // Filter pesanan aktif
  const validBookings = bookings.filter((b) => {
    if (b.status === 'cancelled') return false
    if (selectedPropertyId !== 'all' && String(b.propertyId) !== String(selectedPropertyId)) {
      return false
    }
    return true
  })

  // Periksa pesanan per tanggal YYYY-MM-DD
  const getDailyBookings = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return validBookings.filter((b) => {
      if (!b.checkIn || !b.checkOut) return false
      // Tamu menginap jika dateStr berada di antara checkIn dan checkOut
      return dateStr >= b.checkIn && dateStr < b.checkOut
    })
  }

  // Ringkasan metrik bulan berjalan
  let totalBookedRoomNights = 0
  let peakBookedRooms = 0
  let peakDay = 1

  for (let d = 1; d <= daysInMonth; d++) {
    const daily = getDailyBookings(d)
    const bookedRooms = daily.reduce((sum, b) => sum + (b.rooms || 1), 0)
    totalBookedRoomNights += bookedRooms
    if (bookedRooms > peakBookedRooms) {
      peakBookedRooms = bookedRooms
      peakDay = d
    }
  }

  const totalPossibleNights = totalCapacity * daysInMonth
  const monthlyOccupancyRate =
    totalPossibleNights > 0 ? Math.round((totalBookedRoomNights / totalPossibleNights) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Kalender Okupansi & Kepadatan Kamar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau ketersediaan kamar harian, jadwal tamu check-in, dan analisis tingkat keterisian bulanan.
          </p>
        </div>

        {/* Filter Properti */}
        <div className="flex items-center gap-2">
          <label htmlFor="calendar-property-select" className="text-xs font-bold text-slate-500">
            Properti:
          </label>
          <select
            id="calendar-property-select"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
          >
            <option value="all">Semua Penginapan ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Metrik Kalender */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tingkat Okupansi Bulan Ini"
          value={`${monthlyOccupancyRate}%`}
          hint={`${totalBookedRoomNights} dari ${totalPossibleNights} room-nights`}
          badge={monthlyOccupancyRate >= 60 ? 'Tinggi' : 'Stabil'}
        />
        <StatCard
          label="Total Kapasitas Harian"
          value={`${totalCapacity} Kamar`}
          hint="Unit siap huni per malam"
          badge="Kapasitas"
        />
        <StatCard
          label="Puncak Keterisian"
          value={`${peakBookedRooms} Kamar Terisi`}
          hint={`Puncak pada tanggal ${peakDay} ${monthNames[month]}`}
          badge="Puncak"
        />
        <StatCard
          label="Periode Kalender"
          value={`${monthNames[month]} ${year}`}
          hint={`${daysInMonth} hari operasional`}
          badge="Bulan Aktif"
        />
      </div>

      {/* Navigasi & Tampilan Matriks Kalender */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {/* Header Navigasi Kalender */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <button
              type="button"
              onClick={todayMonth}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Bulan Ini
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              &larr; Bulan Lalu
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Bulan Depan &rarr;
            </button>
          </div>
        </div>

        {/* Legend Warna Okupansi */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Indikator:</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span>Kamar Longgar (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span>Okupansi Padat (≥50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" />
            <span>Kamar Penuh (100%)</span>
          </div>
        </div>

        {/* Header Nama Hari */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2">
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div className="text-teal-700">Sab</div>
          <div className="text-teal-700">Min</div>
        </div>

        {/* Grid Sel Kalender */}
        <div className="grid grid-cols-7 gap-2">
          {/* Sel Kosong Sebelum Tanggal 1 */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="h-24 rounded-xl border border-dashed border-slate-100 bg-slate-50/40 p-2"
            />
          ))}

          {/* Sel Tanggal 1 s.d. Akhir Bulan */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1
            const daily = getDailyBookings(dayNum)
            const bookedRooms = daily.reduce((sum, b) => sum + (b.rooms || 1), 0)
            const isFull = bookedRooms >= totalCapacity
            const isCrowded = !isFull && bookedRooms >= Math.ceil(totalCapacity * 0.5)

            let badgeStyle = 'border-slate-100 bg-slate-50/60 hover:border-slate-300'
            let pillStyle = 'bg-slate-100 text-slate-600'

            if (isFull) {
              badgeStyle = 'border-rose-200 bg-rose-50/70 hover:border-rose-400'
              pillStyle = 'bg-rose-100 text-rose-800 font-bold'
            } else if (isCrowded) {
              badgeStyle = 'border-amber-200 bg-amber-50/70 hover:border-amber-400'
              pillStyle = 'bg-amber-100 text-amber-800 font-bold'
            } else if (bookedRooms > 0) {
              badgeStyle = 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'
              pillStyle = 'bg-emerald-100 text-emerald-800 font-bold'
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() =>
                  setActiveDateModal({
                    dayNum,
                    dateStr,
                    daily,
                    bookedRooms,
                    totalCapacity,
                  })
                }
                className={`flex h-24 flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${badgeStyle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">{dayNum}</span>
                  {bookedRooms > 0 && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${pillStyle}`}>
                      {bookedRooms}/{totalCapacity}
                    </span>
                  )}
                </div>

                <div>
                  {bookedRooms > 0 ? (
                    <div className="truncate text-[11px] font-semibold text-slate-600">
                      {daily.length} Tamu Menginap
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">Kosong</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal Detail Tamu pada Tanggal yang Diklik */}
      {activeDateModal && (
        <Modal
          title={`Keterisian Kamar — ${activeDateModal.dayNum} ${monthNames[month]} ${year}`}
          onClose={() => setActiveDateModal(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-500">Status Keterisian:</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {activeDateModal.bookedRooms} dari {activeDateModal.totalCapacity} Kamar Terisi
                  </div>
                </div>
                <Badge
                  status={activeDateModal.bookedRooms >= activeDateModal.totalCapacity ? 'nonaktif' : 'aktif'}
                >
                  {activeDateModal.bookedRooms >= activeDateModal.totalCapacity ? 'Kamar Penuh' : 'Tersedia'}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Tamu Menginap ({activeDateModal.daily.length})
              </h3>

              {activeDateModal.daily.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  Tidak ada tamu yang menginap pada tanggal ini. Seluruh kamar siap dipesan.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeDateModal.daily.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{b.guestName}</span>
                        <span className="font-mono text-[11px] font-bold text-teal-700">#{b.id}</span>
                      </div>
                      <div className="text-slate-600">
                        {b.propertyName} • {b.roomTypeName || 'Standar'} ({b.rooms || 1} kamar)
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>
                          Menginap: {b.checkIn} s.d. {b.checkOut}
                        </span>
                        <span className="font-mono font-bold text-slate-700">{b.phone || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveDateModal(null)}
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
