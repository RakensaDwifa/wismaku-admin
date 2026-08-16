import { describe, it, expect, beforeEach } from 'vitest'
import { ensureSeed, login, logout, registerUser, getActiveUser } from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('auth service', () => {
  it('mengisi seed saat login', async () => {
    const user = await login('mitra@wismaku.com', 'password123')
    expect(user.role).toBe('mitra')
    expect(getActiveUser().role).toBe('mitra')
  })

  it('menolak kredensial salah', async () => {
    await expect(login('mitra@wismaku.com', 'salah')).rejects.toThrow('Email atau password salah.')
  })

  it('mengisi sesi per role', async () => {
    await login('staff@wismaku.com', 'password123')
    expect(getActiveUser().role).toBe('staff')
  })

  it('logout menghapus sesi', async () => {
    await login('member@wismaku.com', 'password123')
    await logout()
    expect(getActiveUser()).toBeNull()
  })

  it('register user baru dengan role', async () => {
    const user = await registerUser({
      name: 'Tamu Baru',
      email: 'baru@wismaku.com',
      password: 'rahasia123',
      role: 'member',
    })
    expect(user.role).toBe('member')
    await expect(
      registerUser({ name: 'Tamu Baru', email: 'baru@wismaku.com', password: 'rahasia123', role: 'member' }),
    ).rejects.toThrow('Email sudah terdaftar.')
  })

  it('seed hanya diisi sekali', async () => {
    ensureSeed()
    const first = JSON.parse(localStorage.getItem('wismaku_admin_users')).length
    ensureSeed()
    const second = JSON.parse(localStorage.getItem('wismaku_admin_users')).length
    expect(first).toBe(second)
  })
})
