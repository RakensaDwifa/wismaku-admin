import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProfilePage from './Profile.jsx'
import * as authHook from '../../hooks/useAuth.js'
import * as authService from '../../services/auth.js'
import * as partnerService from '../../services/partner.js'

describe('Profile.jsx Component Tests (Sub-Role Selection & KYC Submission)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { name: 'Pak Budi', phone: '0812345678', email: 'budi@mitra.test', subRole: 'owner' },
    })
    vi.spyOn(partnerService, 'getPartnerKyc').mockResolvedValue({
      id: 'part-1',
      idCardNumber: '3201123456780001',
      nibOrNpwp: '9120001234567',
      idCardUrl: 'https://cdn.wismaku.com/docs/ktp.jpg',
      businessDocUrl: 'https://cdn.wismaku.com/docs/nib.pdf',
    })
  })

  it('mengizinkan pengubahan sub-role dari owner ke frontdesk dan memanggil updateUserProfile', async () => {
    const updateSpy = vi.spyOn(authService, 'updateUserProfile').mockResolvedValue({ ok: true })

    render(<ProfilePage />)

    // Form profile tampil
    expect(screen.getByDisplayValue('Pak Budi')).toBeInTheDocument()

    // Ganti sub-role ke frontdesk
    const roleSelect = screen.getByDisplayValue(/Pemilik Properti \(Owner\)/i)
    fireEvent.change(roleSelect, { target: { value: 'frontdesk' } })

    // Teks hak akses berubah
    expect(screen.getByText(/Operasional Frontdesk \(Rekening Dikunci\)/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Simpan Perubahan Profil/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        name: 'Pak Budi',
        phone: '0812345678',
        subRole: 'frontdesk',
      })
      expect(screen.getByText(/Profil pengelola & hak sub-akun berhasil diperbarui/i)).toBeInTheDocument()
    })
  })

  it('mengirimkan data KYC saat form verifikasi legalitas disubmit', async () => {
    const kycSpy = vi.spyOn(partnerService, 'submitPartnerKyc').mockResolvedValue({
      id: 'part-1',
      idCardNumber: '3201123456780002',
      nibOrNpwp: '9120001234567',
      idCardUrl: 'https://cdn.wismaku.com/docs/ktp.jpg',
      businessDocUrl: 'https://cdn.wismaku.com/docs/nib.pdf',
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('3201123456780001')).toBeInTheDocument()
    })

    const ktpInput = screen.getByDisplayValue('3201123456780001')
    fireEvent.change(ktpInput, { target: { value: '3201123456780002' } })

    const submitKycBtn = screen.getByRole('button', { name: /Ajukan \/ Perbarui Verifikasi KYC/i })
    fireEvent.click(submitKycBtn)

    await waitFor(() => {
      expect(kycSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          idCardNumber: '3201123456780002',
        }),
      )
    })
  })
})
