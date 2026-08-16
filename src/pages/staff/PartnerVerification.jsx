import { useState } from 'react'
import { useData } from '../../hooks/useData.js'
import { getPartners, setPartnerStatus } from '../../services/partner.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function PartnerVerificationPage() {
  const { data, refresh } = useData(() => getPartners(), [])
  const [filter, setFilter] = useState('pending')

  if (!data) return <PageLoader />

  const list = filter === 'all' ? data : data.filter((p) => p.status === filter)

  const applyStatus = async (id, status) => {
    await setPartnerStatus(id, status)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-rd-text">Verifikasi Mitra</h1>
        <select
          className="rounded-lg border border-rd-border bg-white px-3 py-2 text-sm font-semibold text-rd-text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter status mitra"
        >
          <option value="pending">Menunggu</option>
          <option value="aktif">Aktif</option>
          <option value="ditolak">Ditolak</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada data" desc="Tidak ada mitra dengan status ini." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">Pemilik</th>
                <th className="px-4 py-3 font-bold">Properti</th>
                <th className="px-4 py-3 font-bold">Kota</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-rd-border last:border-0">
                  <td className="px-4 py-3 font-bold text-rd-text">{p.ownerName}</td>
                  <td className="px-4 py-3">{p.propertyName}</td>
                  <td className="px-4 py-3">{p.city}</td>
                  <td className="px-4 py-3 text-rd-muted">{p.email}</td>
                  <td className="px-4 py-3">
                    <Badge status={p.status}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-primary btn-sm mr-2"
                          type="button"
                          onClick={() => applyStatus(p.id, 'aktif')}
                        >
                          Terima
                        </button>
                        <button
                          className="btn btn-outline btn-sm text-red-600"
                          type="button"
                          onClick={() => applyStatus(p.id, 'ditolak')}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
