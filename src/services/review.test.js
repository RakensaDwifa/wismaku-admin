import { describe, it, expect, beforeEach } from 'vitest'
import { getReviews, addReview, setReviewStatus } from './review.js'
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
})
