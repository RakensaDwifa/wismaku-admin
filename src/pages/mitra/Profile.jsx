import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { updateUserProfile, changePassword } from '../../services/auth.js'
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
    </div>
  )
}
