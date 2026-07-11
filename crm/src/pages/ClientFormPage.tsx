import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createClient, fetchClient, updateClient } from '../api/client'
import type { ClientRequest, ClientSource, ClientStatus } from '../types/crm'
import { CLIENT_SOURCE_LABELS, CLIENT_STATUS_LABELS } from '../constants/labels'

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
  const isEdit = Boolean(id)
  const [form, setForm] = useState<ClientRequest>(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
    }

    try {
      if (isEdit && id) {
        await updateClient(Number(id), payload)
        navigate(`/clients/${id}`)
      } else {
        const created = await createClient(payload)
        navigate(`/clients/${created.id}`)
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
      <Link to={isEdit ? `/clients/${id}` : '/clients'} className="text-sm text-chid-btn hover:underline">
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
