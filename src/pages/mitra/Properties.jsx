import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getProperties, setPropertyStatus, deleteProperty } from '../../services/property.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

export default function PropertiesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, refresh } = useData(() => getProperties({ partnerEmail: user?.email }), [user?.email])
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!data) return <PageLoader />

  const toggleStatus = async (p) => {
    await setPropertyStatus(p.id, p.status === 'aktif' ? 'nonaktif' : 'aktif')
  }

  const confirmDelete = async () => {
    setBusy(true)
    await deleteProperty(toDelete.id)
    setToDelete(null)
    setBusy(false)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-rd-text">Properti Saya</h1>
        <Link to="/mitra/properti/baru" className="btn btn-primary btn-sm">
          + Tambah Properti
        </Link>
      </div>

      {data.length === 0 ? (
        <EmptyState title="Belum ada properti" desc="Tambahkan properti pertama Anda." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-rd-border bg-white shadow-rd">
              {p.img && <img src={p.img} alt={p.name} className="h-36 w-full object-cover" loading="lazy" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="truncate font-extrabold text-rd-text">{p.name}</h2>
                  <Badge status={p.status}>{p.status}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-rd-muted">
                  {p.city}
                  {p.area ? ` · ${p.area}` : ''} · {p.roomTypes?.length || 0} tipe kamar
                </p>
                {p.rating > 0 && <p className="mt-1 text-sm font-bold text-rd">★ {p.rating}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="btn btn-outline btn-sm"
                    type="button"
                    onClick={() => navigate(`/mitra/properti/${p.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    type="button"
                    onClick={() => navigate(`/mitra/properti/${p.id}/kamar`)}
                  >
                    Kamar
                  </button>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => toggleStatus(p)}>
                    {p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm text-red-600"
                    type="button"
                    onClick={() => setToDelete(p)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus properti?"
        message={`Properti "${toDelete?.name}" beserta tipe kamarnya akan dihapus permanen.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel={busy ? 'Menghapus...' : 'Ya, hapus'}
      />
    </div>
  )
}
