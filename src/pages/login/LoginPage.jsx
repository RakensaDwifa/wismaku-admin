import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, registerUser } from '../../services/auth.js'
import ErrorBanner from '../../components/ErrorBanner.jsx'
import FormField from '../../components/FormField.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const goHome = () => {
    navigate('/mitra', { replace: true })
  }

  const doLogin = async (e, cred) => {
    if (e) e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(cred?.email ?? email, cred?.password ?? password)
      goHome()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doRegister = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await registerUser({ name, email, password, role: 'mitra' })
      goHome()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-rd-soft px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-rd text-2xl font-extrabold text-white shadow-rd-lg">
            W
          </div>
          <h1 className="text-2xl font-extrabold text-rd-text">WismaKu Mitra Extranet</h1>
          <p className="mt-1 text-sm text-rd-muted">Portal Pengelolaan Kamar & Reservasi Properti</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-rd">
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('masuk')
                setError('')
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === 'masuk' ? 'bg-rd text-white' : 'bg-rd-soft text-rd-muted'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('daftar')
                setError('')
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === 'daftar' ? 'bg-rd text-white' : 'bg-rd-soft text-rd-muted'
              }`}
            >
              Daftar Mitra
            </button>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          {mode === 'masuk' ? (
            <form onSubmit={doLogin} className="mt-4 space-y-4">
              <FormField label="Email Mitra">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitra@wismaku.com"
                  required
                />
              </FormField>
              <FormField label="Password">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? 'Memproses...' : 'Masuk ke Portal Mitra'}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister} className="mt-4 space-y-4">
              <FormField label="Nama Pemilik / Pengelola">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama pengelola"
                  required
                />
              </FormField>
              <FormField label="Email Mitra">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitra@domain.com"
                  required
                />
              </FormField>
              <FormField label="Password">
                <input
                  className="w-full rounded-lg border border-rd-border px-3 py-2.5 text-sm focus:border-rd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </FormField>
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? 'Memproses...' : 'Daftar Sebagai Mitra'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-rd">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-rd-muted">
            Akses Cepat Demo Mitra
          </p>
          <button
            type="button"
            className="w-full rounded-lg bg-rd-teal-bg px-3 py-2.5 text-sm font-bold text-rd-dark transition-colors hover:bg-rd-teal hover:text-white"
            onClick={() => doLogin(null, { email: 'mitra@wismaku.com', password: 'password123' })}
          >
            Masuk sebagai Demo Mitra (mitra@wismaku.com)
          </button>
          <p className="mt-3 text-center text-xs text-rd-muted">
            Password demo: <code className="font-mono">password123</code>
          </p>
        </div>
      </div>
    </div>
  )
}
