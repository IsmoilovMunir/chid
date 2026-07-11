import { useEffect, useMemo, useState } from 'react'
import type { ScheduleRow } from '../types/mortgage'
import { formatPaymentMonth, formatScheduleAmount } from '../types/mortgage'

const PREVIEW_ROWS = 10

interface Props {
  schedule: ScheduleRow[]
  totalPayment: number
  totalPrincipal: number
  totalInterest: number
}

function ScheduleRowCells({ row }: { row: ScheduleRow }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="whitespace-nowrap px-4 py-2 text-slate-500">{row.month}</td>
      <td className="whitespace-nowrap px-4 py-2">{formatPaymentMonth(row.month)}</td>
      <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatScheduleAmount(row.payment)}</td>
      <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatScheduleAmount(row.principal)}</td>
      <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatScheduleAmount(row.interest)}</td>
      <td className="whitespace-nowrap px-4 py-2 tabular-nums">{formatScheduleAmount(row.remainingBalance)}</td>
    </tr>
  )
}

export function ScheduleTable({ schedule, totalPayment, totalPrincipal, totalInterest }: Props) {
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setShowAll(false)
  }, [schedule])

  const isCollapsible = schedule.length > PREVIEW_ROWS * 2

  const visibleRows = useMemo(() => {
    if (!isCollapsible || showAll) {
      return schedule
    }
    return [
      ...schedule.slice(0, PREVIEW_ROWS),
      ...schedule.slice(-PREVIEW_ROWS),
    ]
  }, [schedule, isCollapsible, showAll])

  const hiddenCount = isCollapsible ? schedule.length - PREVIEW_ROWS * 2 : 0

  return (
    <div className="overflow-hidden rounded-2xl bg-chid-white shadow-sm ring-1 ring-chid-ring/40">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-chid-text">График погашения</h3>
      </div>
      <div className={`overflow-auto ${showAll ? 'max-h-[32rem]' : ''}`}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-chid-accent-muted text-left text-chid-text/70">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">№</th>
              <th className="whitespace-nowrap px-4 py-3">Месяц</th>
              <th className="whitespace-nowrap px-4 py-3">Сумма платежа</th>
              <th className="whitespace-nowrap px-4 py-3">Платеж по основному долгу</th>
              <th className="whitespace-nowrap px-4 py-3">Платеж по процентам</th>
              <th className="whitespace-nowrap px-4 py-3">Остаток долга</th>
            </tr>
          </thead>
          <tbody>
            {!isCollapsible || showAll ? (
              schedule.map((row) => <ScheduleRowCells key={row.month} row={row} />)
            ) : (
              <>
                {visibleRows.slice(0, PREVIEW_ROWS).map((row) => (
                  <ScheduleRowCells key={`start-${row.month}`} row={row} />
                ))}
                <tr className="border-t border-slate-100 bg-slate-50/80">
                  <td colSpan={6} className="px-4 py-5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="text-sm font-medium text-chid-btn underline-offset-2 hover:text-chid-btn-hover hover:underline"
                    >
                      Нажмите, чтобы показать все строки
                    </button>
                    <p className="mt-1 text-xs text-slate-500">Скрыто ещё {hiddenCount} платежей</p>
                  </td>
                </tr>
                {visibleRows.slice(PREVIEW_ROWS).map((row) => (
                  <ScheduleRowCells key={`end-${row.month}`} row={row} />
                ))}
              </>
            )}
          </tbody>
          <tfoot className="border-t-2 border-chid-ring/50 bg-chid-accent-muted text-chid-text">
            <tr>
              <td colSpan={2} className="px-4 py-3 font-semibold">
                Итого
              </td>
              <td className="px-4 py-3 tabular-nums">
                <div className="text-xs font-normal text-chid-text/60">Выплачено всего</div>
                <div className="font-semibold">{formatScheduleAmount(totalPayment)}</div>
              </td>
              <td className="px-4 py-3 tabular-nums">
                <div className="text-xs font-normal text-chid-text/60">Сумма выплаченного долга</div>
                <div className="font-semibold">{formatScheduleAmount(totalPrincipal)}</div>
              </td>
              <td className="px-4 py-3 tabular-nums">
                <div className="text-xs font-normal text-chid-text/60">Сумма выплаченных процентов</div>
                <div className="font-semibold">{formatScheduleAmount(totalInterest)}</div>
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
