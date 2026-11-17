import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OrdersPage from './OrdersPage.jsx'
import * as authHook from '../hooks/useAuth.js'
import * as bookingService from '../services/booking.js'
import * as refundService from '../services/refund.js'

describe('OrdersPage.jsx Component Tests (Sanggah Dispute Mitra & Reschedule Badge)', () => {
  const sampleBooking = {
    id: 'b-dispute-1',
    guestName: 'Budi Santoso',
    email: 'budi@test.com',
    phone: '0812345678',
    propertyName: 'Wisma Asri',
    roomTypeName: 'Standar',
    rooms: 1,
    nights: 2,
    checkIn: '2026-11-20',
    checkOut: '2026-11-22',
    totalPrice: 400000,
    status: 'confirmed',
    rescheduleCount: 1,
    originalCheckIn: '2026-11-18',
    originalCheckOut: '2026-11-20',
  }

  const sampleRefund = {
    id: 'ref-1',
    bookingId: 'b-dispute-1',
    guestName: 'Budi Santoso',
    email: 'budi@test.com',
    amount: 400000,
    reason: 'Kamar tidak sesuai foto',
    status: 'pending',
    partnerResponse: null,
    partnerEvidenceUrl: null,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { email: 'mitra@test.com', subRole: 'owner' },
    })
    vi.spyOn(bookingService, 'getBookings').mockResolvedValue([sampleBooking])
    vi.spyOn(refundService, 'getRefundRequests').mockResolvedValue([sampleRefund])
  })

  it('merender badge reschedule dan kartu permohonan refund dengan tombol Sanggah', async () => {
    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    // Badge reschedule terdeteksi
    expect(screen.getByText(/🗓️ Rescheduled \(1x\)/i)).toBeInTheDocument()

    // Tombol sanggah refund tersedia
    const disputeBtn = screen.getByRole('button', { name: /⚖️ Sanggah/i })
    expect(disputeBtn).toBeInTheDocument()
  })

  it('klik tombol Sanggah membuka modal, submit mengirim argumen dan URL bukti ke refundService', async () => {
    const respondSpy = vi.spyOn(refundService, 'respondToRefundRequest').mockResolvedValue({ ok: true })
    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })

    const disputeBtn = screen.getByRole('button', { name: /⚖️ Sanggah/i })
    fireEvent.click(disputeBtn)

    // Modal terbuka
    expect(screen.getByText(/Klaim Pengajuan Tamu:/i)).toBeInTheDocument()

    // Isi tanggapan dan bukti URL
    const textarea = screen.getByPlaceholderText(/Jelaskan alasan penolakan refund/i)
    fireEvent.change(textarea, { target: { value: 'Kamar sudah di-upgrade ke tipe lebih tinggi' } })

    const inputUrl = screen.getByPlaceholderText(/https:\/\/.../i)
    fireEvent.change(inputUrl, { target: { value: 'https://cdn.wismaku.com/evidence/room-clean.jpg' } })

    const submitBtn = screen.getByRole('button', { name: /Kirim Sanggahan ke HQ/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(respondSpy).toHaveBeenCalledWith('ref-1', {
        response: 'Kamar sudah di-upgrade ke tipe lebih tinggi',
        evidenceUrl: 'https://cdn.wismaku.com/evidence/room-clean.jpg',
      })
    })
  })
})
