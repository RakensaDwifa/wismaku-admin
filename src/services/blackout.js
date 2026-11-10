import { supabase } from '../lib/supabase.js'
import { USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { DATA_EVENT, ensureSeed } from './auth.js'

export const BLACKOUT_KEY = 'wismaku_admin_blackouts'

export async function getBlackoutDates({ hotelId } = {}) {
  if (USE_MOCK || !supabase) {
    ensureSeed()
    let list = readList(BLACKOUT_KEY)
    if (hotelId && hotelId !== 'all') {
      list = list.filter((b) => String(b.hotelId) === String(hotelId))
    }
    return list
  }

  let query = supabase.from('room_blackout_dates').select('*').order('start_date', { ascending: true })
  if (hotelId && hotelId !== 'all') {
    query = query.eq('hotel_id', String(hotelId))
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    hotelId: row.hotel_id,
    roomTypeId: row.room_type_id,
    startDate: row.start_date,
    endDate: row.end_date,
    blockedQty: Number(row.blocked_qty || 1),
    reason: row.reason || 'Tamu Offline / Walk-in',
    createdAt: row.created_at,
  }))
}

export async function createBlackoutDate({ hotelId, roomTypeId, startDate, endDate, blockedQty, reason }) {
  if (!hotelId) throw new Error('Pilih properti terlebih dahulu.')
  if (!startDate || !endDate) throw new Error('Tanggal mulai dan selesai harus diisi.')
  if (startDate > endDate) throw new Error('Tanggal mulai tidak boleh melebihi tanggal selesai.')

  const payload = {
    hotel_id: String(hotelId),
    room_type_id: roomTypeId || null,
    start_date: startDate,
    end_date: endDate,
    blocked_qty: Number(blockedQty) > 0 ? Number(blockedQty) : 1,
    reason: reason || 'Tamu Offline / Walk-in',
  }

  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(BLACKOUT_KEY)
    const newRecord = {
      id: `BO-${Date.now().toString(36).toUpperCase()}`,
      hotelId: payload.hotel_id,
      roomTypeId: payload.room_type_id,
      startDate: payload.start_date,
      endDate: payload.end_date,
      blockedQty: payload.blocked_qty,
      reason: payload.reason,
      createdAt: new Date().toISOString(),
    }
    list.push(newRecord)
    writeList(BLACKOUT_KEY, list)
    notify(DATA_EVENT)
    return newRecord
  }

  const { data, error } = await supabase.from('room_blackout_dates').insert(payload).select().single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return {
    id: data.id,
    hotelId: data.hotel_id,
    roomTypeId: data.room_type_id,
    startDate: data.start_date,
    endDate: data.end_date,
    blockedQty: Number(data.blocked_qty),
    reason: data.reason,
    createdAt: data.created_at,
  }
}

export async function deleteBlackoutDate(id) {
  if (!id) return
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(BLACKOUT_KEY).filter((b) => b.id !== id)
    writeList(BLACKOUT_KEY, list)
    notify(DATA_EVENT)
    return { success: true }
  }

  const { error } = await supabase.from('room_blackout_dates').delete().eq('id', id)
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return { success: true }
}
