import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { PropertyPayloadSchema, RoomTypePayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PROPERTIES_KEY, DATA_EVENT, ensureSeed } from './auth.js'

export async function getProperties({ partnerEmail } = {}) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY)
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      return list.filter((p) => p.partnerEmail?.trim().toLowerCase() === clean)
    }
    return list
  }
  return request('/properties')
}

export async function getProperty(id) {
  if (USE_MOCK) {
    ensureSeed()
    return readList(PROPERTIES_KEY).find((p) => String(p.id) === String(id)) ?? null
  }
  return request(`/properties/${id}`)
}

export async function createProperty(payload) {
  const data = parsePayload(PropertyPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY)
    const property = {
      id: Date.now(),
      ...data,
      amenities: data.amenities || [],
      roomTypes: [],
      reviews: [],
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    }
    list.push(property)
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return property
  }
  return request('/properties', { method: 'POST', body: data })
}

export async function updateProperty(id, payload) {
  const data = parsePayload(PropertyPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => (String(p.id) === String(id) ? { ...p, ...data } : p))
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(id))
  }
  return request(`/properties/${id}`, { method: 'PATCH', body: data })
}

export async function setPropertyStatus(id, status) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => (String(p.id) === String(id) ? { ...p, status } : p))
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(id))
  }
  return request(`/properties/${id}/status`, { method: 'PATCH', body: { status } })
}

export async function deleteProperty(id) {
  if (USE_MOCK) {
    ensureSeed()
    writeList(
      PROPERTIES_KEY,
      readList(PROPERTIES_KEY).filter((p) => String(p.id) !== String(id)),
    )
    notify(DATA_EVENT)
    return null
  }
  return request(`/properties/${id}`, { method: 'DELETE' })
}

export async function getRoomTypes(propertyId) {
  const property = await getProperty(propertyId)
  return property?.roomTypes ?? []
}

export async function addRoomType(propertyId, payload) {
  const data = parsePayload(RoomTypePayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(propertyId)) return p
      const roomType = {
        id: `${propertyId}-${Date.now().toString(36).toLowerCase()}`,
        ...data,
      }
      return { ...p, roomTypes: [...p.roomTypes, roomType] }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(propertyId))
  }
  return request(`/properties/${propertyId}/room-types`, { method: 'POST', body: data })
}

export async function updateRoomType(propertyId, roomTypeId, payload) {
  const data = parsePayload(RoomTypePayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(propertyId)) return p
      return {
        ...p,
        roomTypes: p.roomTypes.map((r) => (r.id === roomTypeId ? { ...r, ...data } : r)),
      }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(propertyId))
  }
  return request(`/properties/${propertyId}/room-types/${roomTypeId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function deleteRoomType(propertyId, roomTypeId) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(propertyId)) return p
      return { ...p, roomTypes: p.roomTypes.filter((r) => r.id !== roomTypeId) }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return null
  }
  return request(`/properties/${propertyId}/room-types/${roomTypeId}`, { method: 'DELETE' })
}
