import { supabase } from '../lib/supabase.js'
import { USE_MOCK } from './api.js'

export async function uploadHotelMedia(file, { folder = 'hotels' } = {}) {
  if (!file) throw new Error('File tidak ditemukan.')

  const maxBytes = 5 * 1024 * 1024 // 5MB
  if (file.size > maxBytes) {
    throw new Error('Ukuran file maksimal 5 MB.')
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (!validTypes.includes(file.type)) {
    throw new Error('Format file harus berupa JPG, PNG, WEBP, atau AVIF.')
  }

  if (USE_MOCK || !supabase) {
    // Fallback lokal data-url
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ publicUrl: reader.result, path: file.name })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const cleanName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${folder}/${cleanName}`

  const { error: uploadError } = await supabase.storage
    .from('hotel-assets')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    throw new Error(`Gagal mengunggah foto: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from('hotel-assets').getPublicUrl(filePath)
  return { publicUrl: data.publicUrl, path: filePath }
}

export async function uploadPartnerDocument(file, { folder = 'kyc' } = {}) {
  if (!file) throw new Error('Berkas tidak ditemukan.')

  const maxBytes = 5 * 1024 * 1024 // 5MB
  if (file.size > maxBytes) {
    throw new Error('Ukuran berkas dokumen maksimal 5 MB.')
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!validTypes.includes(file.type)) {
    throw new Error('Format berkas harus berupa JPG, PNG, WEBP, atau PDF.')
  }

  if (USE_MOCK || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ publicUrl: reader.result, path: file.name })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split('.').pop() || 'pdf'
  const cleanName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `${folder}/${cleanName}`

  const { error: uploadError } = await supabase.storage
    .from('partner-documents')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    throw new Error(`Gagal mengunggah dokumen: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from('partner-documents').getPublicUrl(filePath)
  return { publicUrl: data.publicUrl, path: filePath }
}
