import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CalendarPage from './Calendar.jsx'
import * as authHook from '../../hooks/useAuth.js'
import * as bookingService from '../../services/booking.js'
import * as propertyService from '../../services/property.js'
import * as blackoutService from '../../services/blackout.js'

describe('Calendar.jsx Component Tests (Blackout Dates offline block & modal)', () => {
  const sampleProperties = [
    {
      id: 'prop-1',
      name: 'Wisma Bahagia',
      roomTypes: [{ id: 'rt-1', name: 'Standar Single', qty: 5 }],
    },
  ]

  const sampleBlackouts = [
    {
      id: 'bo-1',
      hotel_id: 'prop-1',
      room_type_id: 'rt-1',
      start_date: '2026-11-05',
      end_date: '2026-11-06',
      blocked_rooms: 2,
      reason: 'Renovasi AC',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { email: 'mitra@test.com', subRole: 'owner' },
    })
    vi.spyOn(bookingService, 'getBookings').mockResolvedValue([])
    vi.spyOn(propertyService, 'getProperties').mockResolvedValue(sampleProperties)
    vi.spyOn(blackoutService, 'getBlackoutDates').mockResolvedValue(sampleBlackouts)
  })

  it('tombol Blokir Kamar Offline membuka modal dan memanggil createBlackoutDate saat submit', async () => {
    const createSpy = vi.spyOn(blackoutService, 'createBlackoutDate').mockResolvedValue({ id: 'bo-2' })

    render(<CalendarPage />)

    await waitFor(() => {
      expect(screen.getByText('Wisma Bahagia')).toBeInTheDocument()
    })

    const openBtn = screen.getByRole('button', { name: /\+ Blokir Kamar Offline/i })
    fireEvent.click(openBtn)

    expect(screen.getByText(/Blokir Kamar Offline \(Walk-in \/ Renovasi\)/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Simpan Blokir Kamar/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelId: 'prop-1',
          blockedQty: '1',
          reason: 'Tamu Offline / Walk-in',
        }),
      )
    })
  })
})
