import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getProperties, setPropertyStatus, deleteProperty } from '../../services/property.js'
import StatCard from '../../components/StatCard.jsx'
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
  const [statusBusyId, setStatusBusyId] = useState(null)

  if (!data) return <PageLoader />

  const toggleStatus = async (p) => {
    setStatusBusyId(p.id)
    try {
      await setPropertyStatus(p.id, p.status === 'aktif' ? 'nonaktif' : 'aktif')
      refresh()
    } finally {
      setStatusBusyId(null)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteProperty(toDelete.id)
      setToDelete(null)
      refresh()
    } finally {
      setBusy(false)
    }
  }

  const activeCount = data.filter((p) => p.status === 'aktif').length
  const inactiveCount = data.filter((p) => p.status === 'nonaktif').length
  const totalRoomTypes = data.reduce((sum, p) => sum + (p.roomTypes?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Properti & Penginapan Saya</h1>
          <p className="mt-1 text-sm text-slate-500">
            Katalog properti penginapan, kontrol status penayangan, alokasi tipe kamar, dan pengaturan front
            desk.
          </p>
        </div>
        <Link
          to="/mitra/properti/baru"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
        >
          + Daftarkan Properti Baru
        </Link>
      </div>

      {/* Grid Metrik Properti */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Properti"
          value={data.length}
          hint="Penginapan yang Anda miliki"
          badge="Unit"
        />
        <StatCard
          label="Properti Aktif"
          value={activeCount}
          hint="Tampil dan dapat dipesan tamu"
          badge="Aktif"
        />
        <StatCard
          label="Properti Nonaktif"
          value={inactiveCount}
          hint="Disembunyikan sementara"
          badge={inactiveCount > 0 ? `${inactiveCount} Tertutup` : 'Semua Aktif'}
        />
        <StatCard
          label="Total Tipe Kamar"
          value={totalRoomTypes}
          hint="Alokasi varian kamar keseluruhan"
          badge="Kamar"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Belum ada properti terdaftar"
          description="Daftarkan properti pertama Anda untuk mulai menerima pemesanan tamu dari seluruh Indonesia."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100">
                  {p.img ? (
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-bold text-slate-400">
                      Foto Penginapan Belum Diunggah
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <Badge status={p.status}>{p.status}</Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-base font-extrabold text-slate-900">{p.name}</h2>
                    {p.rating > 0 && (
                      <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-600 border border-amber-200">
                        ★ {Number(p.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {p.city}
                    {p.area ? ` • ${p.area}` : ''}
                  </p>

                  {p.address && <p className="mt-1 text-xs text-slate-400 line-clamp-1">{p.address}</p>}

                  {/* Info Operasional Resepsionis */}
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">WA Front Desk:</span>
                      <span className="font-mono font-bold text-teal-700">
                        {p.receptionPhone || 'Belum diatur'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Check-In / Out:</span>
                      <span className="font-semibold text-slate-700">
                        {p.checkInTime || '14:00'} / {p.checkOutTime || '12:00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                      <span className="text-slate-400">Varian Kamar:</span>
                      <span className="font-bold text-slate-800">{p.roomTypes?.length || 0} Tipe Kamar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50/40">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-lg bg-teal-700 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 text-center"
                    type="button"
                    onClick={() => navigate(`/mitra/properti/${p.id}/kamar`)}
                  >
                    Kelola Kamar ({p.roomTypes?.length || 0})
                  </button>
                  <button
                    className="rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 text-center"
                    type="button"
                    onClick={() => navigate(`/mitra/properti/${p.id}`)}
                  >
                    Edit Profil
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1">
                  <button
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    type="button"
                    disabled={statusBusyId === p.id}
                    onClick={() => toggleStatus(p)}
                  >
                    {statusBusyId === p.id
                      ? '...'
                      : p.status === 'aktif'
                        ? 'Nonaktifkan Penayangan'
                        : 'Aktifkan Penayangan'}
                  </button>
                  <button
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition"
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
        message={`Properti "${toDelete?.name}" beserta seluruh tipe kamarnya akan dihapus permanen.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel={busy ? 'Menghapus...' : 'Ya, hapus'}
      />
    </div>
  )
}
