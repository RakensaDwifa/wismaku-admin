import { describe, it, expect, beforeEach } from 'vitest'
import { getRefundRequests, REFUNDS_KEY } from './refund.js'
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
})
