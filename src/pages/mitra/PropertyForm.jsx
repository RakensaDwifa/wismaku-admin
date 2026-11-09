import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { createProperty, updateProperty, getProperty } from '../../services/property.js'
import { uploadHotelMedia } from '../../services/storageUpload.js'
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
  receptionPhone: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
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
  const [uploading, setUploading] = useState(false)

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
          receptionPhone: p.receptionPhone || '',
          checkInTime: p.checkInTime || '14:00',
          checkOutTime: p.checkOutTime || '12:00',
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { publicUrl } = await uploadHotelMedia(file, { folder: 'hotels' })
      setForm((f) => ({ ...f, img: publicUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

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
        receptionPhone: form.receptionPhone.trim() || undefined,
        checkInTime: form.checkInTime.trim() || '14:00',
        checkOutTime: form.checkOutTime.trim() || '12:00',
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/mitra/properti"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 transition"
        >
          &larr; Kembali ke Daftar Properti
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {isEdit ? 'Perbarui Informasi Penginapan' : 'Daftarkan Penginapan Baru'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi data profil properti, informasi operasional resepsionis, dan waktu check-in/out tamu.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Seksi Informasi Utama */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">1. Identitas & Lokasi Penginapan</h2>
            <p className="text-xs text-slate-400">Nama hotel/wisma dan alamat lengkap untuk panduan tamu.</p>
          </div>

          <FormField label="Nama Penginapan / Hotel">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              placeholder="misal: Wisma Syariah Kelapa Gading"
              value={form.name}
              onChange={set('name')}
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kota">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                placeholder="misal: Jakarta"
                value={form.city}
                onChange={set('city')}
                required
              />
            </FormField>
            <FormField label="Area / Kawasan Sekitar">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                placeholder="misal: Dekat Mall Kelapa Gading"
                value={form.area}
                onChange={set('area')}
              />
            </FormField>
          </div>

          <FormField label="Alamat Lengkap">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              placeholder="Nama jalan, nomor bangunan, RT/RW, kelurahan..."
              value={form.address}
              onChange={set('address')}
            />
          </FormField>

          <FormField
            label="Foto Utama Penginapan"
            hint="Unggah langsung dari perangkat Anda (JPG/PNG/WEBP maks 5MB) atau tempel URL gambar."
          >
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono text-xs text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={form.img}
                  onChange={set('img')}
                />
                <label className="relative inline-flex items-center justify-center rounded-lg border border-teal-700 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100 cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                </label>
              </div>

              {form.img && (
                <div className="relative inline-block overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src={form.img}
                    alt="Pratinjau Foto Penginapan"
                    className="h-32 w-48 object-cover bg-slate-100"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Deskripsi Penginapan">
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              rows={3}
              placeholder="Ceritakan keunggulan penginapan, suasana, dan aksesibilitas untuk tamu..."
              value={form.desc}
              onChange={set('desc')}
            />
          </FormField>

          <FormField
            label="Fasilitas Unggulan"
            hint="Pisahkan dengan tanda koma (misal: WiFi Cepat, AC Dingin, Parkir Luas, Sarapan)"
          >
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              placeholder="WiFi Cepat, AC, Smart TV, Parkir Mobil"
              value={form.amenities}
              onChange={set('amenities')}
            />
          </FormField>
        </div>

        {/* Seksi Operasional Resepsionis */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">
              2. Kontak & Kebijakan Operasional Front Desk
            </h2>
            <p className="text-xs text-slate-400">
              Kontak WhatsApp dan jadwal resepsionis untuk koordinasi tamu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="WhatsApp Resepsionis" hint="Nomor aktif front desk">
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                placeholder="08123456789"
                value={form.receptionPhone}
                onChange={set('receptionPhone')}
              />
            </FormField>

            <FormField label="Waktu Check-In Standar">
              <input
                type="time"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                value={form.checkInTime}
                onChange={set('checkInTime')}
              />
            </FormField>

            <FormField label="Waktu Check-Out Standar">
              <input
                type="time"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
                value={form.checkOutTime}
                onChange={set('checkOutTime')}
              />
            </FormField>
          </div>

          <FormField label="Status Penayangan Properti">
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
              value={form.status}
              onChange={set('status')}
            >
              <option value="aktif">Aktif — Tampil di pencarian & dapat dipesan tamu</option>
              <option value="nonaktif">Nonaktif — Disembunyikan sementara</option>
            </select>
          </FormField>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => navigate('/mitra/properti')}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Daftarkan Properti'}
          </button>
        </div>
      </form>
    </div>
  )
}
