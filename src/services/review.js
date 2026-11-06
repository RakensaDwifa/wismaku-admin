import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { ReviewPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PROPERTIES_KEY, DATA_EVENT, ensureSeed } from './auth.js'
import { supabase } from '../lib/supabase.js'

export async function getReviews({ partnerEmail, propertyId } = {}) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    let properties = readList(PROPERTIES_KEY)
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      properties = properties.filter((p) => p.partnerEmail?.trim().toLowerCase() === clean)
    }
    if (propertyId) {
      properties = properties.filter((p) => String(p.id) === String(propertyId))
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

  let query = supabase
    .from('reviews')
    .select('*, hotels!inner(id, name, partner_email)')
    .order('created_at', { ascending: false })

  if (partnerEmail) {
    const clean = String(partnerEmail).trim().toLowerCase()
    query = query.eq('hotels.partner_email', clean)
  }
  if (propertyId) {
    query = query.eq('hotel_id', String(propertyId))
  }

  const { data, error } = await query
  if (error) {
    return request('/reviews')
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    propertyId: r.hotel_id,
    propertyName: r.hotels?.name || 'Penginapan WismaKu',
    name: r.name,
    city: r.city || 'Indonesia',
    date: r.created_at ? r.created_at.slice(0, 10) : '2026-11-01',
    rating: r.rating,
    text: r.text,
    verifiedGuest: Boolean(r.verified_guest),
    status: 'aktif',
  }))
}

export async function setReviewStatus(propertyId, reviewId, status) {
  if (USE_MOCK || !supabase) {
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
  if (USE_MOCK || !supabase) {
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
