import { describe, it, expect, beforeEach } from 'vitest'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from './coupon.js'

beforeEach(() => {
  localStorage.clear()
})

describe('coupon service', () => {
  it('membuat kupon milik mitra', async () => {
    const c = await createCoupon({
      code: 'HEMAT10',
      label: 'Hemat 10%',
      pct: 10,
      partnerEmail: 'mitra@wismaku.com',
    })
    expect(c.id).toBeTruthy()
    expect(c.partnerEmail).toBe('mitra@wismaku.com')
  })

  it('menolak kode kupon duplikat', async () => {
    await createCoupon({
      code: 'HEMAT10',
      label: 'Hemat 10%',
      pct: 10,
      partnerEmail: 'mitra@wismaku.com',
    })
    await expect(
      createCoupon({ code: 'HEMAT10', label: 'Lagi Hemat', pct: 5, partnerEmail: 'mitra@wismaku.com' }),
    ).rejects.toThrow('Kode kupon sudah ada untuk mitra ini.')
  })

  it('filter kupon per mitra', async () => {
    await createCoupon({ code: 'ABC', label: 'Kupon ABC', pct: 5, partnerEmail: 'mitra@wismaku.com' })
    const list = await getCoupons({ partnerEmail: 'mitra@wismaku.com' })
    expect(list.some((c) => c.code === 'ABC')).toBe(true)
  })

  it('update dan hapus kupon', async () => {
    const c = await createCoupon({
      code: 'ABC',
      label: 'Kupon ABC',
      pct: 5,
      partnerEmail: 'mitra@wismaku.com',
    })
    const up = await updateCoupon(c.id, {
      code: 'ABC',
      label: 'Kupon ABC Plus',
      pct: 8,
      partnerEmail: 'mitra@wismaku.com',
    })
    expect(up.label).toBe('Kupon ABC Plus')
    await deleteCoupon(c.id)
    const list = await getCoupons({ partnerEmail: 'mitra@wismaku.com' })
    expect(list.some((x) => x.id === c.id)).toBe(false)
  })
})
