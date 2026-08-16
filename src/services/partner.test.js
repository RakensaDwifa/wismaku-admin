import { describe, it, expect, beforeEach } from 'vitest'
import { getPartners, getPendingPartners, registerPartner, setPartnerStatus } from './partner.js'
import { ensureSeed } from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('partner service', () => {
  it('mengembalikan partner berdasarkan email', async () => {
    const list = await getPartners({ email: 'mitra@wismaku.com' })
    expect(list.length).toBeGreaterThan(0)
    expect(list[0].email).toBe('mitra@wismaku.com')
  })

  it('register partner baru berstatus pending', async () => {
    const p = await registerPartner({
      ownerName: 'Bapak Andi',
      propertyName: 'Wisma Andi',
      city: 'Bandung',
      email: 'andi@wismaku.com',
    })
    expect(p.status).toBe('pending')
    const pending = await getPendingPartners()
    expect(pending.some((x) => x.id === p.id)).toBe(true)
  })

  it('menolak email mitra duplikat', async () => {
    await expect(
      registerPartner({
        ownerName: 'Bapak Andi',
        propertyName: 'Wisma Andi',
        city: 'Bandung',
        email: 'mitra@wismaku.com',
      }),
    ).rejects.toThrow('Email mitra sudah terdaftar.')
  })

  it('staff bisa mengubah status verifikasi', async () => {
    ensureSeed()
    const pending = await getPendingPartners()
    const updated = await setPartnerStatus(pending[0].id, 'aktif')
    expect(updated.status).toBe('aktif')
  })
})
