import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { roleLabels } from '../roles/permissions.js'

const NAV = {
  member: [
    { to: '/member', label: 'Dashboard', end: true },
    { to: '/member/pesanan', label: 'Pesanan Saya' },
  ],
  mitra: [
    { to: '/mitra', label: 'Dashboard', end: true },
    { to: '/mitra/properti', label: 'Properti' },
    { to: '/mitra/pesanan', label: 'Pesanan' },
    { to: '/mitra/kupon', label: 'Kupon' },
  ],
  staff: [
    { to: '/staff', label: 'Dashboard', end: true },
    { to: '/staff/mitra', label: 'Verifikasi Mitra' },
    { to: '/staff/properti', label: 'Moderasi Properti' },
    { to: '/staff/ulasan', label: 'Ulasan' },
    { to: '/staff/pesanan', label: 'Pesanan' },
  ],
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const items = NAV[user.role] || []
  const label = roleLabels[user.role] || user.role

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-rd-soft">
      <header className="border-b border-rd-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-extrabold text-rd">
            <span className="grid size-9 place-items-center rounded-xl bg-rd text-white">W</span>
            WismaKu <span className="font-medium text-rd-muted">Admin</span>
          </NavLink>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-rd-text">{user.name}</div>
              <div className="text-xs font-medium text-rd">{label}</div>
            </div>
            <button className="btn btn-outline btn-sm" type="button" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <nav className="md:w-56 md:shrink-0" aria-label="Navigasi utama">
          <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-rd md:flex-col">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                    isActive ? 'bg-rd text-white' : 'text-rd-text hover:bg-rd-teal-bg'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
