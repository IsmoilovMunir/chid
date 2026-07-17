import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchBrokers,
  fetchClient,
  fetchClientCalculations,
  fetchRealtors,
  updateClient,
} from '../api/client'
import type {
  CalculationSummary,
  Client,
  ClientSource,
  ClientStatus,
  RealtorUser,
} from '../types/crm'
import {
  CALCULATION_MODE_LABELS,
  CLIENT_SOURCE_LABELS,
  CLIENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from '../constants/labels'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, formatMoney, formatTermMonths } from '../utils/format'
import { getPublicCalculationUrl } from '../utils/publicLink'
import { useAuth } from '../auth/AuthContext'
import { useCrmPaths } from '../hooks/useCrmPaths'

const SOURCES = Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[]
const STATUSES = Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-chid-text/45">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-chid-text">{children}</div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-chid-accent-muted/60 px-4 py-3 ring-1 ring-chid-ring/30">
      <p className="text-xs text-chid-text/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-chid-text">{value}</p>
    </div>
  )
}

export function ClientDetailPage() {
  const { id } = useParams()
  const paths = useCrmPaths()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [client, setClient] = useState<Client | null>(null)
  const [calculations, setCalculations] = useState<CalculationSummary[]>([])
  const [realtors, setRealtors] = useState<RealtorUser[]>([])
  const [brokersList, setBrokersList] = useState<RealtorUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingWork, setEditingWork] = useState(false)
  const [source, setSource] = useState<ClientSource>('CALL')
  const [status, setStatus] = useState<ClientStatus>('NEW')
  const [assignedUserId, setAssignedUserId] = useState<number | ''>('')
  const [brokerUserId, setBrokerUserId] = useState<number | ''>('')
  const [workSaving, setWorkSaving] = useState(false)
  const [workError, setWorkError] = useState('')
  const [workSuccess, setWorkSuccess] = useState('')

  useEffect(() => {
    if (!id) return

    const clientId = Number(id)
    Promise.all([fetchClient(clientId), fetchClientCalculations(clientId)])
      .then(([clientData, calcData]) => {
        setClient(clientData)
        setCalculations(calcData)
        setSource(clientData.source)
        setStatus(clientData.status)
        setAssignedUserId(clientData.assignedUserId)
        setBrokerUserId(clientData.brokerUserId ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))

    fetchBrokers()
      .then(setBrokersList)
      .catch(() => {})

    if (isAdmin) {
      fetchRealtors(true)
        .then((list) => setRealtors(list.filter((r) => r.realtor)))
        .catch(() => {})
    }
  }, [id, isAdmin])

  const startEditWork = () => {
    if (!client) return
    setSource(client.source)
    setStatus(client.status)
    setAssignedUserId(client.assignedUserId)
    setBrokerUserId(client.brokerUserId ?? '')
    setWorkError('')
    setWorkSuccess('')
    setEditingWork(true)
  }

  const cancelEditWork = () => {
    setEditingWork(false)
    setWorkError('')
  }

  const saveWorkSection = async () => {
    if (!client) return
    setWorkSaving(true)
    setWorkError('')
    setWorkSuccess('')

    try {
      const updated = await updateClient(client.id, {
        fullName: client.fullName,
        phone: client.phone,
        email: client.email ?? undefined,
        source,
        status,
        comment: client.comment ?? undefined,
        assignedUserId: isAdmin && assignedUserId ? Number(assignedUserId) : undefined,
        brokerUserId: brokerUserId ? Number(brokerUserId) : null,
      })
      setClient(updated)
      const calcs = await fetchClientCalculations(client.id)
      setCalculations(calcs)

      setWorkSuccess('Сохранено')
      setEditingWork(false)
    } catch (err) {
      setWorkError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setWorkSaving(false)
    }
  }

  if (loading) return <p className="text-chid-text/60">Загрузка…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!client) return null

  const latestCalc = calculations[0]
  const phoneHref = client.phone.replace(/\D/g, '').replace(/^8/, '7')

  return (
    <div className="space-y-6">
      <Link to={paths.clients} className="text-sm text-chid-btn hover:underline">
        ← К списку клиентов
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-chid-text">{client.fullName}</h1>
            <StatusBadge status={client.status} />
            {user?.id && client.brokerUserId === user.id && (
              <span className="rounded bg-chid-accent-muted px-2 py-0.5 text-xs font-medium text-chid-text/70">
                вы брокер
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-chid-text/60">
            В CRM с {formatDate(client.createdAt)}
            {client.updatedAt && client.updatedAt !== client.createdAt && (
              <> · обновлён {formatDate(client.updatedAt)}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={paths.calculationsNew(client.id)}
            className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
          >
            + Новый расчёт
          </Link>
          <Link
            to={paths.clientEdit(client.id)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-chid-text ring-1 ring-chid-ring/60 hover:bg-chid-accent-muted"
          >
            Редактировать
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Расчётов" value={String(calculations.length)} />
        <StatCard
          label="Последний платёж"
          value={latestCalc ? formatMoney(latestCalc.resultMonthlyPayment) : '—'}
        />
        <StatCard
          label="Последняя сумма кредита"
          value={latestCalc ? formatMoney(latestCalc.loanAmount) : '—'}
        />
        <StatCard
          label="Последний расчёт"
          value={latestCalc ? formatDate(latestCalc.createdAt) : '—'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
          <h2 className="text-lg font-semibold text-chid-text">Контакты</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <InfoItem label="Телефон">
              <a href={`tel:+${phoneHref}`} className="text-chid-btn hover:underline">
                {client.phone}
              </a>
            </InfoItem>
            <InfoItem label="Email">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="text-chid-btn hover:underline">
                  {client.email}
                </a>
              ) : (
                '—'
              )}
            </InfoItem>
          </div>
        </section>

        <section className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-chid-text">Работа с клиентом</h2>
            {!editingWork ? (
              <button
                type="button"
                onClick={startEditWork}
                className="text-sm font-medium text-chid-btn hover:underline"
              >
                Изменить
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={cancelEditWork}
                  className="rounded-lg px-3 py-1.5 text-sm text-chid-text/70 ring-1 ring-chid-ring/50 hover:bg-chid-accent-muted"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={saveWorkSection}
                  disabled={workSaving}
                  className="rounded-lg bg-chid-btn px-3 py-1.5 text-sm font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
                >
                  {workSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            )}
          </div>

          {editingWork ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Источник</label>
                <select
                  className="input-select w-full"
                  value={source}
                  onChange={(e) => setSource(e.target.value as ClientSource)}
                >
                  {SOURCES.map((value) => (
                    <option key={value} value={value}>
                      {CLIENT_SOURCE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Статус</label>
                <select
                  className="input-select w-full"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {CLIENT_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Ответственный риелтор</label>
                {isAdmin ? (
                  <select
                    className="input-select w-full"
                    value={assignedUserId}
                    onChange={(e) =>
                      setAssignedUserId(e.target.value ? Number(e.target.value) : '')
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
                ) : (
                  <p className="rounded-lg bg-chid-accent-muted/40 px-3 py-2.5 text-sm">
                    {client.assignedUserName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Брокер клиента</label>
                <select
                  className="input-select w-full"
                  value={brokerUserId}
                  onChange={(e) =>
                    setBrokerUserId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Без брокера</option>
                  {brokersList.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.fullName}
                      {broker.phone ? ` · ${broker.phone}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-chid-text/45">
                  Один брокер на клиента — для всех расчётов
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-chid-text/45">ID клиента</p>
                <p className="text-sm font-medium text-chid-text">#{client.id}</p>
              </div>

              {workError && <p className="sm:col-span-2 text-sm text-red-600">{workError}</p>}
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <InfoItem label="Источник">{CLIENT_SOURCE_LABELS[client.source]}</InfoItem>
              <InfoItem label="Ответственный риелтор">{client.assignedUserName}</InfoItem>
              <InfoItem label="Брокер клиента">{client.brokerName || '—'}</InfoItem>
              <InfoItem label="Статус">
                <StatusBadge status={client.status} />
              </InfoItem>
              <InfoItem label="ID клиента">#{client.id}</InfoItem>
              {workSuccess && (
                <p className="sm:col-span-2 text-sm text-green-700">{workSuccess}</p>
              )}
            </div>
          )}
        </section>
      </div>

      {client.comment && (
        <section className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
          <h2 className="text-lg font-semibold text-chid-text">Комментарий</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-chid-text/80">
            {client.comment}
          </p>
        </section>
      )}

      <section className="rounded-2xl bg-chid-white shadow-sm ring-1 ring-chid-ring/40">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chid-ring/30 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-chid-text">Ипотечные расчёты</h2>
            <p className="mt-1 text-sm text-chid-text/60">
              Все сохранённые расчёты, привязанные к этому клиенту
            </p>
          </div>
          <Link
            to={paths.calculationsNew(client.id)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-chid-btn ring-1 ring-chid-ring/60 hover:bg-chid-accent-muted"
          >
            Добавить расчёт
          </Link>
        </div>

        {calculations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-chid-text/60">У клиента пока нет сохранённых расчётов</p>
            <Link
              to={paths.calculationsNew(client.id)}
              className="mt-4 inline-block rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
            >
              Создать первый расчёт
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-chid-accent-muted text-left text-chid-text/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium">Брокер</th>
                  <th className="px-4 py-3 font-medium">Режим</th>
                  <th className="px-4 py-3 font-medium">Сумма кредита</th>
                  <th className="px-4 py-3 font-medium">Платёж</th>
                  <th className="px-4 py-3 font-medium">Переплата</th>
                  <th className="px-4 py-3 font-medium">Срок</th>
                  <th className="px-4 py-3 font-medium">Ставка</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">ЖК</th>
                  <th className="px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chid-ring/30">
                {calculations.map((calc) => (
                  <tr key={calc.id} className="hover:bg-chid-accent-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <Link to={paths.calculation(calc.id)} className="text-chid-btn hover:underline">
                        {calc.title || `Расчёт #${calc.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {calc.brokerName || <span className="text-chid-text/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {CALCULATION_MODE_LABELS[calc.mode]}
                      <span className="mt-0.5 block text-xs text-chid-text/50">
                        {PAYMENT_TYPE_LABELS[calc.paymentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatMoney(calc.loanAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatMoney(calc.resultMonthlyPayment)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatMoney(calc.resultOverpayment)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatTermMonths(calc.termMonths)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{calc.interestRate}%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-chid-text/60">
                      {formatDate(calc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {calc.propertyUrl ? (
                        <a
                          href={calc.propertyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-chid-btn hover:underline"
                        >
                          Карточка
                        </a>
                      ) : (
                        <span className="text-chid-text/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          to={paths.calculation(calc.id)}
                          className="text-chid-btn hover:underline"
                        >
                          Открыть
                        </Link>
                        {calc.publicToken && (
                          <a
                            href={getPublicCalculationUrl(calc.publicToken)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-chid-text/60 hover:text-chid-btn hover:underline"
                          >
                            Ссылка клиенту
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
