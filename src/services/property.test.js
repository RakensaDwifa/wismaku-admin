import { describe, it, expect, beforeEach } from 'vitest'
import {
  getProperties,
  createProperty,
  updateProperty,
  setPropertyStatus,
  deleteProperty,
  getRoomTypes,
  addRoomType,
  updateRoomType,
  deleteRoomType,
} from './property.js'

beforeEach(() => {
  localStorage.clear()
})

describe('property service', () => {
  it('mengembalikan properti milik mitra tertentu', async () => {
    const list = await getProperties({ partnerEmail: 'mitra@wismaku.com' })
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((p) => p.partnerEmail === 'mitra@wismaku.com')).toBe(true)
  })

  it('membuat properti baru dengan tipe kamar kosong', async () => {
    const p = await createProperty({
      name: 'Wisma Baru',
      city: 'Medan',
      status: 'aktif',
      amenities: ['WiFi'],
      partnerEmail: 'mitra@wismaku.com',
    })
    expect(p.roomTypes).toEqual([])
    expect(p.reviews).toEqual([])
    const list = await getProperties({ partnerEmail: 'mitra@wismaku.com' })
    expect(list.some((x) => x.id === p.id)).toBe(true)
  })

  it('validasi nama properti minimal 3 karakter', async () => {
    await expect(
      createProperty({
        name: 'A',
        city: 'Medan',
        status: 'aktif',
        partnerEmail: 'mitra@wismaku.com',
      }),
    ).rejects.toThrow()
  })

  it('mengubah properti dan status', async () => {
    const p = await createProperty({
      name: 'Wisma Baru',
      city: 'Medan',
      status: 'aktif',
      partnerEmail: 'mitra@wismaku.com',
    })
    const updated = await updateProperty(p.id, {
      name: 'Wisma Baru Update',
      city: 'Medan',
      status: 'aktif',
      partnerEmail: 'mitra@wismaku.com',
    })
    expect(updated.name).toBe('Wisma Baru Update')
    const off = await setPropertyStatus(p.id, 'nonaktif')
    expect(off.status).toBe('nonaktif')
  })

  it('CRUD tipe kamar', async () => {
    const p = await createProperty({
      name: 'Wisma Baru',
      city: 'Medan',
      status: 'aktif',
      partnerEmail: 'mitra@wismaku.com',
    })
    await addRoomType(p.id, { name: 'Deluxe', price: 250000, capacity: 2, qty: 2 })
    let rooms = await getRoomTypes(p.id)
    expect(rooms.length).toBe(1)
    await updateRoomType(p.id, rooms[0].id, { name: 'Deluxe+', price: 300000, capacity: 3, qty: 1 })
    rooms = await getRoomTypes(p.id)
    expect(rooms[0].name).toBe('Deluxe+')
    await deleteRoomType(p.id, rooms[0].id)
    rooms = await getRoomTypes(p.id)
    expect(rooms.length).toBe(0)
  })

  it('menghapus properti', async () => {
    const p = await createProperty({
      name: 'Wisma Hapus',
      city: 'Medan',
      status: 'aktif',
      partnerEmail: 'mitra@wismaku.com',
    })
    await deleteProperty(p.id)
    const list = await getProperties({ partnerEmail: 'mitra@wismaku.com' })
    expect(list.some((x) => x.id === p.id)).toBe(false)
  })
})
