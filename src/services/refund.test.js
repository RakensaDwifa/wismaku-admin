import { describe, it, expect, beforeEach } from 'vitest'
import { getRefundRequests, respondToRefundRequest, REFUNDS_KEY } from './refund.js'
import { writeList } from './storage.js'

describe('refund service (wismaku-admin)', () => {
  beforeEach(() => {
    writeList(REFUNDS_KEY, [
      {
        id: 'ref-adm-1',
        bookingId: 'BK-001',
        hotelId: '1',
        guestName: 'Budi Santoso',
        amount: 300000,
        status: 'pending',
      },
    ])
  })

  it('mengembalikan permohonan refund mitra', async () => {
    const list = await getRefundRequests()
    expect(list.length).toBe(1)
    expect(list[0].bookingId).toBe('BK-001')
    expect(list[0].amount).toBe(300000)
  })

  it('dapat mengirim sanggahan dispute dari mitra dengan URL bukti', async () => {
    const updated = await respondToRefundRequest('ref-adm-1', {
      response: 'Tamu sudah melakukan check-in dan kunci telah diambil.',
      evidenceUrl: 'https://example.com/cctv-checkin.jpg',
    })

    expect(updated.partnerResponse).toContain('Tamu sudah melakukan check-in')
    expect(updated.partnerEvidenceUrl).toBe('https://example.com/cctv-checkin.jpg')
    expect(updated.partnerRespondedAt).toBeDefined()

    const list = await getRefundRequests()
    expect(list[0].partnerResponse).toBe(updated.partnerResponse)
    expect(list[0].partnerEvidenceUrl).toBe(updated.partnerEvidenceUrl)
  })

  it('menolak pengiriman tanggapan jika alasan sanggah kosong', async () => {
    await expect(
      respondToRefundRequest('ref-adm-1', {
        response: '   ',
      }),
    ).rejects.toThrow('Alasan sanggahan atau penjelasan mitra wajib diisi.')
  })
})
