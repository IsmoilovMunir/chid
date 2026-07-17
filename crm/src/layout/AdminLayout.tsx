import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChidLogo } from '../components/ChidLogo'
import { useAuth } from '../auth/AuthContext'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-white/12 text-white ring-1 ring-chid-accent/50'
      : 'text-white/70 hover:bg-white/8 hover:text-white'
  }`

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-4 text-xs font-semibold uppercase tracking-wider text-white/35">{title}</p>
      {children}
    </div>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const pageTitle = (() => {
    if (location.pathname === '/admin') return 'Обзор'
    if (location.pathname.startsWith('/admin/realtors')) return 'Риелторы'
    if (location.pathname.startsWith('/admin/settings')) return 'Настройки'
    if (location.pathname.includes('/clients')) return 'Клиенты'
    if (location.pathname.includes('/calculations')) return 'Расчёты'
    return 'Админ-панель'
  })()

  return (
    <div className="min-h-screen bg-[#f4f6fb] lg:flex">
      <aside className="flex w-full flex-col bg-[#020731] text-white lg:fixed lg:inset-y-0 lg:w-72">
        <div className="border-b border-white/10 px-6 py-6">
          <ChidLogo className="h-10 w-auto brightness-0 invert" />
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-chid-accent">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
          <NavGroup title="Управление">
            <NavLink to="/admin" end className={navItemClass}>
              <span aria-hidden>◆</span>
              Обзор
            </NavLink>
            <NavLink to="/admin/realtors" className={navItemClass}>
              <span aria-hidden>☻</span>
              Риелторы
            </NavLink>
            <NavLink to="/admin/settings" className={navItemClass}>
              <span aria-hidden>◇</span>
              Настройки бренда
            </NavLink>
          </NavGroup>

          <NavGroup title="CRM">
            <NavLink to="/admin/crm/clients" className={navItemClass}>
              <span aria-hidden>◎</span>
              Клиенты
            </NavLink>
            <NavLink to="/admin/crm/calculations" className={navItemClass}>
              <span aria-hidden>▣</span>
              Расчёты
            </NavLink>
            <NavLink to="/admin/crm/calculations/new" className={navItemClass}>
              <span aria-hidden>＋</span>
              Новый расчёт
            </NavLink>
          </NavGroup>
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <p className="text-xs text-white/50">Администратор</p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl bg-white/8 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/12"
          >
            Выйти
          </button>
        </div>
      </aside>

      <div className="min-h-screen flex-1 lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-5 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chid-btn/70">
                CHID CRM
              </p>
              <h1 className="mt-1 text-2xl font-bold text-chid-text">{pageTitle}</h1>
            </div>
            <div className="hidden rounded-2xl bg-chid-accent-muted px-4 py-2 text-sm text-chid-text/70 sm:block">
              Бренд: <span className="font-medium text-chid-text">#082F9B</span> ·{' '}
              <span className="font-medium text-chid-accent">#DFB286</span>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
