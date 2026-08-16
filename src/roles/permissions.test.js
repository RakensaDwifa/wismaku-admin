import { describe, it, expect } from 'vitest'
import { hasPermission, rolePermissions } from '../roles/permissions.js'

describe('RBAC permissions', () => {
  it('member hanya punya izin dasar', () => {
    expect(hasPermission('member', 'member.view')).toBe(true)
    expect(hasPermission('member', 'property.create')).toBe(false)
    expect(hasPermission('member', 'order.update')).toBe(false)
  })

  it('mitra bisa kelola properti, kamar, dan kupon', () => {
    expect(hasPermission('mitra', 'property.create')).toBe(true)
    expect(hasPermission('mitra', 'room.update')).toBe(true)
    expect(hasPermission('mitra', 'coupon.delete')).toBe(true)
    expect(hasPermission('mitra', 'partner.verify')).toBe(false)
  })

  it('staff bisa verifikasi mitra dan moderasi properti/ulasan', () => {
    expect(hasPermission('staff', 'partner.verify')).toBe(true)
    expect(hasPermission('staff', 'property.moderate')).toBe(true)
    expect(hasPermission('staff', 'review.moderate')).toBe(true)
    expect(hasPermission('staff', 'coupon.create')).toBe(false)
  })

  it('superadmin memiliki semua izin', () => {
    for (const permission of Object.values(rolePermissions).flat()) {
      expect(hasPermission('superadmin', permission)).toBe(true)
    }
  })
})
