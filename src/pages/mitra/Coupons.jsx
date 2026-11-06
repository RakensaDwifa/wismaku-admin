import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useData } from '../../hooks/useData.js'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/coupon.js'
import StatCard from '../../components/StatCard.jsx'
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

  const activeCount = data.filter((c) => c.status === 'aktif').length
  const inactiveCount = data.filter((c) => c.status === 'nonaktif').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kupon & Promosi Diskon</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tingkatkan okupansi kamar penginapan Anda dengan kode kupon promo potongan harga untuk tamu.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
          type="button"
          onClick={openAdd}
        >
          + Buat Kupon Diskon
        </button>
      </div>

      {/* Grid Metrik Kupon */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Kupon Promo"
          value={data.length}
          hint="Kupon promosi terdaftar"
          badge="Kupon"
        />
        <StatCard
          label="Kupon Promo Aktif"
          value={activeCount}
          hint="Dapat digunakan saat checkout"
          badge="Aktif"
        />
        <StatCard
          label="Kupon Nonaktif"
          value={inactiveCount}
          hint="Kupon yang disetop"
          badge={inactiveCount > 0 ? `${inactiveCount} Arsip` : 'Semua Aktif'}
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Belum ada kupon diskon"
          description="Buat kupon promosi pertama Anda untuk memikat lebih banyak tamu memesan kamar penginapan Anda."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-base font-black tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 inline-block">
                      {c.code}
                    </span>
                    <p className="mt-2 text-xs font-bold text-slate-900">{c.label}</p>
                  </div>
                  <Badge status={c.status}>{c.status}</Badge>
                </div>

                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Potongan Harga:</span>
                    <span className="font-extrabold text-teal-700">Diskon {c.pct}%</span>
                  </div>
                  {c.maxDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Maksimal Diskon:</span>
                      <span className="font-semibold text-slate-700">
                        Rp {Number(c.maxDiscount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-400">Masa Berlaku:</span>
                    <span className="font-semibold text-slate-700">
                      {c.validUntil ? new Date(c.validUntil).toLocaleDateString('id-ID') : 'Tanpa Batas'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  type="button"
                  onClick={() => openEdit(c)}
                >
                  Edit Kupon
                </button>
                <button
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
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

      {/* Modal Tambah/Edit Kupon */}
      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing.mode === 'edit' ? 'Perbarui Kupon Promosi' : 'Buat Kupon Promosi Baru'}
        >
          <form onSubmit={submit} className="space-y-4">
            <ErrorBanner message={error} onDismiss={() => setError('')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kode Kupon Promo">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm uppercase font-bold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  placeholder="HEMAT50"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Label / Keterangan Promo">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  placeholder="Promo Liburan Akhir Pekan"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  required
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Persentase Diskon (%)">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="15"
                  value={form.pct}
                  onChange={(e) => setForm((f) => ({ ...f, pct: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="Maksimal Potongan (Rp)" hint="0 untuk tanpa batasan nominal">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Berlaku Hingga" hint="Kosongkan jika selalu aktif">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                />
              </FormField>
              <FormField label="Status Kupon">
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="aktif">Aktif — Dapat dipakai tamu</option>
                  <option value="nonaktif">Nonaktif — Disetop</option>
                </select>
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
                Simpan Kupon
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus kupon diskon?"
        message={`Kupon "${toDelete?.code}" akan dihapus permanen.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
