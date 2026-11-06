import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import FormField from '../../components/FormField.jsx'
import ErrorBanner from '../../components/ErrorBanner.jsx'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('masuk') // 'masuk' | 'daftar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const doLogin = async (e, creds) => {
    if (e) e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(creds?.email || email, creds?.password || password)
      if (u.role !== 'mitra') {
        setError('Akun ini bukan akun Mitra. Portal ini khusus untuk pemilik penginapan.')
        return
      }
      navigate('/mitra', { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password.')
    } finally {
      setBusy(false)
    }
  }

  const doRegister = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register({ name, email, password, role: 'mitra' })
      navigate('/mitra', { replace: true })
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-teal-700 text-2xl font-black text-white shadow-md">
            W
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">WismaKu Mitra Extranet</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Portal Pengelolaan Kamar, Payouts & Reservasi Penginapan
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('masuk')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'masuk' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk Mitra
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('daftar')
                setError('')
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'daftar' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Mitra Baru
            </button>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          {mode === 'masuk' ? (
            <form onSubmit={doLogin} className="mt-4 space-y-4">
              <FormField label="Email Mitra">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitra@wismaku.com"
                  required
                />
              </FormField>
              <FormField label="Password">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>
              <button
                className="w-full rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Memproses...' : 'Masuk ke Portal Mitra'}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister} className="mt-4 space-y-4">
              <FormField label="Nama Pemilik / Pengelola">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama pengelola"
                  required
                />
              </FormField>
              <FormField label="Email Mitra">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitra@domain.com"
                  required
                />
              </FormField>
              <FormField label="Password">
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </FormField>
              <button
                className="w-full rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Memproses...' : 'Daftar Sebagai Mitra'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Akses Cepat Demo Mitra
          </p>
          <button
            type="button"
            className="w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100"
            onClick={() => doLogin(null, { email: 'mitra@wismaku.com', password: 'password123' })}
          >
            Masuk sebagai Demo Mitra (mitra@wismaku.com)
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            Kredensial aktif:{' '}
            <code className="font-mono text-teal-700 font-bold">mitra@wismaku.com / password123</code>
          </p>
        </div>
      </div>
    </div>
  )
}
