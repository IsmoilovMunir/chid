import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClients } from '../api/client'
import type { Client } from '../types/crm'
import { CLIENT_SOURCE_LABELS } from '../constants/labels'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate } from '../utils/format'

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chid-text">Клиенты</h1>
          <p className="mt-1 text-sm text-chid-text/60">База клиентов CHID</p>
        </div>
        <Link
          to="/clients/new"
          className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
        >
          + Новый клиент
        </Link>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-md"
          placeholder="Поиск по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-chid-white shadow-sm ring-1 ring-chid-ring/40">
        {loading ? (
          <p className="p-8 text-center text-chid-text/60">Загрузка…</p>
        ) : clients.length === 0 ? (
          <p className="p-8 text-center text-chid-text/60">Клиенты не найдены</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-chid-accent-muted text-left text-chid-text/70">
              <tr>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Риелтор</th>
                <th className="px-4 py-3 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chid-ring/30">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-chid-accent-muted/40">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${client.id}`} className="font-medium text-chid-btn hover:underline">
                      {client.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{client.phone}</td>
                  <td className="px-4 py-3">{CLIENT_SOURCE_LABELS[client.source]}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-chid-text/70">{client.assignedUserName}</td>
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
