import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClients } from '../api/client'
import type { Client } from '../types/crm'
import { CLIENT_SOURCE_LABELS } from '../constants/labels'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/format'
import { useCrmPaths } from '../hooks/useCrmPaths'
import { useAuth } from '../auth/AuthContext'

type ClientScope = 'all' | 'realtor' | 'broker'

export function ClientsPage() {
  const paths = useCrmPaths()
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<ClientScope>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'ADMIN'
  const showScopes = !isAdmin

  const isMyAsRealtor = (client: Client) => {
    if (!user) return false
    if (user.id > 0) return client.assignedUserId === user.id
    return client.assignedUserName === user.fullName
  }

  const isMyAsBroker = (client: Client) => {
    if (!user) return false
    if (user.id > 0) return client.brokerUserId === user.id
    return client.brokerName === user.fullName
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchClients(search)
        if (!cancelled) setClients(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const timer = window.setTimeout(load, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search])

  const asRealtor = clients.filter(isMyAsRealtor)
  const asBroker = clients.filter(isMyAsBroker)

  const visibleClients =
    !showScopes || scope === 'all'
      ? clients
      : scope === 'realtor'
        ? asRealtor
        : asBroker

  const scopes: { id: ClientScope; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: clients.length },
    { id: 'realtor', label: 'Риелтор', count: asRealtor.length },
    { id: 'broker', label: 'Брокер', count: asBroker.length },
  ]

  const emptyMessage =
    scope === 'realtor'
      ? 'Нет клиентов, где вы риелтор'
      : scope === 'broker'
        ? 'Нет клиентов, где вы брокер'
        : 'Клиенты не найдены'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chid-text">Клиенты</h1>
          <p className="mt-1 text-sm text-chid-text/60">База клиентов CHID</p>
        </div>
        <Link
          to={paths.clientsNew}
          className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
        >
          + Новый клиент
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="input max-w-md"
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {showScopes && (
          <div
            className="inline-flex rounded-xl bg-chid-white p-1 shadow-sm ring-1 ring-chid-ring/40"
            role="tablist"
            aria-label="Фильтр по роли"
          >
            {scopes.map((item) => {
              const active = scope === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(item.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-chid-btn text-white shadow-sm'
                      : 'text-chid-text/65 hover:bg-chid-accent-muted hover:text-chid-text'
                  }`}
                >
                  {item.label}
                  <span
                    className={`ml-2 tabular-nums ${
                      active ? 'text-white/80' : 'text-chid-text/40'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-chid-white shadow-sm ring-1 ring-chid-ring/40">
        {loading ? (
          <p className="p-8 text-center text-chid-text/60">Загрузка…</p>
        ) : visibleClients.length === 0 ? (
          <p className="p-8 text-center text-chid-text/60">{emptyMessage}</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-chid-accent-muted text-left text-chid-text/70">
              <tr>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                {scope !== 'realtor' && (
                  <th className="px-4 py-3 font-medium">Риелтор</th>
                )}
                {scope !== 'broker' && (
                  <th className="px-4 py-3 font-medium">Брокер</th>
                )}
                <th className="px-4 py-3 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chid-ring/30">
              {visibleClients.map((client) => (
                <tr key={client.id} className="hover:bg-chid-accent-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      to={paths.client(client.id)}
                      className="font-medium text-chid-btn hover:underline"
                    >
                      {client.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{client.phone}</td>
                  <td className="px-4 py-3">{CLIENT_SOURCE_LABELS[client.source]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  {scope !== 'realtor' && (
                    <td className="px-4 py-3 text-chid-text/70">{client.assignedUserName}</td>
                  )}
                  {scope !== 'broker' && (
                    <td className="px-4 py-3 text-chid-text/70">{client.brokerName ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 text-chid-text/60">{formatDate(client.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
