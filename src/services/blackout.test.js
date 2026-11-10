import { describe, it, expect, beforeEach } from 'vitest'
import { getBlackoutDates, createBlackoutDate, deleteBlackoutDate, BLACKOUT_KEY } from './blackout.js'
import { writeList } from './storage.js'

describe('blackout service', () => {
  beforeEach(() => {
    writeList(BLACKOUT_KEY, [])
  })

  it('membuat dan membaca blackout date', async () => {
    const created = await createBlackoutDate({
      hotelId: 'hotel-1',
      roomTypeId: 'rt-deluxe',
      startDate: '2026-11-15',
      endDate: '2026-11-18',
      blockedQty: 2,
      reason: 'Tamu Offline Walk-in',
    })

    expect(created.id).toBeDefined()
    expect(created.blockedQty).toBe(2)

    const list = await getBlackoutDates({ hotelId: 'hotel-1' })
    expect(list.length).toBe(1)
    expect(list[0].reason).toBe('Tamu Offline Walk-in')
  })

  it('menghapus blackout date', async () => {
    const created = await createBlackoutDate({
      hotelId: 'hotel-1',
      startDate: '2026-11-15',
      endDate: '2026-11-16',
      blockedQty: 1,
    })

    await deleteBlackoutDate(created.id)
    const list = await getBlackoutDates({ hotelId: 'hotel-1' })
    expect(list.length).toBe(0)
  })

  it('validasi tanggal dan properti', async () => {
    await expect(
      createBlackoutDate({ hotelId: '', startDate: '2026-11-15', endDate: '2026-11-16' }),
    ).rejects.toThrow('Pilih properti terlebih dahulu')

    await expect(
      createBlackoutDate({ hotelId: 'hotel-1', startDate: '2026-11-20', endDate: '2026-11-10' }),
    ).rejects.toThrow('Tanggal mulai tidak boleh melebihi tanggal selesai')
  })
})
