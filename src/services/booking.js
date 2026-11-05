import { USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { BOOKINGS_KEY, PROPERTIES_KEY, DATA_EVENT, ensureSeed } from './auth.js'
import { supabase } from '../lib/supabase.js'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

function dbToBooking(row) {
  const totalPrice = Number(row.total_price ?? 0)
  const defaultFee = Math.round(totalPrice * 0.15)
  return {
    id: row.id,
    propertyId: row.hotel_id,
    propertyName: row.hotel_name,
    propertyImg: row.hotel_img,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    rooms: row.rooms,
    guests: row.guests,
    roomTypeId: row.room_type_id,
    roomTypeName: row.room_type_name,
    roomPrice: Number(row.room_price ?? 0),
    couponCode: row.coupon_code,
    couponDiscount: Number(row.coupon_discount ?? 0),
    totalPrice,
    platformFee: Number(row.platform_fee ?? defaultFee),
    partnerNet: Number(row.partner_net ?? totalPrice - defaultFee),
    guestName: row.guest_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}

export async function getBookings({ partnerEmail, email } = {}) {
  if (USE_MOCK || !supabase) {
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

  let query = supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (partnerEmail) {
    const { data: hotels } = await supabase
      .from('hotels')
      .select('id')
      .eq('partner_email', String(partnerEmail).trim().toLowerCase())
    const hotelIds = (hotels ?? []).map((h) => h.id)
    if (hotelIds.length === 0) return []
    query = query.in('hotel_id', hotelIds)
  }
  if (email) {
    query = query.eq('email', String(email).trim().toLowerCase())
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(dbToBooking)
}

export async function updateBookingStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Status tidak valid: ${status}`)
  }
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(BOOKINGS_KEY).map((b) => (b.id === id ? { ...b, status } : b))
    writeList(BOOKINGS_KEY, list)
    notify(DATA_EVENT)
    return list.find((b) => b.id === id)
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', String(id))
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return dbToBooking(data)
}

export const BOOKING_STATUS_LABELS = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}
