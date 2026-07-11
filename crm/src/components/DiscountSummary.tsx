import { formatMoney } from '../types/mortgage'

interface DiscountSummaryProps {
  baseLoanAmount?: number | null
  discountAmount?: number | null
  discountPercent?: number | null
  loanAmount: number
}

export function DiscountSummary({
  baseLoanAmount,
  discountAmount,
  discountPercent,
  loanAmount,
}: DiscountSummaryProps) {
  const hasRub = (discountAmount ?? 0) > 0
  const hasPct = (discountPercent ?? 0) > 0

  if (!hasRub && !hasPct) return null

  const base = baseLoanAmount ?? loanAmount

  return (
    <div className="rounded-xl bg-chid-accent-muted p-4 ring-1 ring-chid-accent/40">
      <p className="text-sm text-chid-text/70">Скидка по договору с застройщиком</p>
      <div className="mt-2 space-y-1 text-sm text-chid-text">
        <p>
          Сумма кредита: <span className="font-medium">{formatMoney(base)}</span>
        </p>
        {hasRub && (
          <p>
            Скидка: <span className="font-medium text-green-700">−{formatMoney(discountAmount ?? 0)}</span>
          </p>
        )}
        {hasPct && (
          <p>
            Скидка: <span className="font-medium text-green-700">−{discountPercent}%</span>
          </p>
        )}
        <p className="pt-1 text-base font-semibold text-chid-btn">
          С учётом скидки: {formatMoney(loanAmount)}
        </p>
      </div>
    </div>
  )
}
