import { useData } from '../../hooks/useData.js'
import { getProperties, setPropertyStatus } from '../../services/property.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'

export default function PropertyModerationPage() {
  const { data, refresh } = useData(() => getProperties(), [])

  if (!data) return <PageLoader />

  const toggle = async (p) => {
    await setPropertyStatus(p.id, p.status === 'aktif' ? 'nonaktif' : 'aktif')
    refresh()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-rd-text">Moderasi Properti</h1>

      {data.length === 0 ? (
        <EmptyState title="Belum ada properti" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">Properti</th>
                <th className="px-4 py-3 font-bold">Mitra</th>
                <th className="px-4 py-3 font-bold">Kota</th>
                <th className="px-4 py-3 font-bold">Kamar</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-rd-border last:border-0">
                  <td className="px-4 py-3 font-bold text-rd-text">{p.name}</td>
                  <td className="px-4 py-3 text-rd-muted">{p.partnerEmail}</td>
                  <td className="px-4 py-3">{p.city}</td>
                  <td className="px-4 py-3">{p.roomTypes?.length || 0}</td>
                  <td className="px-4 py-3">
                    <Badge status={p.status}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => toggle(p)}>
                      {p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
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
