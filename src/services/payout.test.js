import { describe, it, expect, beforeEach } from 'vitest'
import { getPayouts, getBankInfo, saveBankInfo } from './payout.js'

describe('payout service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mengembalikan daftar payout untuk mitra tertentu', async () => {
    const list = await getPayouts({ partnerEmail: 'mitra@wismaku.com' })
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
    expect(list[0].partner_email).toBe('mitra@wismaku.com')
  })

  it('mengembalikan default bank info jika belum disimpan', async () => {
    const info = await getBankInfo({ email: 'mitra@wismaku.com', name: 'Mitra WismaKu' })
    expect(info.bankName).toBeTruthy()
    expect(info.accountNumber).toBeTruthy()
    expect(info.accountHolder).toBeTruthy()
  })

  it('dapat menyimpan dan membaca ulang info rekening bank mitra', async () => {
    const payload = {
      bankName: 'Bank Mandiri',
      accountNumber: '1370019283719',
      accountHolder: 'PT Sukma Wisata Ayu',
    }
    await saveBankInfo({ email: 'mitra@wismaku.com' }, payload)

    const saved = await getBankInfo({ email: 'mitra@wismaku.com' })
    expect(saved.bankName).toBe('Bank Mandiri')
    expect(saved.accountNumber).toBe('1370019283719')
    expect(saved.accountHolder).toBe('PT Sukma Wisata Ayu')
  })

  it('menolak simpan rekening jika ada field yang kosong', async () => {
    await expect(saveBankInfo({ email: 'mitra@wismaku.com' }, { bankName: 'BCA' })).rejects.toThrow(
      'Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.',
    )
  })
})
