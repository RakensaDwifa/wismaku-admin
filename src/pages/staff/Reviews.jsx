import { useState } from 'react'
import { useData } from '../../hooks/useData.js'
import { getReviews, setReviewStatus } from '../../services/review.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function ReviewsPage() {
  const { data, refresh } = useData(() => getReviews(), [])
  const [filter, setFilter] = useState('all')

  if (!data) return <PageLoader />

  const list = filter === 'all' ? data : data.filter((r) => r.status === filter)

  const toggle = async (r) => {
    await setReviewStatus(r.propertyId, r.id, r.status === 'aktif' ? 'nonaktif' : 'aktif')
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-rd-text">Moderasi Ulasan</h1>
        <select
          className="rounded-lg border border-rd-border bg-white px-3 py-2 text-sm font-semibold text-rd-text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter status ulasan"
        >
          <option value="all">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada ulasan" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-rd-text">
                    {r.name} <span className="font-normal text-rd">★ {r.rating}</span>
                  </p>
                  <p className="text-xs text-rd-muted">
                    {r.propertyName} · {r.city || '-'} · {r.date}
                  </p>
                </div>
                <Badge status={r.status}>{r.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-rd-text">{r.text}</p>
              <div className="mt-3 text-right">
                <button className="btn btn-outline btn-sm" type="button" onClick={() => toggle(r)}>
                  {r.status === 'aktif' ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
