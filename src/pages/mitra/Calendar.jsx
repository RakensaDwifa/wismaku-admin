import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getBookings } from '../../services/booking.js'
import { getProperties } from '../../services/property.js'
import { getBlackoutDates, createBlackoutDate, deleteBlackoutDate } from '../../services/blackout.js'
import StatCard from '../../components/StatCard.jsx'
import Modal from '../../components/Modal.jsx'
import Badge from '../../components/Badge.jsx'
import FormField from '../../components/FormField.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function CalendarPage() {
  const { user } = useAuth()
  const { data: bookings } = useData(() => getBookings({ partnerEmail: user?.email }), [user?.email])
  const { data: properties } = useData(() => getProperties({ partnerEmail: user?.email }), [user?.email])
  const { data: blackouts, refresh: refreshBlackouts } = useData(() => getBlackoutDates(), [])

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)) // Default Nov 2026
  const [selectedPropertyId, setSelectedPropertyId] = useState('all')
  const [activeDateModal, setActiveDateModal] = useState(null)

  // State Modal Blokir Kamar
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false)
  const [blockHotelId, setBlockHotelId] = useState('')
  const [blockRoomTypeId, setBlockRoomTypeId] = useState('')
  const [blockStartDate, setBlockStartDate] = useState('2026-11-01')
  const [blockEndDate, setBlockEndDate] = useState('2026-11-02')
  const [blockQty, setBlockQty] = useState('1')
  const [blockReason, setBlockReason] = useState('Tamu Offline / Walk-in')
  const [blockSaving, setBlockSaving] = useState(false)
  const [blockError, setBlockError] = useState('')

  if (!bookings || !properties || !blackouts) return <PageLoader />

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

  // Periksa pemblokiran kamar offline / blackout per tanggal
  const getDailyBlackouts = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return (blackouts || []).filter((b) => {
      if (selectedPropertyId !== 'all' && String(b.hotelId) !== String(selectedPropertyId)) return false
      return dateStr >= b.startDate && dateStr <= b.endDate
    })
  }

  const handleCreateBlackout = async (e) => {
    e.preventDefault()
    setBlockSaving(true)
    setBlockError('')
    try {
      await createBlackoutDate({
        hotelId: blockHotelId || (properties[0]?.id ? String(properties[0].id) : ''),
        roomTypeId: blockRoomTypeId || undefined,
        startDate: blockStartDate,
        endDate: blockEndDate,
        blockedQty: blockQty,
        reason: blockReason,
      })
      setIsBlackoutModalOpen(false)
      await refreshBlackouts()
    } catch (err) {
      setBlockError(err.message || 'Gagal memblokir ketersediaan kamar.')
    } finally {
      setBlockSaving(false)
    }
  }

  const handleDeleteBlackout = async (id) => {
    try {
      await deleteBlackoutDate(id)
      await refreshBlackouts()
      if (activeDateModal) {
        setActiveDateModal((prev) => ({
          ...prev,
          dailyBlackouts: (prev?.dailyBlackouts || []).filter((b) => b.id !== id),
        }))
      }
    } catch (err) {
      alert(`Gagal membuka blokir kamar: ${err.message}`)
    }
  }

  // Ringkasan metrik bulan berjalan
  let totalBookedRoomNights = 0
  let peakBookedRooms = 0
  let peakDay = 1

  for (let d = 1; d <= daysInMonth; d++) {
    const daily = getDailyBookings(d)
    const dailyBlocks = getDailyBlackouts(d)
    const bookedRooms = daily.reduce((sum, b) => sum + (b.rooms || 1), 0)
    const blockedRooms = dailyBlocks.reduce((sum, b) => sum + (b.blockedQty || 1), 0)
    const totalOccupied = bookedRooms + blockedRooms

    totalBookedRoomNights += totalOccupied
    if (totalOccupied > peakBookedRooms) {
      peakBookedRooms = totalOccupied
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

        {/* Filter Properti & Tombol Blokir Kamar Offline */}
        <div className="flex flex-wrap items-center gap-2">
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

          <button
            type="button"
            onClick={() => {
              setBlockHotelId(
                selectedPropertyId !== 'all'
                  ? selectedPropertyId
                  : properties[0]?.id
                    ? String(properties[0].id)
                    : '',
              )
              setBlockStartDate(`${year}-${String(month + 1).padStart(2, '0')}-01`)
              setBlockEndDate(`${year}-${String(month + 1).padStart(2, '0')}-02`)
              setBlockQty('1')
              setBlockReason('Tamu Offline / Walk-in')
              setBlockError('')
              setIsBlackoutModalOpen(true)
            }}
            className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
          >
            + Blokir Kamar Offline
          </button>
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
            const dailyBlackouts = getDailyBlackouts(dayNum)
            const bookedRooms = daily.reduce((sum, b) => sum + (b.rooms || 1), 0)
            const blockedRooms = dailyBlackouts.reduce((sum, b) => sum + (b.blockedQty || 1), 0)
            const totalOccupied = bookedRooms + blockedRooms
            const isFull = totalOccupied >= totalCapacity
            const isCrowded = !isFull && totalOccupied >= Math.ceil(totalCapacity * 0.5)

            let badgeStyle = 'border-slate-100 bg-slate-50/60 hover:border-slate-300'
            let pillStyle = 'bg-slate-100 text-slate-600'

            if (isFull) {
              badgeStyle = 'border-rose-200 bg-rose-50/70 hover:border-rose-400'
              pillStyle = 'bg-rose-100 text-rose-800 font-bold'
            } else if (isCrowded) {
              badgeStyle = 'border-amber-200 bg-amber-50/70 hover:border-amber-400'
              pillStyle = 'bg-amber-100 text-amber-800 font-bold'
            } else if (totalOccupied > 0) {
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
                    dailyBlackouts,
                    bookedRooms,
                    blockedRooms,
                    totalOccupied,
                    totalCapacity,
                  })
                }
                className={`flex h-24 flex-col justify-between rounded-xl border p-2.5 text-left transition-all ${badgeStyle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">{dayNum}</span>
                  {totalOccupied > 0 && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${pillStyle}`}>
                      {totalOccupied}/{totalCapacity}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {bookedRooms > 0 && (
                    <div className="truncate text-[10px] font-semibold text-slate-700">
                      {bookedRooms} Online ({daily.length} tamu)
                    </div>
                  )}
                  {blockedRooms > 0 && (
                    <div className="truncate text-[10px] font-bold text-amber-700">
                      {blockedRooms} Blokir Offline
                    </div>
                  )}
                  {totalOccupied === 0 && <div className="text-[11px] text-slate-400">Kosong</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal Detail Tamu & Blokir pada Tanggal yang Diklik */}
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
                    {activeDateModal.totalOccupied} dari {activeDateModal.totalCapacity} Kamar Terisi
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activeDateModal.bookedRooms} tamu online • {activeDateModal.blockedRooms || 0} kamar
                    diblokir offline
                  </div>
                </div>
                <Badge
                  status={
                    activeDateModal.totalOccupied >= activeDateModal.totalCapacity ? 'nonaktif' : 'aktif'
                  }
                >
                  {activeDateModal.totalOccupied >= activeDateModal.totalCapacity
                    ? 'Kamar Penuh'
                    : 'Tersedia'}
                </Badge>
              </div>
            </div>

            {/* Kamar Offline / Blackout Dates */}
            {activeDateModal.dailyBlackouts?.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                  Kamar Diblokir Offline / Walk-in ({activeDateModal.dailyBlackouts.length})
                </h3>
                <div className="space-y-2">
                  {activeDateModal.dailyBlackouts.map((bo) => (
                    <div
                      key={bo.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {bo.blockedQty} Kamar • {bo.reason}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Periode: {bo.startDate} s.d. {bo.endDate}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlackout(bo.id)}
                        className="rounded border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50"
                      >
                        Buka Blokir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Daftar Tamu Menginap ({activeDateModal.daily.length})
              </h3>

              {activeDateModal.daily.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  Tidak ada tamu online yang menginap pada tanggal ini.
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

      {/* Modal Tambah Blokir Kamar Offline */}
      {isBlackoutModalOpen && (
        <Modal
          title="Blokir Kamar Offline (Walk-in / Renovasi)"
          onClose={() => setIsBlackoutModalOpen(false)}
        >
          <form onSubmit={handleCreateBlackout} className="space-y-4 text-xs">
            <div className="rounded-lg bg-teal-50 p-3 text-teal-800">
              Kamar yang diblokir akan langsung dipotong dari kuota ketersediaan publik di WismaKu agar tidak
              terjadi <em>overbooking</em> saat menerima tamu walk-in atau perbaikan unit.
            </div>

            {blockError && (
              <div className="rounded-lg bg-red-50 p-3 font-semibold text-red-700">{blockError}</div>
            )}

            <FormField label="Pilih Properti Penginapan">
              <select
                required
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                value={blockHotelId}
                onChange={(e) => {
                  setBlockHotelId(e.target.value)
                  setBlockRoomTypeId('')
                }}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Tipe Kamar (Opsional)" hint="Kosongkan untuk pemblokiran kuota umum properti">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                value={blockRoomTypeId}
                onChange={(e) => setBlockRoomTypeId(e.target.value)}
              >
                <option value="">Semua Tipe Kamar (Umum)</option>
                {(
                  properties.find((p) => String(p.id) === String(blockHotelId))?.roomTypes ||
                  properties.find((p) => String(p.id) === String(blockHotelId))?.room_types ||
                  []
                ).map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tanggal Mulai Blokir">
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                />
              </FormField>

              <FormField label="Tanggal Selesai Blokir">
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Jumlah Kamar yang Diblokir" hint="Minimal 1 unit kamar">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={blockQty}
                  onChange={(e) => setBlockQty(e.target.value)}
                />
              </FormField>

              <FormField label="Alasan Pemblokiran">
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                >
                  <option value="Tamu Offline / Walk-in">Tamu Offline / Walk-in Langsung</option>
                  <option value="Renovasi / Maintenance Unit">Renovasi / Maintenance Unit</option>
                  <option value="Pesanan Grup / Corporate Direct">Pesanan Grup / Corporate Direct</option>
                  <option value="Kamar Rusak / Perbaikan AC">Kamar Rusak / Perbaikan Fasilitas</option>
                </select>
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBlackoutModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                disabled={blockSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={blockSaving}
                className="rounded-lg bg-teal-700 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
              >
                {blockSaving ? 'Menyimpan...' : 'Simpan Blokir Kamar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
