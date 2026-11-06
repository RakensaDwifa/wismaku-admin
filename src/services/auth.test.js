import { describe, it, expect, beforeEach } from 'vitest'
import {
  ensureSeed,
  login,
  logout,
  registerUser,
  getActiveUser,
  updateUserProfile,
  changePassword,
} from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('auth service', () => {
  it('mengisi seed saat login', async () => {
    const user = await login('mitra@wismaku.com', 'password123')
    expect(user.role).toBe('mitra')
    expect(getActiveUser().role).toBe('mitra')
  })

  it('dapat memperbarui profil nama dan telepon pengelola', async () => {
    await login('mitra@wismaku.com', 'password123')
    const updated = await updateUserProfile({ name: 'Hj. Sukma Ayu', phone: '08129876543' })
    expect(updated.name).toBe('Hj. Sukma Ayu')
    expect(updated.phone).toBe('08129876543')
    expect(getActiveUser().name).toBe('Hj. Sukma Ayu')
  })

  it('menolak update profil jika nama kurang dari 3 karakter', async () => {
    await login('mitra@wismaku.com', 'password123')
    await expect(updateUserProfile({ name: 'AB' })).rejects.toThrow('Nama pengelola minimal 3 karakter.')
  })

  it('dapat mengganti kata sandi akun', async () => {
    await login('mitra@wismaku.com', 'password123')
    const res = await changePassword('baruPassword123')
    expect(res).toBe(true)

    // Coba login dengan password baru
    const user = await login('mitra@wismaku.com', 'baruPassword123')
    expect(user.email).toBe('mitra@wismaku.com')
  })

  it('menolak ganti password kurang dari 6 karakter', async () => {
    await login('mitra@wismaku.com', 'password123')
    await expect(changePassword('123')).rejects.toThrow('Password baru minimal 6 karakter.')
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
