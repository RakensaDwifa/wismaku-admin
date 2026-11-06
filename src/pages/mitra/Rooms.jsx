import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../../hooks/useData.js'
import { getProperty, addRoomType, updateRoomType, deleteRoomType } from '../../services/property.js'
import StatCard from '../../components/StatCard.jsx'
import Modal from '../../components/Modal.jsx'
import FormField from '../../components/FormField.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const EMPTY = { name: '', price: '', originalPrice: '', capacity: '2', qty: '1' }

export default function RoomsPage() {
  const { id } = useParams()
  const { data: property, refresh } = useData(() => getProperty(id), [id])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [busyRoomId, setBusyRoomId] = useState(null)

  if (!property) return <PageLoader />

  const openAdd = () => {
    setForm(EMPTY)
    setEditing({ mode: 'add' })
    setError('')
  }

  const openEdit = (r) => {
    setForm({
      name: r.name,
      price: String(r.price),
      originalPrice: r.originalPrice ? String(r.originalPrice) : '',
      capacity: String(r.capacity),
      qty: String(r.qty ?? 1),
    })
    setEditing({ mode: 'edit', roomType: r })
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        capacity: Number(form.capacity),
        qty: Number(form.qty),
      }
      if (editing.mode === 'edit') await updateRoomType(id, editing.roomType.id, payload)
      else await addRoomType(id, payload)
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleAvailability = async (r) => {
    setBusyRoomId(r.id)
    try {
      const nextQty = r.qty > 0 ? 0 : 1
      await updateRoomType(id, r.id, {
        name: r.name,
        price: Number(r.price),
        originalPrice: r.originalPrice ? Number(r.originalPrice) : undefined,
        capacity: Number(r.capacity),
        qty: nextQty,
      })
      refresh()
    } finally {
      setBusyRoomId(null)
    }
  }

  const confirmDelete = async () => {
    await deleteRoomType(id, toDelete.id)
    setToDelete(null)
    refresh()
  }

  const roomTypes = property.roomTypes || []
  const totalUnits = roomTypes.reduce((sum, r) => sum + Number(r.qty || 0), 0)
  const activeRooms = roomTypes.filter((r) => r.qty > 0).length
  const closedRooms = roomTypes.filter((r) => r.qty === 0).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/mitra/properti"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition"
          >
            &larr; Kembali ke Daftar Properti
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Alokasi & Ketersediaan Kamar
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola tipe kamar, tarif menginap per malam, dan kontrol kuota ketersediaan untuk{' '}
            <span className="font-bold text-slate-800">{property.name}</span>.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
          type="button"
          onClick={openAdd}
        >
          + Tambah Tipe Kamar
        </button>
      </div>

      {/* Grid Metrik Kamar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tipe Kamar"
          value={roomTypes.length}
          hint="Varian kamar terdaftar"
          badge="Varian"
        />
        <StatCard
          label="Total Unit Siap Huni"
          value={`${totalUnits} Kamar`}
          hint="Kapasitas total penginapan"
          badge="Kapasitas"
        />
        <StatCard
          label="Tipe Buka (Tersedia)"
          value={activeRooms}
          hint="Dapat dipesan oleh tamu"
          badge="Open"
        />
        <StatCard
          label="Tipe Tutup / Habis"
          value={closedRooms}
          hint="Disetop dari penjualan"
          badge={closedRooms > 0 ? 'Penuh/Tutup' : 'Semua Buka'}
        />
      </div>

      {roomTypes.length === 0 ? (
        <EmptyState
          title="Belum ada tipe kamar"
          description="Tambahkan tipe kamar pertama Anda agar penginapan ini dapat mulai dipesan oleh calon tamu."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Tipe & Nama Kamar</th>
                <th className="px-4 py-3">Tarif / Malam</th>
                <th className="px-4 py-3">Kapasitas Tamu</th>
                <th className="px-4 py-3">Status Ketersediaan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomTypes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <div className="font-extrabold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-400">ID: {r.id}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-teal-800">Rp {r.price.toLocaleString('id-ID')}</div>
                    {r.originalPrice && r.originalPrice > r.price && (
                      <div className="text-[11px] text-slate-400 line-through">
                        Rp {r.originalPrice.toLocaleString('id-ID')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {r.capacity} Orang
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {r.qty > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Tersedia ({r.qty} unit)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          Kamar Tutup / Habis
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={busyRoomId === r.id}
                        onClick={() => toggleAvailability(r)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition border ${
                          r.qty > 0
                            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        } disabled:opacity-50`}
                      >
                        {busyRoomId === r.id ? '...' : r.qty > 0 ? 'Tutup Penjualan' : 'Buka Kamar'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        type="button"
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                        type="button"
                        onClick={() => setToDelete(r)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah/Edit Kamar */}
      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing.mode === 'edit' ? 'Perbarui Tipe Kamar' : 'Tambah Tipe Kamar Baru'}
        >
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}
            <FormField label="Nama Tipe Kamar">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                placeholder="misal: Deluxe King Bed, Standard Twin"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Harga Jual Per Malam (Rp)">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="0"
                  placeholder="250000"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Harga Coret Asli (Rp, opsional)">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="0"
                  placeholder="300000"
                  value={form.originalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kapasitas Tamu Maksimal">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Jumlah Unit Kamar Tersedia">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                  required
                />
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => setEditing(null)}
              >
                Batal
              </button>
              <button
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                type="submit"
              >
                Simpan Tipe Kamar
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus tipe kamar?"
        message={`Tipe kamar "${toDelete?.name}" akan dihapus dari daftar properti.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
