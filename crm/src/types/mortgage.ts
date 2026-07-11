export type CalculationMode = 'PAYMENT' | 'TERM' | 'AMOUNT'
export type PaymentType = 'ANNUITY' | 'DIFFERENTIATED'

export interface MortgageRequest {
  mode: CalculationMode
  propertyPrice?: number
  downPayment?: number
  downPaymentType?: 'AMOUNT' | 'PERCENT'
  loanAmount?: number
  termMonths?: number
  monthlyPayment?: number
  interestRate: number
  paymentType: PaymentType
}

export interface ScheduleRow {
  month: number
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

export interface MortgageResponse {
  mode: CalculationMode
  paymentType: PaymentType
  propertyPrice?: number
  downPayment?: number
  loanAmount: number
  termMonths: number
  interestRate: number
  baseLoanAmount?: number
  discountAmount?: number
  discountPercent?: number
  monthlyPayment?: number
  firstMonthlyPayment: number
  lastMonthlyPayment: number
  totalInterest: number
  totalPayment: number
  overpayment: number
  schedule: ScheduleRow[]
}

export function formatMoney(value?: number): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatScheduleAmount(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatMoneyExact(value?: number): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(value)
}

/** Первый платёж — со следующего месяца */
export function formatPaymentMonth(monthIndex: number): string {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() + monthIndex)

  const formatted = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date)

  const cleaned = formatted.replace(/\s*г\.?\s*$/i, '').trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
