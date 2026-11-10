import { USE_MOCK } from './api.js'
import { readList } from './storage.js'
import { supabase } from '../lib/supabase.js'

export const REFUNDS_KEY = 'wismaku_admin_refunds'

export async function getRefundRequests() {
  if (USE_MOCK || !supabase) {
    return readList(REFUNDS_KEY) || []
  }

  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return []

    return (data ?? []).map((r) => ({
      id: r.id,
      bookingId: r.booking_id,
      hotelId: r.hotel_id,
      guestName: r.guest_name,
      email: r.email,
      amount: Number(r.amount || 0),
      reason: r.reason,
      status: r.status,
      hqNotes: r.hq_notes,
      createdAt: r.created_at,
    }))
  } catch {
    return []
  }
}
