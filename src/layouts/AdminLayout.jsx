import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { supabase } from '../lib/supabase.js'
import { notify } from '../services/storage.js'
import { DATA_EVENT } from '../services/auth.js'
import Badge from '../components/Badge.jsx'

const OPERASIONAL_NAV = [
  { to: '/mitra', label: 'Dashboard Ringkasan', end: true },
  { to: '/mitra/kalender', label: 'Kalender Okupansi' },
  { to: '/mitra/properti', label: 'Properti Saya' },
  { to: '/mitra/pesanan', label: 'Pesanan & Resepsionis' },
]

const KEUANGAN_NAV = [
  { to: '/mitra/keuangan', label: 'Keuangan & Payouts' },
  { to: '/mitra/kupon', label: 'Kupon Diskon' },
  { to: '/mitra/ulasan', label: 'Ulasan & Kepuasan' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!supabase || !user?.email) return

    let active = true
    let channel = null

    async function subscribeRealtime() {
      try {
        const { data: hotels } = await supabase
          .from('hotels')
          .select('id, name')
          .eq('partner_email', String(user.email).trim().toLowerCase())

        if (!active) return
        const hotelIds = new Set((hotels ?? []).map((h) => String(h.id)))
        const hotelNameMap = new Map((hotels ?? []).map((h) => [String(h.id), h.name]))

        channel = supabase
          .channel(`wismaku-mitra-${user.id || 'live'}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
            const hId = String(payload.new?.hotel_id || payload.old?.hotel_id || '')
            if (hotelIds.size === 0 || hotelIds.has(hId)) {
              notify(DATA_EVENT)
              const hotelName = hotelNameMap.get(hId) || 'Properti Anda'
              if (payload.eventType === 'INSERT') {
                setToast(
                  `Pesanan Baru (${hotelName}): ${payload.new?.guest_name || 'Tamu'} (#${String(payload.new?.id).slice(0, 8)})`,
                )
              } else if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
                setToast(
                  `Status Pesanan #${String(payload.new?.id).slice(0, 8)} berubah: ${payload.new?.status}`,
                )
              }
            }
          })
          .subscribe()
      } catch (err) {
        console.warn('[AdminLayout] Realtime subscription warning:', err)
      }
    }

    subscribeRealtime()

    return () => {
      active = false
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.email, user?.id])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Nav */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="grid size-9 place-items-center rounded-xl bg-teal-700 font-extrabold text-white">
            W
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
              WismaKu <span className="text-teal-700">Mitra</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-400">Extranet Portal</div>
          </div>
        </div>

        <div className="flex flex-col justify-between p-4" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="space-y-6 overflow-y-auto">
            {/* Operasional */}
            <div>
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Operasional Harian
              </div>
              <nav className="mt-2 space-y-1" aria-label="Navigasi operasional mitra">
                {OPERASIONAL_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-extrabold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Keuangan & Reputasi */}
            <div>
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Keuangan & Reputasi
              </div>
              <nav className="mt-2 space-y-1" aria-label="Navigasi keuangan dan reputasi mitra">
                {KEUANGAN_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-extrabold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* User info & Logout */}
          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 px-2">
              <div className="truncate text-xs font-bold text-slate-900">{user.name}</div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="truncate text-[11px] text-slate-500">{user.email}</span>
                <Badge status={user.role || 'mitra'}>Mitra</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <NavLink
                to="/mitra/profil"
                className={({ isActive }) =>
                  `block text-center rounded-lg border border-slate-200 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border-teal-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                Pengaturan Akun
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="text-sm font-semibold text-slate-600">
            Portal Operasional & Tata Kelola Mitra WismaKu
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Terhubung ke Database Live
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Live Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-teal-200 bg-white px-4 py-3 shadow-2xl text-xs font-bold text-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
          </span>
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
