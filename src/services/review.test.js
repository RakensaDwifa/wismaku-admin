import { describe, it, expect, beforeEach } from 'vitest'
import { getReviews, addReview, setReviewStatus, replyReview } from './review.js'
import { ensureSeed } from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('review service', () => {
  it('mengembalikan semua ulasan ter-flatten dengan info properti', async () => {
    ensureSeed()
    const list = await getReviews()
    expect(list.length).toBeGreaterThan(0)
    for (const r of list) {
      expect(r.propertyName).toBeTruthy()
    }
  })

  it('menambahkan ulasan baru', async () => {
    ensureSeed()
    const all = await getReviews()
    const target = all[0]
    const created = await addReview({
      propertyId: target.propertyId,
      name: 'Budi',
      rating: 5,
      text: 'Mantap banget!',
    })
    expect(created.status).toBe('aktif')
    const list = await getReviews({ propertyId: target.propertyId })
    expect(list.some((r) => r.name === 'Budi')).toBe(true)
  })

  it('moderasi status ulasan', async () => {
    ensureSeed()
    const all = await getReviews()
    const target = all[0]
    const up = await setReviewStatus(target.propertyId, target.id, 'nonaktif')
    expect(up.status).toBe('nonaktif')
  })

  it('dapat mengirim balasan resmi dari mitra pengelola', async () => {
    ensureSeed()
    const all = await getReviews()
    const target = all[0]
    const replyText = 'Terima kasih atas kunjungannya, kami tunggu kedatangan Anda kembali!'
    const user = { name: 'Mitra Sukma' }

    const res = await replyReview(target.id, replyText, user)
    expect(res.replyText).toBe(replyText)
    expect(res.repliedBy).toBe('Mitra Sukma')
    expect(res.repliedAt).toBeTruthy()

    const refreshed = await getReviews()
    const found = refreshed.find((r) => r.id === target.id)
    expect(found.reply).toBeTruthy()
    expect(found.reply.replyText).toBe(replyText)
  })

  it('menolak balasan ulasan dengan teks kosong', async () => {
    ensureSeed()
    const all = await getReviews()
    const target = all[0]

    await expect(replyReview(target.id, '   ', { name: 'Mitra' })).rejects.toThrow(
      'Teks balasan ulasan tidak boleh kosong.',
    )
  })
})
