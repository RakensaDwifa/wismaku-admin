import { USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { PropertyPayloadSchema, RoomTypePayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PROPERTIES_KEY, DATA_EVENT, ensureSeed } from './auth.js'
import { supabase } from '../lib/supabase.js'

function dbToProperty(row) {
  const roomTypes = (row.room_types ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    originalPrice: Number(r.original_price ?? r.originalPrice ?? r.price),
    capacity: Number(r.capacity ?? 2),
    qty: Number(r.available_rooms ?? r.qty ?? 1),
    amenities: r.amenities ?? [],
  }))

  return {
    id: row.id,
    name: row.name,
    city: row.cities?.name || row.city_id || 'Jakarta',
    area: row.area || '',
    address: row.address || '',
    img: row.img || '',
    desc: row.description || '',
    amenities: row.amenities ?? [],
    partnerEmail: row.partner_email || '',
    commissionRate: row.commission_rate ?? 0.15,
    status: row.policies?.status || 'aktif',
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    roomTypes,
    rawRoomTypes: row.room_types ?? [],
    createdAt: row.created_at,
  }
}

export async function getProperties({ partnerEmail } = {}) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY)
    if (partnerEmail) {
      const clean = String(partnerEmail).trim().toLowerCase()
      return list.filter((p) => p.partnerEmail?.trim().toLowerCase() === clean)
    }
    return list
  }

  let query = supabase.from('hotels').select('*, cities(name)').order('id', { ascending: true })
  if (partnerEmail) {
    query = query.eq('partner_email', String(partnerEmail).trim().toLowerCase())
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(dbToProperty)
}

export async function getProperty(id) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    return readList(PROPERTIES_KEY).find((p) => String(p.id) === String(id)) ?? null
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('*, cities(name)')
    .eq('id', String(id))
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? dbToProperty(data) : null
}

export async function createProperty(payload) {
  const data = parsePayload(PropertyPayloadSchema, payload)
  if (USE_MOCK || !supabase) {
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

  const slug = (data.name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const newId = String(Date.now())
  const row = {
    id: newId,
    name: data.name,
    slug: `${slug}-${newId.slice(-4)}`,
    city_id: (data.city || 'jakarta').toLowerCase().trim(),
    area: data.area || null,
    address: data.address || null,
    img: data.img || null,
    description: data.desc || null,
    amenities: data.amenities || [],
    partner_email: data.partnerEmail?.trim().toLowerCase(),
    commission_rate: 0.15,
    room_types: [],
  }
  const { data: created, error } = await supabase.from('hotels').insert(row).select().single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(created)
}

export async function updateProperty(id, payload) {
  const data = parsePayload(PropertyPayloadSchema, payload)
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => (String(p.id) === String(id) ? { ...p, ...data } : p))
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(id))
  }

  const updates = {
    name: data.name,
    area: data.area || null,
    address: data.address || null,
    img: data.img || null,
    description: data.desc || null,
    amenities: data.amenities || [],
    partner_email: data.partnerEmail?.trim().toLowerCase(),
  }
  const { data: updated, error } = await supabase
    .from('hotels')
    .update(updates)
    .eq('id', String(id))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(updated)
}

export async function setPropertyStatus(id, status) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => (String(p.id) === String(id) ? { ...p, status } : p))
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(id))
  }

  const prop = await getProperty(id)
  const currentPolicies = prop?.policies ?? {}
  const { data: updated, error } = await supabase
    .from('hotels')
    .update({ policies: { ...currentPolicies, status } })
    .eq('id', String(id))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(updated)
}

export async function deleteProperty(id) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    writeList(
      PROPERTIES_KEY,
      readList(PROPERTIES_KEY).filter((p) => String(p.id) !== String(id)),
    )
    notify(DATA_EVENT)
    return null
  }

  const { error } = await supabase.from('hotels').delete().eq('id', String(id))
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return null
}

export async function getRoomTypes(propertyId) {
  const property = await getProperty(propertyId)
  return property?.roomTypes ?? []
}

export async function addRoomType(propertyId, payload) {
  const data = parsePayload(RoomTypePayloadSchema, payload)
  if (USE_MOCK || !supabase) {
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

  const prop = await getProperty(propertyId)
  if (!prop) throw new Error('Properti tidak ditemukan.')
  const newRoom = {
    id: `${propertyId}-${Date.now().toString(36).toLowerCase()}`,
    name: data.name,
    price: Number(data.price),
    original_price: Number(data.originalPrice || data.price),
    capacity: Number(data.capacity || 2),
    available_rooms: Number(data.qty ?? 1),
  }
  const rawTypes = prop.rawRoomTypes || []
  const updatedTypes = [...rawTypes, newRoom]
  const { data: updated, error } = await supabase
    .from('hotels')
    .update({ room_types: updatedTypes })
    .eq('id', String(propertyId))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(updated)
}

export async function updateRoomType(propertyId, roomTypeId, payload) {
  const data = parsePayload(RoomTypePayloadSchema, payload)
  if (USE_MOCK || !supabase) {
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

  const prop = await getProperty(propertyId)
  if (!prop) throw new Error('Properti tidak ditemukan.')
  const rawTypes = prop.rawRoomTypes || []
  const updatedTypes = rawTypes.map((r) =>
    r.id === roomTypeId
      ? {
          ...r,
          name: data.name,
          price: Number(data.price),
          original_price: Number(data.originalPrice || data.price),
          capacity: Number(data.capacity || 2),
          available_rooms: Number(data.qty ?? 1),
        }
      : r,
  )
  const { data: updated, error } = await supabase
    .from('hotels')
    .update({ room_types: updatedTypes })
    .eq('id', String(propertyId))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(updated)
}

export async function deleteRoomType(propertyId, roomTypeId) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PROPERTIES_KEY).map((p) => {
      if (String(p.id) !== String(propertyId)) return p
      return {
        ...p,
        roomTypes: p.roomTypes.filter((r) => r.id !== roomTypeId),
      }
    })
    writeList(PROPERTIES_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => String(p.id) === String(propertyId))
  }

  const prop = await getProperty(propertyId)
  if (!prop) throw new Error('Properti tidak ditemukan.')
  const rawTypes = prop.rawRoomTypes || []
  const updatedTypes = rawTypes.filter((r) => r.id !== roomTypeId)
  const { data: updated, error } = await supabase
    .from('hotels')
    .update({ room_types: updatedTypes })
    .eq('id', String(propertyId))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToProperty(updated)
}
