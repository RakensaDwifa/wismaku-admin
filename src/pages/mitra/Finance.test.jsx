import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Finance from './Finance.jsx'
import * as authHook from '../../hooks/useAuth.js'
import * as payoutService from '../../services/payout.js'
import * as bookingService from '../../services/booking.js'

describe('Finance.jsx Component Tests (Role Owner vs Frontdesk)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(payoutService, 'getPayouts').mockResolvedValue([])
    vi.spyOn(bookingService, 'getBookings').mockResolvedValue([])
    vi.spyOn(payoutService, 'getBankInfo').mockResolvedValue({
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '1234567890',
      accountHolder: 'Mitra Sukses',
    })
  })

  it('mengunci tombol simpan dan mendisabled input untuk role frontdesk', async () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { email: 'staff@mitra.com', subRole: 'frontdesk' },
    })

    render(<Finance />)

    // Tunggu data ter-load (melewati PageLoader)
    await waitFor(() => {
      expect(screen.getByText(/Keuangan & Pencairan Dana/i)).toBeInTheDocument()
    })

    // Label Front Desk (Read-Only) tampil
    expect(screen.getByText(/Front Desk \(Read-Only\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Proteksi Sub-Akun Front Desk/i)).toBeInTheDocument()

    // Input rekening disamarkan dan disabled
    const selectBank = screen.getByRole('combobox')
    expect(selectBank).toBeDisabled()

    // Tombol simpan terkunci dan disabled
    const submitBtn = screen.getByRole('button', { name: /Terkunci \(Hanya Wewenang Owner\)/i })
    expect(submitBtn).toBeDisabled()
  })

  it('mengizinkan submit rekening untuk role owner', async () => {
    const saveSpy = vi.spyOn(payoutService, 'saveBankInfo').mockResolvedValue({ ok: true })
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { email: 'owner@mitra.com', subRole: 'owner' },
    })

    render(<Finance />)

    await waitFor(() => {
      expect(screen.getByText(/Keuangan & Pencairan Dana/i)).toBeInTheDocument()
    })

    // Label Owner Akses tampil
    expect(screen.getByText(/Owner Akses/i)).toBeInTheDocument()

    // Tombol simpan aktif
    const submitBtn = screen.getByRole('button', { name: /Simpan Rekening Bank/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled()
      expect(screen.getByText(/Informasi rekening bank berhasil disimpan/i)).toBeInTheDocument()
    })
  })
})
