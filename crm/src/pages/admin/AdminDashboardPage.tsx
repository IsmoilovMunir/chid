import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminDashboard } from '../../api/client'
import type { AdminDashboard } from '../../types/crm'

function StatCard({
  label,
  value,
  hint,
  to,
}: {
  label: string
  value: number
  hint: string
  to?: string
}) {
  const content = (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md">
      <p className="text-sm font-medium text-chid-text/55">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-chid-text">{value}</p>
      <p className="mt-2 text-sm text-chid-text/50">{hint}</p>
    </div>
  )

  if (!to) return content

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  )
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminDashboard()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-chid-btn to-[#041a5c] p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-chid-accent">CHID Admin</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight">
          Панель управления агентством
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-white/75">
          Контроль CRM, бренд-настройки и доступ ко всем клиентам и расчётам команды.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/crm/clients"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-chid-btn hover:bg-chid-accent-muted"
          >
            Открыть CRM
          </Link>
          <Link
            to="/admin/settings"
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
          >
            Настройки бренда
          </Link>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-chid-text/60">Загрузка статистики…</p>
      ) : stats ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Клиенты"
            value={stats.clientsCount}
            hint="Все клиенты агентства"
            to="/admin/crm/clients"
          />
          <StatCard
            label="Расчёты"
            value={stats.calculationsCount}
            hint="Сохранённые ипотечные расчёты"
            to="/admin/crm/calculations"
          />
          <StatCard
            label="Заявки с сайта"
            value={stats.leadsCount}
            hint="Лиды с публичного калькулятора"
          />
          <StatCard
            label="Риелторы"
            value={stats.realtorsCount}
            hint="Зарегистрированные агенты"
            to="/admin/realtors"
          />
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h3 className="text-lg font-semibold text-chid-text">Быстрые действия</h3>
          <div className="mt-4 grid gap-3">
            <Link
              to="/admin/realtors"
              className="rounded-xl bg-chid-accent-muted px-4 py-3 text-sm font-medium text-chid-text hover:bg-chid-white"
            >
              Зарегистрировать риелтора
            </Link>
            <Link
              to="/admin/crm/calculations/new"
              className="rounded-xl bg-chid-accent-muted px-4 py-3 text-sm font-medium text-chid-text hover:bg-chid-white"
            >
              Создать расчёт
            </Link>
            <Link
              to="/admin/crm/clients/new"
              className="rounded-xl bg-chid-accent-muted px-4 py-3 text-sm font-medium text-chid-text hover:bg-chid-white"
            >
              Добавить клиента
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
          <h3 className="text-lg font-semibold text-chid-text">Брендбук CHID</h3>
          <ul className="mt-4 space-y-3 text-sm text-chid-text/70">
            <li>
              <span className="font-medium text-chid-text">Основной цвет:</span> #082F9B
            </li>
            <li>
              <span className="font-medium text-chid-text">Акцент:</span> #DFB286
            </li>
            <li>
              <span className="font-medium text-chid-text">Фон:</span> #F8F0E6 / #FFFFFF
            </li>
          </ul>
          <Link
            to="/admin/settings"
            className="mt-5 inline-flex rounded-xl bg-chid-btn px-4 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
          >
            Редактировать контакты
          </Link>
        </div>
      </section>
    </div>
  )
}
