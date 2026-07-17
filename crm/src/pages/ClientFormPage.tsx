import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createClient, fetchBrokers, fetchClient, fetchRealtors, updateClient } from '../api/client'
import type { ClientRequest, ClientSource, ClientStatus, RealtorUser } from '../types/crm'
import { CLIENT_SOURCE_LABELS, CLIENT_STATUS_LABELS } from '../constants/labels'
import { useAuth } from '../auth/AuthContext'
import { useCrmPaths } from '../hooks/useCrmPaths'

const SOURCES = Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[]
const STATUSES = Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]

const emptyForm: ClientRequest = {
  fullName: '',
  phone: '',
  email: '',
  source: 'CALL',
  status: 'NEW',
  comment: '',
}

export function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const paths = useCrmPaths()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isEdit = Boolean(id)
  const [form, setForm] = useState<ClientRequest>(emptyForm)
  const [realtors, setRealtors] = useState<RealtorUser[]>([])
  const [brokers, setBrokers] = useState<RealtorUser[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBrokers()
      .then(setBrokers)
      .catch(() => {})

    if (!isAdmin) return

    fetchRealtors(true)
      .then((list) => setRealtors(list.filter((r) => r.realtor)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки риелторов'))
  }, [isAdmin])

  useEffect(() => {
    if (!id) return

    fetchClient(Number(id))
      .then((client) => {
        setForm({
          fullName: client.fullName,
          phone: client.phone,
          email: client.email ?? '',
          source: client.source,
          status: client.status,
          comment: client.comment ?? '',
          assignedUserId: client.assignedUserId,
          brokerUserId: client.brokerUserId,
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload: ClientRequest = {
      ...form,
      email: form.email?.trim() || undefined,
      comment: form.comment?.trim() || undefined,
      assignedUserId: isAdmin ? form.assignedUserId : undefined,
      brokerUserId: form.brokerUserId ?? null,
    }

    try {
      if (isEdit && id) {
        await updateClient(Number(id), payload)
        navigate(paths.client(id))
      } else {
        const created = await createClient(payload)
        navigate(paths.client(created.id))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-chid-text/60">Загрузка…</p>
  }

  return (
    <div className="max-w-2xl">
      <Link to={isEdit && id ? paths.client(id) : paths.clients} className="text-sm text-chid-btn hover:underline">
        ← Назад
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-chid-text">
        {isEdit ? 'Редактировать клиента' : 'Новый клиент'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
        <div>
          <label className="mb-2 block text-sm font-medium">ФИО</label>
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Телефон</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="mb-2 block text-sm font-medium">Ответственный риелтор</label>
            <select
              className="input-select"
              value={form.assignedUserId ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  assignedUserId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              required
            >
              <option value="">Выберите риелтора</option>
              {realtors.map((realtor) => (
                <option key={realtor.id} value={realtor.id}>
                  {realtor.fullName}
                  {realtor.phone ? ` · ${realtor.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Брокер клиента</label>
          <select
            className="input-select"
            value={form.brokerUserId ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                brokerUserId: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Без брокера</option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.fullName}
                {broker.phone ? ` · ${broker.phone}` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-chid-text/45">
            Один брокер на клиента — для всех его расчётов
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Источник</label>
            <select
              className="input-select"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value as ClientSource })}
            >
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {CLIENT_SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Статус</label>
            <select
              className="input-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CLIENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Комментарий</label>
          <textarea
            className="input min-h-28 resize-y"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-chid-btn px-6 py-3 font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
