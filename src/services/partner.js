import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { PartnerPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PARTNERS_KEY, DATA_EVENT, ensureSeed } from './auth.js'
import { supabase } from '../lib/supabase.js'

export async function getPartnerKyc(email) {
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase()
  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PARTNERS_KEY)
    const partner = list.find((p) => p.email?.trim().toLowerCase() === cleanEmail) || null
    return partner
      ? {
          id: partner.id,
          email: partner.email,
          ownerName: partner.owner_name || partner.ownerName,
          propertyName: partner.property_name || partner.propertyName,
          kycStatus: partner.kyc_status || partner.kycStatus || 'unsubmitted',
          idCardNumber: partner.id_card_number || partner.idCardNumber || '',
          nibOrNpwp: partner.nib_or_npwp || partner.nibOrNpwp || '',
          idCardUrl: partner.id_card_url || partner.idCardUrl || '',
          businessDocUrl: partner.business_doc_url || partner.businessDocUrl || '',
          rejectionReason: partner.kyc_rejection_reason || partner.rejectionReason || '',
          submittedAt: partner.kyc_submitted_at || partner.submittedAt,
        }
      : null
  }

  const { data, error } = await supabase.from('partners').select('*').eq('email', cleanEmail).maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    id: data.id,
    email: data.email,
    ownerName: data.owner_name,
    propertyName: data.property_name,
    kycStatus: data.kyc_status || 'unsubmitted',
    idCardNumber: data.id_card_number || '',
    nibOrNpwp: data.nib_or_npwp || '',
    idCardUrl: data.id_card_url || '',
    businessDocUrl: data.business_doc_url || '',
    rejectionReason: data.kyc_rejection_reason || '',
    submittedAt: data.kyc_submitted_at,
  }
}

export async function submitPartnerKyc({ id, email, idCardNumber, nibOrNpwp, idCardUrl, businessDocUrl }) {
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase()
  const submittedAt = new Date().toISOString()

  if (USE_MOCK || !supabase) {
    ensureSeed()
    const list = readList(PARTNERS_KEY)
    let partner = list.find((p) => (id && p.id === id) || p.email?.trim().toLowerCase() === cleanEmail)
    if (!partner) {
      partner = {
        id: id || `PT-${Date.now().toString(36).toUpperCase()}`,
        email: cleanEmail,
        owner_name: 'Mitra',
        property_name: 'Properti Mitra',
        city: 'Jakarta',
        status: 'pending',
      }
      list.push(partner)
    }
    partner.kyc_status = 'pending'
    partner.id_card_number = idCardNumber
    partner.nib_or_npwp = nibOrNpwp
    partner.id_card_url = idCardUrl
    partner.business_doc_url = businessDocUrl
    partner.kyc_submitted_at = submittedAt
    partner.kyc_rejection_reason = null
    writeList(PARTNERS_KEY, list)
    notify(DATA_EVENT)
    return partner
  }

  const payload = {
    kyc_status: 'pending',
    id_card_number: idCardNumber,
    nib_or_npwp: nibOrNpwp,
    id_card_url: idCardUrl,
    business_doc_url: businessDocUrl,
    kyc_submitted_at: submittedAt,
    kyc_rejection_reason: null,
  }

  if (id) {
    const { data, error } = await supabase.from('partners').update(payload).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    notify(DATA_EVENT)
    return data
  }

  const { data: existing } = await supabase
    .from('partners')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle()
  if (existing) {
    const { data, error } = await supabase
      .from('partners')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    notify(DATA_EVENT)
    return data
  }

  const { data, error } = await supabase
    .from('partners')
    .insert({
      email: cleanEmail,
      owner_name: cleanEmail.split('@')[0],
      property_name: 'Properti Mitra',
      city: 'jakarta',
      status: 'pending',
      ...payload,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  notify(DATA_EVENT)
  return data
}

export async function getPartners({ email } = {}) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PARTNERS_KEY)
    if (email) {
      const clean = String(email).trim().toLowerCase()
      return list.filter((p) => p.email?.trim().toLowerCase() === clean)
    }
    return list
  }
  return request('/partners')
}

export async function getPendingPartners() {
  if (USE_MOCK) {
    ensureSeed()
    return readList(PARTNERS_KEY).filter((p) => p.status === 'pending')
  }
  return request('/partners?status=pending')
}

export async function registerPartner(payload) {
  const data = parsePayload(PartnerPayloadSchema, payload)
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PARTNERS_KEY)
    if (list.some((p) => p.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Email mitra sudah terdaftar.')
    }
    const partner = {
      id: `PT-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }
    list.push(partner)
    writeList(PARTNERS_KEY, list)
    notify(DATA_EVENT)
    return partner
  }
  return request('/partners', { method: 'POST', body: data })
}

export async function setPartnerStatus(id, status) {
  if (USE_MOCK) {
    ensureSeed()
    const list = readList(PARTNERS_KEY).map((p) => (p.id === id ? { ...p, status } : p))
    writeList(PARTNERS_KEY, list)
    notify(DATA_EVENT)
    return list.find((p) => p.id === id)
  }
  return request(`/partners/${id}/status`, { method: 'PATCH', body: { status } })
}
