import { USE_MOCK } from './api.js'
import { readList, writeList, notify } from './storage.js'
import { DATA_EVENT } from './auth.js'
import { supabase } from '../lib/supabase.js'

export const PAYOUTS_KEY = 'wismaku_admin_payouts'
export const BANK_INFO_KEY = 'wismaku_admin_bank_info'

export const seedPayouts = [
  {
    id: 'PO-202611-001',
    partner_email: 'mitra@wismaku.com',
    amount: 2550000,
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    status: 'paid',
    transfer_ref: 'TRF-BCA-98127391',
    paid_at: '2026-11-02T10:00:00Z',
    created_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'PO-202610-002',
    partner_email: 'mitra@wismaku.com',
    amount: 1870000,
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'paid',
    transfer_ref: 'TRF-BCA-87213812',
    paid_at: '2026-10-02T09:30:00Z',
    created_at: '2026-10-01T08:00:00Z',
  },
]

export function ensurePayoutSeed() {
  if (!USE_MOCK) return
  if (readList(PAYOUTS_KEY).length === 0) {
    writeList(PAYOUTS_KEY, seedPayouts)
  }
}

export async function getPayouts({ partnerEmail } = {}) {
  const cleanEmail = String(partnerEmail || '')
    .trim()
    .toLowerCase()

  if (USE_MOCK || !supabase) {
    ensurePayoutSeed()
    const list = readList(PAYOUTS_KEY)
    if (cleanEmail) {
      return list.filter((p) => String(p.partner_email).trim().toLowerCase() === cleanEmail)
    }
    return list
  }

  let query = supabase.from('partner_payouts').select('*').order('created_at', { ascending: false })
  if (cleanEmail) {
    query = query.eq('partner_email', cleanEmail)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export function getLocalBankInfo(email) {
  try {
    const raw = localStorage.getItem(`${BANK_INFO_KEY}_${email?.toLowerCase() || 'default'}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLocalBankInfo(email, info) {
  try {
    localStorage.setItem(`${BANK_INFO_KEY}_${email?.toLowerCase() || 'default'}`, JSON.stringify(info))
  } catch {
    // ignore
  }
}

export async function getBankInfo(user) {
  const local = getLocalBankInfo(user?.email)
  if (local) return local

  if (!USE_MOCK && supabase && user) {
    const { data } = await supabase.auth.getUser()
    const bank = data?.user?.user_metadata?.bank_info
    if (bank) {
      setLocalBankInfo(user.email, bank)
      return bank
    }
  }

  return {
    bankName: 'BCA (Bank Central Asia)',
    accountNumber: '8820192831',
    accountHolder: user?.name || 'Mitra WismaKu',
  }
}

export async function saveBankInfo(user, bankInfo) {
  if (!bankInfo?.bankName || !bankInfo?.accountNumber || !bankInfo?.accountHolder) {
    throw new Error('Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.')
  }

  setLocalBankInfo(user?.email, bankInfo)

  if (!USE_MOCK && supabase) {
    const { error } = await supabase.auth.updateUser({
      data: { bank_info: bankInfo },
    })
    if (error) throw new Error(error.message)
  }

  notify(DATA_EVENT)
  return bankInfo
}
