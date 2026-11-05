import { USE_MOCK } from './api.js'
import { readList, writeList, readObject, writeObject, notify } from './storage.js'
import { UserPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { seedUsers, seedPartners, seedCoupons, seedBookings, seedProperties } from '../data/seed.js'
import { supabase } from '../lib/supabase.js'

export const USERS_KEY = 'wismaku_admin_users'
export const PARTNERS_KEY = 'wismaku_admin_partners'
export const PROPERTIES_KEY = 'wismaku_admin_properties'
export const COUPONS_KEY = 'wismaku_admin_coupons'
export const BOOKINGS_KEY = 'wismaku_admin_bookings'
export const ACTIVE_KEY = 'wismaku_admin_active'
export const SESSION_EVENT = 'wismaku-admin:session-changed'
export const DATA_EVENT = 'wismaku-admin:data-changed'

export function ensureSeed() {
  if (!USE_MOCK) return
  if (readList(USERS_KEY).length === 0) writeList(USERS_KEY, seedUsers)
  if (readList(PARTNERS_KEY).length === 0) writeList(PARTNERS_KEY, seedPartners)
  if (readList(PROPERTIES_KEY).length === 0) writeList(PROPERTIES_KEY, seedProperties)
  if (readList(COUPONS_KEY).length === 0) writeList(COUPONS_KEY, seedCoupons)
  if (readList(BOOKINGS_KEY).length === 0) writeList(BOOKINGS_KEY, seedBookings)
}

export async function login(email, password) {
  const clean = (email || '').trim().toLowerCase()
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const user = readList(USERS_KEY).find((u) => u.email.toLowerCase() === clean)
    if (!user || user.password !== password) throw new Error('Email atau password salah.')
    writeObject(ACTIVE_KEY, {
      name: user.name,
      email: user.email,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    })
    notify(SESSION_EVENT)
    return user
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password })
  if (error) throw new Error('Email atau password salah.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', data.user.id)
    .maybeSingle()

  const user = {
    id: data.user.id,
    name: profile?.name || data.user.email?.split('@')[0],
    email: data.user.email,
    role: profile?.role || 'mitra',
    loggedInAt: new Date().toISOString(),
  }

  writeObject(ACTIVE_KEY, user)
  notify(SESSION_EVENT)
  return user
}

export function getActiveUser() {
  return readObject(ACTIVE_KEY)
}

export async function logout() {
  if (supabase) {
    await supabase.auth.signOut().catch(() => {})
  }
  writeObject(ACTIVE_KEY, null)
  notify(SESSION_EVENT)
  return null
}

export async function registerUser(payload) {
  const data = parsePayload(UserPayloadSchema, payload)
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(USERS_KEY)
    if (list.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Email sudah terdaftar.')
    }
    const user = {
      id: `US-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      joinedAt: new Date().toISOString(),
    }
    list.push(user)
    writeList(USERS_KEY, list)
    notify(DATA_EVENT)
    return user
  }

  const { data: authUser, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { name: data.name },
    },
  })
  if (error) throw new Error(error.message)

  if (authUser?.user) {
    await supabase.from('profiles').update({ role: data.role, name: data.name }).eq('id', authUser.user.id)
  }

  notify(DATA_EVENT)
  return { id: authUser.user.id, ...data }
}
