import type { CalculationMode, MortgageResponse, PaymentType } from '../types/mortgage'

export interface CalculatorFormInitial {
  mode: CalculationMode
  paymentType: PaymentType
  propertyPrice: string
  downPayment: string
  downPaymentType: 'AMOUNT' | 'PERCENT'
  loanAmount: string
  termYears: string
  monthlyPayment: string
  interestRate: string
  discountAmount?: number
  discountPercent?: number
}

export function mortgageResponseToForm(result: MortgageResponse): CalculatorFormInitial {
  const termYears = result.termMonths ? String(Math.round(result.termMonths / 12)) : ''
  const interestRate = String(result.interestRate)
  const base = {
    mode: result.mode,
    paymentType: result.paymentType,
    interestRate,
    termYears,
    propertyPrice: '',
    downPayment: '',
    downPaymentType: 'AMOUNT' as const,
    loanAmount: '',
    monthlyPayment: '',
  }

  if (result.mode === 'PAYMENT') {
    const baseLoan = result.baseLoanAmount ?? result.loanAmount
    return {
      ...base,
      propertyPrice: result.propertyPrice != null ? String(Math.round(result.propertyPrice)) : '',
      downPayment: result.downPayment != null ? String(Math.round(result.downPayment)) : '',
      loanAmount: baseLoan != null ? String(Math.round(baseLoan)) : '',
    }
  }

  if (result.mode === 'TERM') {
    const baseLoan = result.baseLoanAmount ?? result.loanAmount
    return {
      ...base,
      loanAmount: baseLoan != null ? String(Math.round(baseLoan)) : '',
      monthlyPayment:
        result.monthlyPayment != null
          ? String(Math.round(result.monthlyPayment))
          : result.firstMonthlyPayment != null
            ? String(Math.round(result.firstMonthlyPayment))
            : '',
    }
  }

  return {
    ...base,
    monthlyPayment:
      result.monthlyPayment != null
        ? String(Math.round(result.monthlyPayment))
        : result.firstMonthlyPayment != null
          ? String(Math.round(result.firstMonthlyPayment))
          : '',
  }
}
