import { NavLink, Outlet } from 'react-router-dom'
import { ChidLogo } from '../components/ChidLogo'
import { useAuth } from '../auth/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-chid-btn text-white'
      : 'text-chid-text/80 hover:bg-chid-white hover:text-chid-btn'
  }`

export function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-chid-ring/50 bg-chid-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <ChidLogo className="h-10 w-auto" />
            <nav className="flex gap-1">
              <NavLink to="/clients" className={navLinkClass}>
                Клиенты
              </NavLink>
              <NavLink to="/calculations" className={navLinkClass}>
                Расчёты
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-chid-text">{user?.fullName}</p>
              <p className="text-chid-text/60">{user?.role === 'ADMIN' ? 'Администратор' : 'Риелтор'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-4 py-2 text-sm font-medium text-chid-text ring-1 ring-chid-ring/60 hover:bg-chid-accent-muted"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
