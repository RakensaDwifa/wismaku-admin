import { request, USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { PartnerPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { PARTNERS_KEY, DATA_EVENT, ensureSeed } from './auth.js'

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
