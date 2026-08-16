import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { CouponPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { COUPONS_KEY, DATA_EVENT, ensureSeed } from './auth.js'

export async function getCoupons({ partnerEmail } = {}) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(COUPONS_KEY)
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      return list.filter((c) => c.partnerEmail?.trim().toLowerCase() === clean)
    }
    return list
  }
  return request('/coupons')
}

export async function createCoupon(payload) {
  const data = parsePayload(CouponPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(COUPONS_KEY)
    if (list.some((c) => c.code === data.code && c.partnerEmail === data.partnerEmail)) {
      throw new Error('Kode kupon sudah ada untuk mitra ini.')
    }
    const coupon = {
      id: `CP-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      createdAt: new Date().toISOString(),
    }
    list.push(coupon)
    writeList(COUPONS_KEY, list)
    notify(DATA_EVENT)
    return coupon
  }
  return request('/coupons', { method: 'POST', body: data })
}

export async function updateCoupon(id, payload) {
  const data = parsePayload(CouponPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(COUPONS_KEY).map((c) => (c.id === id ? { ...c, ...data } : c))
    writeList(COUPONS_KEY, list)
    notify(DATA_EVENT)
    return list.find((c) => c.id === id)
  }
  return request(`/coupons/${id}`, { method: 'PATCH', body: data })
}

export async function deleteCoupon(id) {
  if (USE_MOCK) {
    ensureSeed()
    writeList(
      COUPONS_KEY,
      readList(COUPONS_KEY).filter((c) => c.id !== id),
    )
    notify(DATA_EVENT)
    return null
  }
  return request(`/coupons/${id}`, { method: 'DELETE' })
}
