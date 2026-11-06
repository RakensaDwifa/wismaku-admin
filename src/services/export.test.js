import { describe, it, expect } from 'vitest'
import { formatCSVRow, generateBookingsCSV, generatePayoutsCSV } from './export.js'

describe('export service', () => {
  it('memformat baris CSV dengan kutip ganda jika ada koma', () => {
    const row = formatCSVRow(['ID-1', 'Hotel Sukma, Malioboro', 'Normal'])
    expect(row).toBe('ID-1,"Hotel Sukma, Malioboro",Normal')
  })

  it('menghasilkan format CSV untuk daftar reservasi pesanan', () => {
    const sampleBookings = [
      {
        id: 'BK-001',
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        propertyName: 'Wisma Malioboro',
        roomTypeName: 'Deluxe Room',
        rooms: 1,
        nights: 2,
        guestName: 'Andi Saputra',
        phone: '08123456789',
        email: 'andi@example.com',
        totalPrice: 500000,
        platformFee: 75000,
        partnerNet: 425000,
        status: 'confirmed',
        paymentMethod: 'Midtrans QRIS',
      },
    ]

    const csv = generateBookingsCSV(sampleBookings)
    expect(csv).toContain('ID Booking,Tanggal Check-In')
    expect(csv).toContain('BK-001')
    expect(csv).toContain('Wisma Malioboro')
    expect(csv).toContain('425000')
  })

  it('menghasilkan format CSV untuk riwayat pencairan dana', () => {
    const samplePayouts = [
      {
        id: 'PO-001',
        period_start: '2026-10-01',
        period_end: '2026-10-31',
        amount: 2500000,
        status: 'paid',
        transfer_ref: 'TRF-BCA-12345',
        paid_at: '2026-11-02',
        created_at: '2026-11-01',
      },
    ]

    const csv = generatePayoutsCSV(samplePayouts)
    expect(csv).toContain('ID Payout,Periode Awal')
    expect(csv).toContain('PO-001')
    expect(csv).toContain('2500000')
    expect(csv).toContain('TRF-BCA-12345')
  })
})
