import { useCallback } from 'react'
import { formatWithSpaces, parseAmount } from '../utils/loanAmount'

export const PROPERTY_PRICE_MIN = 376_000
export const PROPERTY_PRICE_MAX = 100_000_000
const STEP = 10_000

interface AmountSliderProps {
  value: string
  onChange: (rawDigits: string) => void
  min?: number
  max?: number
  step?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toSliderValue(raw: string, min: number, max: number): number {
  const parsed = parseAmount(raw)
  if (!raw || parsed <= 0) return min
  return clamp(parsed, min, max)
}

function formatShortLabel(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)} млн`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`
  }
  return String(value)
}

export function AmountSlider({
  value,
  onChange,
  min = PROPERTY_PRICE_MIN,
  max = PROPERTY_PRICE_MAX,
  step = STEP,
}: AmountSliderProps) {
  const sliderValue = toSliderValue(value, min, max)
  const percent = ((sliderValue - min) / (max - min)) * 100

  const handleSliderChange = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max)
      const rounded = Math.round(clamped / step) * step
      onChange(String(rounded))
    },
    [min, max, step, onChange],
  )

  return (
    <div className="mt-3 space-y-2">
      <div className="relative h-6 select-none">
        {/* Track */}
        <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-slate-200">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-chid-primary transition-[width] duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Native range for accessibility & drag */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="amount-slider-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Стоимость недвижимости"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={sliderValue}
        />

        {/* Thumb */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${percent}%` }}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-chid-primary bg-chid-white shadow-md ring-2 ring-chid-ring">
            <div className="h-2 w-2 rounded-full bg-chid-primary" />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-chid-text/35">
        <span>{formatWithSpaces(String(min))} ₽</span>
        <span className="font-medium text-chid-text">
          {value ? `${formatWithSpaces(value)} ₽` : formatShortLabel(min)}
        </span>
        <span>{formatShortLabel(max)} ₽</span>
      </div>
    </div>
  )
}
