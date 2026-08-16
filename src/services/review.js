import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { ReviewPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PROPERTIES_KEY, DATA_EVENT, ensureSeed } from './auth.js'

export async function getReviews({ partnerEmail } = {}) {
  if (USE_MOCK) {
    ensureSeed()
    let properties = readList(PROPERTIES_KEY)
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      properties = properties.filter((p) => p.partnerEmail?.trim().toLowerCase() === clean)
    }
    return properties.flatMap((p) =>
      (p.reviews || []).map((r) => ({
        id: `${p.id}-${r.date}-${r.name}`,
        propertyId: p.id,
        propertyName: p.name,
        ...r,
      })),
    )
  }
  return request('/reviews')
}

export async function setReviewStatus(propertyId, reviewId, status) {
  if (USE_MOCK) {
    ensureSeed()
    let updated = null
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(propertyId)) return p
      const reviews = (p.reviews || []).map((r) => {
        if (`${p.id}-${r.date}-${r.name}` !== reviewId) return r
        updated = { ...r, status }
        return updated
      })
      return { ...p, reviews }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return updated
  }
  return request(`/properties/${propertyId}/reviews/${reviewId}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function addReview(payload) {
  const data = parsePayload(ReviewPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    let created = null
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(data.propertyId)) return p
      const review = {
        name: data.name,
        city: data.city,
        date: new Date().toISOString().slice(0, 10),
        rating: data.rating,
        text: data.text,
        status: 'aktif',
      }
      created = review
      return { ...p, reviews: [...(p.reviews || []), review] }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return created
  }
  return request('/reviews', { method: 'POST', body: data })
}
