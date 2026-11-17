import { USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { supabase } from '../lib/supabase.js'
import { DATA_EVENT } from './auth.js'

export const REFUNDS_KEY = 'wismaku_admin_refunds'

export async function getRefundRequests() {
  if (USE_MOCK || !supabase) {
    const list = readList(REFUNDS_KEY) || []
    return list.map((r) => ({
      id: r.id,
      bookingId: r.bookingId || r.booking_id,
      hotelId: r.hotelId || r.hotel_id,
      guestName: r.guestName || r.guest_name,
      email: r.email,
      amount: Number(r.amount || 0),
      reason: r.reason,
      status: r.status,
      hqNotes: r.hqNotes || r.hq_notes,
      partnerResponse: r.partnerResponse || r.partner_response || null,
      partnerEvidenceUrl: r.partnerEvidenceUrl || r.partner_evidence_url || null,
      partnerRespondedAt: r.partnerRespondedAt || r.partner_responded_at || null,
      createdAt: r.createdAt || r.created_at,
    }))
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
      partnerResponse: r.partner_response || null,
      partnerEvidenceUrl: r.partner_evidence_url || null,
      partnerRespondedAt: r.partner_responded_at || null,
      createdAt: r.created_at,
    }))
  } catch {
    return []
  }
}

export async function respondToRefundRequest(refundId, { response, evidenceUrl = null }) {
  if (!response || !response.trim()) {
    throw new Error('Alasan sanggahan atau penjelasan mitra wajib diisi.')
  }

  const respondedAt = new Date().toISOString()
  const cleanResponse = response.trim()
  const cleanUrl = evidenceUrl ? evidenceUrl.trim() : null

  if (USE_MOCK || !supabase) {
    const list = readList(REFUNDS_KEY) || []
    const idx = list.findIndex((r) => r.id === refundId)
    if (idx === -1) {
      throw new Error('Permohonan dispute refund tidak ditemukan.')
    }
    list[idx] = {
      ...list[idx],
      partnerResponse: cleanResponse,
      partnerEvidenceUrl: cleanUrl,
      partnerRespondedAt: respondedAt,
    }
    writeList(REFUNDS_KEY, list)
    notify(DATA_EVENT)
    return list[idx]
  }

  const { data, error } = await supabase
    .from('refund_requests')
    .update({
      partner_response: cleanResponse,
      partner_evidence_url: cleanUrl,
      partner_responded_at: respondedAt,
    })
    .eq('id', refundId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return data
}
