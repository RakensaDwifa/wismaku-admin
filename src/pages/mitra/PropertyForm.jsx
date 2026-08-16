import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { createProperty, updateProperty, getProperty } from '../../services/property.js'
import FormField from '../../components/FormField.jsx'
import ErrorBanner from '../../components/ErrorBanner.jsx'
import PageLoader from '../../components/PageLoader.jsx'

const EMPTY = {
  name: '',
  city: '',
  area: '',
  address: '',
  img: '',
  desc: '',
  amenities: '',
  status: 'aktif',
}

export default function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let live = true
    ;(async () => {
      const p = await getProperty(id)
      if (!live) return
      if (p) {
        setForm({
          name: p.name || '',
          city: p.city || '',
          area: p.area || '',
          address: p.address || '',
          img: p.img || '',
          desc: p.desc || '',
          amenities: (p.amenities || []).join(', '),
          status: p.status || 'aktif',
        })
      }
      setLoading(false)
    })()
    return () => {
      live = false
    }
  }, [id, isEdit])

  if (loading) return <PageLoader />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        area: form.area.trim() || undefined,
        address: form.address.trim() || undefined,
        img: form.img.trim() || undefined,
        desc: form.desc.trim() || undefined,
        amenities: form.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        status: form.status,
        partnerEmail: user.email,
      }
      if (isEdit) await updateProperty(id, payload)
      else await createProperty(payload)
      navigate('/mitra/properti')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/mitra/properti" className="text-sm font-bold text-rd hover:underline">
        &larr; Kembali ke properti
      </Link>
      <h1 className="text-2xl font-extrabold text-rd-text">{isEdit ? 'Edit Properti' : 'Tambah Properti'}</h1>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-rd-border bg-white p-6 shadow-rd"
      >
        <FormField label="Nama Properti">
          <input
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
            value={form.name}
            onChange={set('name')}
            required
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Kota">
            <input
              className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
              value={form.city}
              onChange={set('city')}
              required
            />
          </FormField>
          <FormField label="Area / Kawasan">
            <input
              className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
              value={form.area}
              onChange={set('area')}
            />
          </FormField>
        </div>
        <FormField label="Alamat">
          <input
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
            value={form.address}
            onChange={set('address')}
          />
        </FormField>
        <FormField label="URL Gambar" hint="Opsional — URL gambar properti (Unsplash, dll).">
          <input
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
            type="url"
            value={form.img}
            onChange={set('img')}
          />
        </FormField>
        <FormField label="Deskripsi">
          <textarea
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
            rows={3}
            value={form.desc}
            onChange={set('desc')}
          />
        </FormField>
        <FormField label="Fasilitas" hint="Pisahkan dengan koma, mis. WiFi Gratis, AC, Sarapan">
          <input
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
            value={form.amenities}
            onChange={set('amenities')}
          />
        </FormField>
        <FormField label="Status">
          <select
            className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm"
            value={form.status}
            onChange={set('status')}
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </FormField>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/mitra/properti')}>
            Batal
          </button>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Properti'}
          </button>
        </div>
      </form>
    </div>
  )
}
