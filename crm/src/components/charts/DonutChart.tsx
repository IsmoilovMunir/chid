const PRINCIPAL_COLOR = '#082F9B'
const INTEREST_COLOR = '#DFB286'

interface Slice {
  value: number
  percent: number
  color: string
  label: string
}

interface Props {
  totalPrincipal: number
  totalInterest: number
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

function describeArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle)
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle)
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ')
}

export function DonutChart({ totalPrincipal, totalInterest }: Props) {
  const total = totalPrincipal + totalInterest
  if (total <= 0) return null

  const slices: Slice[] = [
    {
      value: totalPrincipal,
      percent: (totalPrincipal / total) * 100,
      color: PRINCIPAL_COLOR,
      label: 'Основной долг',
    },
    {
      value: totalInterest,
      percent: (totalInterest / total) * 100,
      color: INTEREST_COLOR,
      label: 'Проценты',
    },
  ]

  const cx = 100
  const cy = 100
  const outerR = 90
  const innerR = 50
  let angle = 0

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="text-chid-text">
              {slice.label}{' '}
              <span className="font-semibold">{slice.percent.toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 200 200" className="h-48 w-48 drop-shadow-sm" role="img" aria-label="Структура выплат">
        {slices.map((slice) => {
          const sweep = (slice.percent / 100) * 360
          const path = describeArc(cx, cy, outerR, innerR, angle, angle + sweep)
          angle += sweep
          return (
            <path
              key={slice.label}
              d={path}
              fill={slice.color}
              className="transition-opacity hover:opacity-90"
            >
              <title>{`${slice.label} (${slice.percent.toFixed(1)}%)`}</title>
            </path>
          )
        })}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-chid-text/60 text-[10px]">
          Выплачено
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-chid-text text-[11px] font-semibold">
          всего
        </text>
      </svg>
    </div>
  )
}

export { PRINCIPAL_COLOR, INTEREST_COLOR }
