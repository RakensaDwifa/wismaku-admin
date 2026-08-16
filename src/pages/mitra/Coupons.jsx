import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/coupon.js'
import Modal from '../../components/Modal.jsx'
import FormField from '../../components/FormField.jsx'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PageLoader from '../../components/PageLoader.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ErrorBanner from '../../components/ErrorBanner.jsx'

const EMPTY = { code: '', label: '', pct: '10', maxDiscount: '0', validUntil: '', status: 'aktif' }

export default function CouponsPage() {
  const { user } = useAuth()
  const { data, refresh } = useData(() => getCoupons({ partnerEmail: user?.email }), [user?.email])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)

  if (!data) return <PageLoader />

  const openAdd = () => {
    setForm(EMPTY)
    setEditing({ mode: 'add' })
    setError('')
  }

  const openEdit = (c) => {
    setForm({
      code: c.code,
      label: c.label,
      pct: String(c.pct),
      maxDiscount: String(c.maxDiscount ?? 0),
      validUntil: c.validUntil || '',
      status: c.status,
    })
    setEditing({ mode: 'edit', coupon: c })
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        code: form.code.trim(),
        label: form.label.trim(),
        pct: Number(form.pct),
        maxDiscount: Number(form.maxDiscount || 0),
        validUntil: form.validUntil || null,
        status: form.status,
        partnerEmail: user.email,
      }
      if (editing.mode === 'edit') await updateCoupon(editing.coupon.id, payload)
      else await createCoupon(payload)
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmDelete = async () => {
    await deleteCoupon(toDelete.id)
    setToDelete(null)
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-rd-text">Kupon Saya</h1>
        <button className="btn btn-primary btn-sm" type="button" onClick={openAdd}>
          + Tambah Kupon
        </button>
      </div>

      {data.length === 0 ? (
        <EmptyState title="Belum ada kupon" desc="Buat kupon untuk menarik tamu." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className="rounded-xl border border-rd-border bg-white p-5 shadow-rd">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-extrabold text-rd">{c.code}</p>
                  <p className="mt-0.5 text-sm text-rd-muted">{c.label}</p>
                </div>
                <Badge status={c.status}>{c.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-rd-text">
                Diskon <b>{c.pct}%</b>
                {c.maxDiscount > 0 ? ` · maks Rp ${c.maxDiscount.toLocaleString('id-ID')}` : ''}
              </p>
              <p className="mt-1 text-xs text-rd-muted">
                Berlaku hingga{' '}
                {c.validUntil ? new Date(c.validUntil).toLocaleDateString('id-ID') : 'selamanya'}
              </p>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-outline btn-sm" type="button" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-sm text-red-600"
                  type="button"
                  onClick={() => setToDelete(c)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing.mode === 'edit' ? 'Edit Kupon' : 'Tambah Kupon'}
        >
          <form onSubmit={submit} className="space-y-4">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kode">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm uppercase focus:border-rd"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Label">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  required
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Diskon (%)">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="1"
                  max="100"
                  value={form.pct}
                  onChange={(e) => setForm((f) => ({ ...f, pct: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Maksimal Diskon (Rp)">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Berlaku Hingga" hint="Kosongkan untuk tanpa batas">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                />
              </FormField>
              <FormField label="Status">
                <select
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
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
        title="Hapus kupon?"
        message={`Kupon "${toDelete?.code}" akan dihapus.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
