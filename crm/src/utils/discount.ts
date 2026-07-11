import { parseAmount, sanitizePercentInput } from './loanAmount'

export type DiscountUnit = 'AMOUNT' | 'PERCENT'

export function applyLoanDiscount(
  baseLoan: number,
  discountValue: string,
  discountType: DiscountUnit,
): number {
  if (baseLoan <= 0) return 0

  if (discountType === 'AMOUNT') {
    return Math.max(0, baseLoan - (parseAmount(discountValue) || 0))
  }

  const pct = Number(sanitizePercentInput(discountValue)) || 0
  const fromPercent = Math.round((baseLoan * pct) / 100)
  return Math.max(0, baseLoan - fromPercent)
}

export function hasLoanDiscount(discountValue: string, discountType: DiscountUnit): boolean {
  if (discountType === 'AMOUNT') {
    return (parseAmount(discountValue) || 0) > 0
  }
  return (Number(sanitizePercentInput(discountValue)) || 0) > 0
}

export function discountToApi(discountValue: string, discountType: DiscountUnit) {
  if (discountType === 'AMOUNT') {
    const amount = parseAmount(discountValue) || 0
    return {
      discountAmount: amount > 0 ? amount : undefined,
      discountPercent: undefined as number | undefined,
    }
  }

  const percent = Number(sanitizePercentInput(discountValue)) || 0
  return {
    discountAmount: undefined as number | undefined,
    discountPercent: percent > 0 ? percent : undefined,
  }
}

export function discountFromApi(
  discountAmount?: number | null,
  discountPercent?: number | null,
): { value: string; type: DiscountUnit } {
  if ((discountAmount ?? 0) > 0) {
    return { value: String(Math.round(discountAmount!)), type: 'AMOUNT' }
  }
  if ((discountPercent ?? 0) > 0) {
    return { value: String(discountPercent), type: 'PERCENT' }
  }
  return { value: '', type: 'AMOUNT' }
}
