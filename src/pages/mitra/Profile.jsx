import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { updateUserProfile, changePassword } from '../../services/auth.js'
import { getPartnerKyc, submitPartnerKyc } from '../../services/partner.js'
import { uploadPartnerDocument } from '../../services/storageUpload.js'
import FormField from '../../components/FormField.jsx'
import ErrorBanner from '../../components/ErrorBanner.jsx'

export default function ProfilePage() {
  const { user } = useAuth()

  // State profil
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  // State ganti password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passSaving, setPassSaving] = useState(false)
  const [passMessage, setPassMessage] = useState('')
  const [passError, setPassError] = useState('')

  // State KYC Legalitas
  const [kycData, setKycData] = useState(null)
  const [idCardNumber, setIdCardNumber] = useState('')
  const [nibOrNpwp, setNibOrNpwp] = useState('')
  const [idCardUrl, setIdCardUrl] = useState('')
  const [businessDocUrl, setBusinessDocUrl] = useState('')
  const [kycSaving, setKycSaving] = useState(false)
  const [uploadingKtp, setUploadingKtp] = useState(false)
  const [uploadingNib, setUploadingNib] = useState(false)
  const [kycMessage, setKycMessage] = useState('')
  const [kycError, setKycError] = useState('')

  useEffect(() => {
    if (!user?.email) return
    let active = true
    getPartnerKyc(user.email)
      .then((data) => {
        if (!active || !data) return
        setKycData(data)
        setIdCardNumber(data.idCardNumber || '')
        setNibOrNpwp(data.nibOrNpwp || '')
        setIdCardUrl(data.idCardUrl || '')
        setBusinessDocUrl(data.businessDocUrl || '')
      })
      .catch((err) => console.warn('[ProfilePage] KYC load error:', err))
    return () => {
      active = false
    }
  }, [user?.email])

  const handleUploadKtp = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingKtp(true)
    setKycError('')
    try {
      const { publicUrl } = await uploadPartnerDocument(file, { folder: 'ktp' })
      setIdCardUrl(publicUrl)
    } catch (err) {
      setKycError(err.message)
    } finally {
      setUploadingKtp(false)
    }
  }

  const handleUploadNib = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingNib(true)
    setKycError('')
    try {
      const { publicUrl } = await uploadPartnerDocument(file, { folder: 'nib' })
      setBusinessDocUrl(publicUrl)
    } catch (err) {
      setKycError(err.message)
    } finally {
      setUploadingNib(false)
    }
  }

  const handleKycSubmit = async (e) => {
    e.preventDefault()
    setKycSaving(true)
    setKycMessage('')
    setKycError('')
    try {
      const updated = await submitPartnerKyc({
        id: kycData?.id,
        email: user?.email,
        idCardNumber: idCardNumber.trim(),
        nibOrNpwp: nibOrNpwp.trim(),
        idCardUrl: idCardUrl.trim(),
        businessDocUrl: businessDocUrl.trim(),
      })
      setKycData(updated)
      setKycMessage('Dokumen legalitas KYC berhasil diajukan untuk peninjauan HQ.')
      setTimeout(() => setKycMessage(''), 5000)
    } catch (err) {
      setKycError(err.message || 'Gagal mengajukan verifikasi KYC.')
    } finally {
      setKycSaving(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    setProfileError('')
    try {
      await updateUserProfile({ name, phone })
      setProfileMessage('Profil pengelola berhasil diperbarui.')
      setTimeout(() => setProfileMessage(''), 4000)
    } catch (err) {
      setProfileError(err.message || 'Gagal menyimpan profil.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPassSaving(true)
    setPassMessage('')
    setPassError('')

    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi password tidak cocok dengan password baru.')
      setPassSaving(false)
      return
    }

    try {
      await changePassword(newPassword)
      setPassMessage('Kata sandi berhasil diperbarui.')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassMessage(''), 4000)
    } catch (err) {
      setPassError(err.message || 'Gagal memperbarui kata sandi.')
    } finally {
      setPassSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Profil Akun & Keamanan Mitra</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi identitas pengelola penginapan, kontak darurat, dan pembaruan kata sandi akun
          portal.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulir Profil */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">Informasi Pengelola</h2>
            <p className="text-xs text-slate-400">Data pemilik atau manajer operasional properti.</p>
          </div>

          <ErrorBanner message={profileError} onDismiss={() => setProfileError('')} />

          {profileMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {profileMessage}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <FormField label="Email Akun Mitra" hint="Email digunakan untuk autentikasi dan notifikasi">
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
              />
            </FormField>

            <FormField label="Nama Pengelola / Pemilik">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Hj. Sukma Ayu"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>

            <FormField
              label="Nomor WhatsApp Pengelola"
              hint="Nomor kontak darurat koordinasi dengan WismaKu HQ"
            >
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="misal: 08123456789"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Peran Akun:</span>
                <span className="font-bold text-teal-800 uppercase">Mitra Penginapan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hak Akses:</span>
                <span className="font-semibold text-slate-700">Penuh (Extranet Portal)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              {profileSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </button>
          </form>
        </div>

        {/* Formulir Ganti Kata Sandi */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">Perbarui Kata Sandi</h2>
            <p className="text-xs text-slate-400">
              Gunakan kombinasi kata sandi yang aman dan tidak mudah ditebak.
            </p>
          </div>

          <ErrorBanner message={passError} onDismiss={() => setPassError('')} />

          {passMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              {passMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormField label="Kata Sandi Baru" hint="Minimal 6 karakter">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>

            <FormField label="Konfirmasi Kata Sandi Baru">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Panduan Keamanan:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Jangan bagikan kata sandi kepada pihak selain staf front desk Anda.</li>
                <li>Setelah kata sandi diubah, sesi login Anda saat ini akan tetap aktif.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={passSaving}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {passSaving ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
            </button>
          </form>
        </div>
      </div>

      {/* Seksi Verifikasi Legalitas & KYC Mitra */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Verifikasi Legalitas & Kemitraan (KYC)</h2>
            <p className="text-xs text-slate-400">
              Persyaratan kepatuhan operasional penginapan sesuai regulasi pariwisata nasional.
            </p>
          </div>
          <div>
            {kycData?.kycStatus === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Terverifikasi Resmi HQ
              </span>
            ) : kycData?.kycStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                Menunggu Tinjauan Tim HQ
              </span>
            ) : kycData?.kycStatus === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                Ditolak / Butuh Revisi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Belum Dilengkapi
              </span>
            )}
          </div>
        </div>

        <ErrorBanner message={kycError} onDismiss={() => setKycError('')} />

        {kycData?.kycStatus === 'rejected' && kycData?.rejectionReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 space-y-1">
            <p className="font-extrabold">Catatan Penolakan dari HQ:</p>
            <p>{kycData.rejectionReason}</p>
            <p className="text-[11px] text-red-600 font-semibold pt-1">
              Silakan perbaiki data atau unggah ulang dokumen yang lebih jelas di bawah ini.
            </p>
          </div>
        )}

        {kycMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
            {kycMessage}
          </div>
        )}

        <form onSubmit={handleKycSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Nomor Induk Kependudukan (NIK / KTP)"
              hint="16 digit sesuai identitas pemilik/manajer"
            >
              <input
                type="text"
                required
                maxLength={16}
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                placeholder="misal: 3171012345670001"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>

            <FormField
              label="Nomor NIB atau NPWP Badan Usaha"
              hint="Nomor Izin Berusaha atau NPWP operasional"
            >
              <input
                type="text"
                required
                value={nibOrNpwp}
                onChange={(e) => setNibOrNpwp(e.target.value)}
                placeholder="misal: 9120001234567 atau 01.234.567.8-012.000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Dokumen KTP Pemilik / Manajer"
              hint="Format JPG/PNG/PDF (maks 5MB). Pastikan teks terbaca jelas."
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="URL Berkas KTP..."
                    value={idCardUrl}
                    onChange={(e) => setIdCardUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  />
                  <label className="relative inline-flex items-center justify-center rounded-lg border border-teal-700 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100 cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={handleUploadKtp}
                      disabled={uploadingKtp}
                    />
                    {uploadingKtp ? 'Mengunggah...' : 'Unggah KTP'}
                  </label>
                </div>
                {idCardUrl && (
                  <p className="text-[11px] text-teal-700 font-semibold truncate">
                    Tersimpan:{' '}
                    <a href={idCardUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      {idCardUrl}
                    </a>
                  </p>
                )}
              </div>
            </FormField>

            <FormField label="Dokumen NIB / NPWP / Surat Izin Usaha" hint="Format JPG/PNG/PDF (maks 5MB).">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="URL Berkas NIB/NPWP..."
                    value={businessDocUrl}
                    onChange={(e) => setBusinessDocUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  />
                  <label className="relative inline-flex items-center justify-center rounded-lg border border-teal-700 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100 cursor-pointer shrink-0">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={handleUploadNib}
                      disabled={uploadingNib}
                    />
                    {uploadingNib ? 'Mengunggah...' : 'Unggah NIB'}
                  </label>
                </div>
                {businessDocUrl && (
                  <p className="text-[11px] text-teal-700 font-semibold truncate">
                    Tersimpan:{' '}
                    <a href={businessDocUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      {businessDocUrl}
                    </a>
                  </p>
                )}
              </div>
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={kycSaving || uploadingKtp || uploadingNib}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              {kycSaving ? 'Menyimpan...' : 'Ajukan / Perbarui Verifikasi KYC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
