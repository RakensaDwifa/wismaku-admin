import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../../hooks/useData.js'
import { getProperty, addRoomType, updateRoomType, deleteRoomType } from '../../services/property.js'
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

  const confirmDelete = async () => {
    await deleteRoomType(id, toDelete.id)
    setToDelete(null)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/mitra/properti" className="text-sm font-bold text-rd hover:underline">
            &larr; Properti
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-rd-text">Tipe Kamar — {property.name}</h1>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={openAdd}>
          + Tambah Tipe Kamar
        </button>
      </div>

      {property.roomTypes.length === 0 ? (
        <EmptyState title="Belum ada tipe kamar" desc="Tambahkan tipe kamar untuk properti ini." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rd-border bg-white shadow-rd">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rd-border bg-rd-soft text-xs uppercase tracking-wide text-rd-muted">
                <th className="px-4 py-3 font-bold">Tipe</th>
                <th className="px-4 py-3 font-bold">Harga</th>
                <th className="px-4 py-3 font-bold">Kapasitas</th>
                <th className="px-4 py-3 font-bold">Jumlah</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {property.roomTypes.map((r) => (
                <tr key={r.id} className="border-b border-rd-border last:border-0">
                  <td className="px-4 py-3 font-bold text-rd-text">{r.name}</td>
                  <td className="px-4 py-3">
                    Rp {r.price.toLocaleString('id-ID')}
                    {r.originalPrice ? (
                      <span className="ml-2 text-xs text-rd-muted line-through">
                        Rp {r.originalPrice.toLocaleString('id-ID')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{r.capacity} orang</td>
                  <td className="px-4 py-3">{r.qty} kamar</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-outline btn-sm mr-2" type="button" onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-outline btn-sm text-red-600"
                      type="button"
                      onClick={() => setToDelete(r)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing.mode === 'edit' ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
        >
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <FormField label="Nama Tipe">
              <input
                className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Harga (Rp)">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Harga Asli (Rp, opsional)">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kapasitas">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Jumlah Kamar">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="0"
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                  required
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button className="btn btn-primary btn-sm" type="submit">
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus tipe kamar?"
        message={`Tipe kamar "${toDelete?.name}" akan dihapus.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
