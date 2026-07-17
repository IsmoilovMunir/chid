import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCalculations } from '../api/client'
import type { CalculationSummary } from '../types/crm'
import { CALCULATION_MODE_LABELS, PAYMENT_TYPE_LABELS } from '../constants/labels'
import { formatDate, formatMoney, formatTermMonths } from '../utils/format'
import { useCrmPaths } from '../hooks/useCrmPaths'

export function CalculationsPage() {
  const paths = useCrmPaths()
  const [calculations, setCalculations] = useState<CalculationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCalculations()
      .then(setCalculations)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chid-text">Расчёты</h1>
          <p className="mt-1 text-sm text-chid-text/60">Сохранённые ипотечные расчёты</p>
        </div>
        <Link
          to={paths.calculationsNew()}
          className="rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
        >
          + Новый расчёт
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-chid-white shadow-sm ring-1 ring-chid-ring/40">
        {loading ? (
          <p className="p-8 text-center text-chid-text/60">Загрузка…</p>
        ) : calculations.length === 0 ? (
          <p className="p-8 text-center text-chid-text/60">Сохранённых расчётов пока нет</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-chid-accent-muted text-left text-chid-text/70">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Брокер</th>
                <th className="px-4 py-3 font-medium">Режим</th>
                <th className="px-4 py-3 font-medium">Сумма кредита</th>
                <th className="px-4 py-3 font-medium">Платёж</th>
                <th className="px-4 py-3 font-medium">Срок</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Ссылка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chid-ring/30">
              {calculations.map((calc) => (
                <tr key={calc.id} className="hover:bg-chid-accent-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link to={paths.calculation(calc.id)} className="text-chid-btn hover:underline">
                      {calc.title || `Расчёт #${calc.id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{calc.clientName || '—'}</td>
                  <td className="px-4 py-3">{calc.brokerName || '—'}</td>
                  <td className="px-4 py-3">
                    {CALCULATION_MODE_LABELS[calc.mode]}
                    <span className="ml-1 text-chid-text/50">
                      · {PAYMENT_TYPE_LABELS[calc.paymentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatMoney(calc.loanAmount)}</td>
                  <td className="px-4 py-3">{formatMoney(calc.resultMonthlyPayment)}</td>
                  <td className="px-4 py-3">{formatTermMonths(calc.termMonths)}</td>
                  <td className="px-4 py-3 text-chid-text/60">{formatDate(calc.createdAt)}</td>
                  <td className="px-4 py-3">
                    {calc.publicToken ? (
                      <Link
                        to={paths.calculation(calc.id)}
                        className="text-sm text-chid-btn hover:underline"
                      >
                        Открыть
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
