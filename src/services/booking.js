import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { BOOKINGS_KEY, DATA_EVENT, ensureSeed } from './auth.js'
import { PROPERTIES_KEY } from './auth.js'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export async function getBookings({ partnerEmail, email } = {}) {
  if (USE_MOCK) {
    ensureSeed()
    let list = readList(BOOKINGS_KEY)
    const ownerByProperty = new Map(readList(PROPERTIES_KEY).map((p) => [String(p.id), p.partnerEmail]))
    list = list.map((b) => ({ ...b, partnerEmail: ownerByProperty.get(String(b.propertyId)) || null }))
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      list = list.filter((b) => b.partnerEmail?.trim().toLowerCase() === clean)
    }
    if (email) {
      const clean = String(email).trim().toLowerCase()
      list = list.filter((b) => b.email?.trim().toLowerCase() === clean)
    }
    return list
  }
  return request('/bookings')
}

export async function updateBookingStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Status tidak valid: ${status}`)
  }
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(BOOKINGS_KEY).map((b) => (b.id === id ? { ...b, status } : b))
    writeList(BOOKINGS_KEY, list)
    notify(DATA_EVENT)
    return list.find((b) => b.id === id)
  }
  return request(`/bookings/${id}/status`, { method: 'PATCH', body: { status } })
}

export const BOOKING_STATUS_LABELS = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}
