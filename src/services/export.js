export function formatCSVRow(cells) {
  return cells
    .map((c) => {
      const str = c === null || c === undefined ? '' : String(c)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    .join(',')
}

export function generateBookingsCSV(bookings) {
  const headers = [
    'ID Booking',
    'Tanggal Check-In',
    'Tanggal Check-Out',
    'Nama Properti',
    'Tipe Kamar',
    'Jumlah Kamar',
    'Jumlah Malam',
    'Nama Tamu',
    'No Telepon Tamu',
    'Email Tamu',
    'Total Omzet Kotor (Rp)',
    'Komisi WismaKu 15% (Rp)',
    'Hak Bersih Mitra 85% (Rp)',
    'Status Pemesanan',
    'Metode Pembayaran',
  ]

  const rows = (bookings || []).map((b) => [
    b.id,
    b.checkIn,
    b.checkOut,
    b.propertyName,
    b.roomTypeName || 'Standar',
    b.rooms || 1,
    b.nights || 1,
    b.guestName,
    b.phone || '',
    b.email || '',
    Number(b.totalPrice || 0),
    Number(b.platformFee || Math.round((b.totalPrice || 0) * 0.15)),
    Number(b.partnerNet || Math.round((b.totalPrice || 0) * 0.85)),
    b.status,
    b.paymentMethod || 'Online Gateway',
  ])

  return [formatCSVRow(headers), ...rows.map(formatCSVRow)].join('\r\n')
}

export function generatePayoutsCSV(payouts) {
  const headers = [
    'ID Payout',
    'Periode Awal',
    'Periode Akhir',
    'Nominal Bersih (Rp)',
    'Status Payout',
    'Nomor Referensi Transfer',
    'Tanggal Ditransfer',
    'Tanggal Diajukan',
  ]

  const rows = (payouts || []).map((p) => [
    p.id,
    p.period_start,
    p.period_end,
    Number(p.amount || 0),
    p.status,
    p.transfer_ref || 'Belum Ditransfer',
    p.paid_at || '',
    p.created_at || '',
  ])

  return [formatCSVRow(headers), ...rows.map(formatCSVRow)].join('\r\n')
}

export function downloadCSV(filename, content) {
  if (typeof window === 'undefined') return
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
