import { describe, it, expect, beforeEach } from 'vitest'
import { getBookings, updateBookingStatus } from './booking.js'
import { ensureSeed } from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('booking service', () => {
  it('menampilkan semua pesanan untuk staff', async () => {
    ensureSeed()
    const all = await getBookings()
    expect(all.length).toBeGreaterThan(0)
  })

  it('memfilter pesanan milik mitra tertentu', async () => {
    ensureSeed()
    const byPartner = await getBookings({ partnerEmail: 'mitra@wismaku.com' })
    expect(byPartner.length).toBeGreaterThan(0)
    expect(byPartner.every((b) => b.partnerEmail === 'mitra@wismaku.com')).toBe(true)
  })

  it('memfilter pesanan per tamu', async () => {
    ensureSeed()
    const byGuest = await getBookings({ email: 'member@wismaku.com' })
    expect(byGuest.length).toBeGreaterThan(0)
    expect(byGuest.every((b) => b.email === 'member@wismaku.com')).toBe(true)
  })

  it('mengubah status pesanan', async () => {
    ensureSeed()
    const all = await getBookings()
    const up = await updateBookingStatus(all[0].id, 'confirmed')
    expect(up.status).toBe('confirmed')
  })

  it('menolak status tidak valid', async () => {
    ensureSeed()
    const all = await getBookings()
    await expect(updateBookingStatus(all[0].id, 'random')).rejects.toThrow()
  })
})
