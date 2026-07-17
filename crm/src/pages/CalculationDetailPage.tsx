import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBrokers, fetchCalculation, fetchClient, updateClient } from '../api/client'
import type { CalculationDetail, RealtorUser } from '../types/crm'
import { CALCULATION_MODE_LABELS, PAYMENT_TYPE_LABELS } from '../constants/labels'
import { ScheduleTable } from '../components/ScheduleTable'
import { PaymentAnalytics } from '../components/PaymentAnalytics'
import { formatMoney, formatMoneyExact } from '../types/mortgage'
import { formatDate, formatTermMonths } from '../utils/format'
import { DiscountSummary } from '../components/DiscountSummary'
import { copyToClipboard, getPublicCalculationUrl } from '../utils/publicLink'
import { useCrmPaths } from '../hooks/useCrmPaths'

export function CalculationDetailPage() {
  const { id } = useParams()
  const paths = useCrmPaths()
  const [calculation, setCalculation] = useState<CalculationDetail | null>(null)
  const [brokers, setBrokers] = useState<RealtorUser[]>([])
  const [brokerUserId, setBrokerUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [brokerSaving, setBrokerSaving] = useState(false)
  const [error, setError] = useState('')
  const [brokerError, setBrokerError] = useState('')
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    if (!id) return

    fetchCalculation(Number(id))
      .then((data) => {
        setCalculation(data)
        setBrokerUserId(data.brokerUserId ? String(data.brokerUserId) : '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))

    fetchBrokers()
      .then(setBrokers)
      .catch(() => {})
  }, [id])

  const handleCopyLink = async () => {
    if (!calculation?.publicToken) return
    const ok = await copyToClipboard(getPublicCalculationUrl(calculation.publicToken))
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadPdf = async () => {
    if (!calculation) return
    setPdfLoading(true)
    setPdfError('')
    try {
      const { downloadCalculationPdf } = await import('../utils/generateCalculationPdf')
      await downloadCalculationPdf(calculation)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Не удалось сформировать PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleAssignBroker = async () => {
    if (!calculation?.clientId) {
      setBrokerError('Сначала привяжите расчёт к клиенту — брокер назначается клиенту')
      return
    }

    setBrokerSaving(true)
    setBrokerError('')
    try {
      const client = await fetchClient(calculation.clientId)
      await updateClient(client.id, {
        fullName: client.fullName,
        phone: client.phone,
        email: client.email ?? undefined,
        source: client.source,
        status: client.status,
        comment: client.comment ?? undefined,
        assignedUserId: client.assignedUserId,
        brokerUserId: brokerUserId ? Number(brokerUserId) : null,
      })
      const updated = await fetchCalculation(calculation.id)
      setCalculation(updated)
      setBrokerUserId(updated.brokerUserId ? String(updated.brokerUserId) : '')
    } catch (err) {
      setBrokerError(err instanceof Error ? err.message : 'Не удалось назначить брокера')
    } finally {
      setBrokerSaving(false)
    }
  }

  if (loading) return <p className="text-chid-text/60">Загрузка…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!calculation) return null

  const result = calculation.result
  const modeLabel = calculation.mode
    ? CALCULATION_MODE_LABELS[calculation.mode]
    : result.mode
      ? CALCULATION_MODE_LABELS[result.mode]
      : '—'
  const paymentTypeLabel = calculation.paymentType
    ? PAYMENT_TYPE_LABELS[calculation.paymentType]
    : result.paymentType
      ? PAYMENT_TYPE_LABELS[result.paymentType]
      : '—'

  return (
    <div className="space-y-6">
      <Link to={paths.calculations} className="text-sm text-chid-btn hover:underline">
        ← К списку расчётов
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chid-text">
            {calculation.title || `Расчёт #${calculation.id}`}
          </h1>
          <p className="mt-1 text-sm text-chid-text/60">
            {formatDate(calculation.createdAt)}
            {calculation.clientName && ` · ${calculation.clientName}`}
            {calculation.brokerName && ` · брокер: ${calculation.brokerName}`}
          </p>
          {calculation.propertyUrl && (
            <a
              href={calculation.propertyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-chid-btn hover:underline"
            >
              Открыть карточку квартиры в ЖК →
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="rounded-lg bg-chid-white px-5 py-2.5 text-sm font-medium text-chid-btn ring-1 ring-chid-btn/30 hover:bg-chid-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pdfLoading ? 'Формируем PDF…' : 'Скачать PDF'}
          </button>
          <Link
            to={paths.calculationEdit(calculation.id)}
            className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
          >
            Изменить
          </Link>
          <Link
            to={paths.calculationsNew()}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-chid-text ring-1 ring-chid-ring/60 hover:bg-chid-accent-muted"
          >
            Новый расчёт
          </Link>
        </div>
      </div>

      {pdfError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pdfError}</p>
      )}

      <div className="rounded-2xl bg-chid-white p-4 shadow-sm ring-1 ring-chid-ring/40">
        <p className="text-sm font-medium text-chid-text">Брокер клиента</p>
        <p className="mt-1 text-sm text-chid-text/60">
          У клиента один брокер на все расчёты. Смена брокера обновит его для всех расчётов этого
          клиента.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="mb-2 block text-sm font-medium">Назначить брокера</label>
            <select
              className="input-select w-full"
              value={brokerUserId}
              onChange={(e) => setBrokerUserId(e.target.value)}
              disabled={!calculation.clientId}
            >
              <option value="">Без брокера</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.fullName}
                  {broker.phone ? ` · ${broker.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAssignBroker}
            disabled={brokerSaving || !calculation.clientId}
            className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
          >
            {brokerSaving ? 'Сохранение…' : 'Назначить'}
          </button>
        </div>
        {brokerError && <p className="mt-2 text-sm text-red-600">{brokerError}</p>}
      </div>

      {calculation.publicToken && (
        <div className="rounded-2xl bg-chid-white p-4 shadow-sm ring-1 ring-chid-ring/40">
          <p className="text-sm font-medium text-chid-text">Публичная ссылка для клиента</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-lg bg-chid-accent-muted px-3 py-2 text-sm text-chid-text break-all">
              {getPublicCalculationUrl(calculation.publicToken)}
            </code>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg px-4 py-2 text-sm font-medium text-chid-btn ring-1 ring-chid-ring/60 hover:bg-chid-accent-muted"
            >
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>
      )}

      {(result.discountAmount || result.discountPercent) && (
        <DiscountSummary
          baseLoanAmount={result.baseLoanAmount}
          discountAmount={result.discountAmount}
          discountPercent={result.discountPercent}
          loanAmount={result.loanAmount}
        />
      )}

      <div className="grid gap-4 rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-chid-text/50">Режим</p>
          <p className="mt-1 font-medium">{modeLabel}</p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Тип платежа</p>
          <p className="mt-1 font-medium">{paymentTypeLabel}</p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Сумма кредита</p>
          <p className="mt-1 font-medium">{formatMoney(result.loanAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Срок</p>
          <p className="mt-1 font-medium">{formatTermMonths(result.termMonths)}</p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Ставка</p>
          <p className="mt-1 font-medium">{result.interestRate}%</p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Платёж</p>
          <p className="mt-1 font-medium">
            {formatMoneyExact(result.monthlyPayment ?? result.firstMonthlyPayment)}
          </p>
        </div>
        <div>
          <p className="text-xs text-chid-text/50">Переплата</p>
          <p className="mt-1 font-medium">{formatMoney(result.overpayment)}</p>
        </div>
      </div>

      {calculation.comment && (
        <div className="rounded-2xl bg-chid-white p-4 shadow-sm ring-1 ring-chid-ring/40">
          <p className="text-xs text-chid-text/50">Комментарий</p>
          <p className="mt-1 whitespace-pre-wrap text-chid-text/80">{calculation.comment}</p>
        </div>
      )}

      <PaymentAnalytics
        schedule={result.schedule}
        totalPrincipal={result.loanAmount}
        totalInterest={result.totalInterest}
      />

      <ScheduleTable
        schedule={result.schedule}
        totalPayment={result.totalPayment}
        totalPrincipal={result.loanAmount}
        totalInterest={result.totalInterest}
      />
    </div>
  )
}
