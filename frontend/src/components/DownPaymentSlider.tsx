import { useCallback, useMemo } from 'react'
import { formatWithSpaces, parseAmount } from '../utils/loanAmount'

export const DOWN_PAYMENT_PERCENT_MIN = 20
export const DOWN_PAYMENT_PERCENT_MAX = 100

interface DownPaymentSliderProps {
  propertyPrice: string
  value: string
  downPaymentType: 'AMOUNT' | 'PERCENT'
  onChange: (value: string) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getPercentFromValue(
  propertyPrice: string,
  value: string,
  downPaymentType: 'AMOUNT' | 'PERCENT',
): number {
  const price = parseAmount(propertyPrice)
  const down = parseAmount(value)

  if (!value || down <= 0) {
    return DOWN_PAYMENT_PERCENT_MIN
  }

  if (downPaymentType === 'PERCENT') {
    return clamp(down, DOWN_PAYMENT_PERCENT_MIN, DOWN_PAYMENT_PERCENT_MAX)
  }

  if (price <= 0) {
    return DOWN_PAYMENT_PERCENT_MIN
  }

  return clamp((down / price) * 100, DOWN_PAYMENT_PERCENT_MIN, DOWN_PAYMENT_PERCENT_MAX)
}

export function DownPaymentSlider({
  propertyPrice,
  value,
  downPaymentType,
  onChange,
}: DownPaymentSliderProps) {
  const price = parseAmount(propertyPrice)
  const disabled = price <= 0

  const minRub = useMemo(() => Math.round((price * DOWN_PAYMENT_PERCENT_MIN) / 100), [price])
  const maxRub = useMemo(() => price, [price])

  const currentPercent = getPercentFromValue(propertyPrice, value, downPaymentType)
  const fillPercent =
    ((currentPercent - DOWN_PAYMENT_PERCENT_MIN) / (DOWN_PAYMENT_PERCENT_MAX - DOWN_PAYMENT_PERCENT_MIN)) * 100

  const handleSliderChange = useCallback(
    (percent: number) => {
      const clamped = clamp(percent, DOWN_PAYMENT_PERCENT_MIN, DOWN_PAYMENT_PERCENT_MAX)

      if (downPaymentType === 'PERCENT') {
        onChange(String(Math.round(clamped)))
        return
      }

      onChange(String(Math.round((price * clamped) / 100)))
    },
    [downPaymentType, onChange, price],
  )

  if (disabled) {
    return (
      <p className="mt-3 text-xs text-chid-text/35">
        Сначала укажите стоимость недвижимости — слайдер от 20% до 100%
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="relative h-6 select-none">
        <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-slate-200">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-chid-primary transition-[width] duration-75"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <input
          type="range"
          min={DOWN_PAYMENT_PERCENT_MIN}
          max={DOWN_PAYMENT_PERCENT_MAX}
          step={1}
          value={currentPercent}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="amount-slider-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Первоначальный взнос"
          aria-valuemin={DOWN_PAYMENT_PERCENT_MIN}
          aria-valuemax={DOWN_PAYMENT_PERCENT_MAX}
          aria-valuenow={currentPercent}
        />

        <div
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${fillPercent}%` }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-chid-primary bg-chid-white shadow-md ring-2 ring-chid-ring">
            <div className="h-2 w-2 rounded-full bg-chid-primary" />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-chid-text/35">
        <span>
          20% · {formatWithSpaces(String(minRub))} ₽
        </span>
        <span className="font-medium text-chid-text">{Math.round(currentPercent)}%</span>
        <span>
          100% · {formatWithSpaces(String(maxRub))} ₽
        </span>
      </div>
    </div>
  )
}
