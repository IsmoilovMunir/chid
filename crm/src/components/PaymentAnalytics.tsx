import type { ScheduleRow } from '../types/mortgage'
import { DonutChart } from './charts/DonutChart'
import { PaymentsTimelineChart } from './charts/PaymentsTimelineChart'

interface Props {
  schedule: ScheduleRow[]
  totalPrincipal: number
  totalInterest: number
}

export function PaymentAnalytics({ schedule, totalPrincipal, totalInterest }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-chid-text">Аналитика платежей</h3>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex items-center justify-center rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
          <DonutChart totalPrincipal={totalPrincipal} totalInterest={totalInterest} />
        </div>

        <div className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
          <p className="mb-4 text-sm text-chid-text/70">Структура ежемесячных платежей по месяцам</p>
          <PaymentsTimelineChart schedule={schedule} />
        </div>
      </div>
    </div>
  )
}
