import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScheduleRow } from '../../types/mortgage'
import { formatPaymentMonth, formatScheduleAmount } from '../../types/mortgage'
import { INTEREST_COLOR, PRINCIPAL_COLOR } from './DonutChart'

interface Props {
  schedule: ScheduleRow[]
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(Math.round(value))
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="mb-2 font-medium text-chid-text">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center justify-between gap-6 text-chid-text/70">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.name}
          </span>
          <span className="font-medium tabular-nums text-chid-text">{formatScheduleAmount(item.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function PaymentsTimelineChart({ schedule }: Props) {
  const data = schedule.map((row) => ({
    name: formatPaymentMonth(row.month),
    principal: row.principal,
    interest: row.interest,
    payment: row.payment,
  }))

  const tickInterval = Math.max(1, Math.floor(schedule.length / 8))

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRINCIPAL_COLOR} stopOpacity={0.9} />
              <stop offset="100%" stopColor={PRINCIPAL_COLOR} stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INTEREST_COLOR} stopOpacity={0.85} />
              <stop offset="100%" stopColor={INTEREST_COLOR} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={tickInterval}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tickFormatter={formatAxisValue}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-sm text-chid-text/70">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="interest"
            name="Проценты"
            stackId="1"
            stroke={INTEREST_COLOR}
            fill="url(#interestGradient)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="principal"
            name="Основной долг"
            stackId="1"
            stroke={PRINCIPAL_COLOR}
            fill="url(#principalGradient)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
