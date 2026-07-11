export function parseAmount(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) ? num : 0
}

/** Только цифры (для сумм в рублях) */
export function sanitizeRublesInput(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Цифры и одна точка/запятая (для процентов) */
export function sanitizePercentInput(raw: string): string {
  let cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`
  }
  if (parts[0].length > 3) {
    cleaned = '100'
  }
  const num = parseFloat(cleaned)
  if (Number.isFinite(num) && num > 100) {
    return '100'
  }
  return cleaned
}

export function formatWithSpaces(digits: string): string {
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatRublesHint(value: string): string {
  const amount = parseAmount(value)
  if (amount <= 0) return ''
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function computeLoanAmount(
  propertyPrice: string,
  downPayment: string,
  downPaymentType: 'AMOUNT' | 'PERCENT',
): string {
  const price = parseAmount(propertyPrice)
  if (price <= 0) return ''

  const down = parseAmount(downPayment)
  const downPaymentAmount =
    downPaymentType === 'PERCENT' ? (price * Math.min(down, 100)) / 100 : Math.min(down, price)
  const loan = Math.max(0, price - downPaymentAmount)

  return String(Math.round(loan))
}

export function downPaymentInRubles(
  propertyPrice: string,
  downPayment: string,
  downPaymentType: 'AMOUNT' | 'PERCENT',
): number {
  const price = parseAmount(propertyPrice)
  const down = parseAmount(downPayment)
  if (price <= 0 || down <= 0) return 0
  return downPaymentType === 'PERCENT'
    ? Math.round((price * Math.min(down, 100)) / 100)
    : Math.min(down, price)
}

export function downPaymentInPercent(
  propertyPrice: string,
  downPayment: string,
  downPaymentType: 'AMOUNT' | 'PERCENT',
): number {
  const price = parseAmount(propertyPrice)
  const down = parseAmount(downPayment)
  if (price <= 0 || down <= 0) return 0
  if (downPaymentType === 'PERCENT') {
    return Math.min(down, 100)
  }
  return Math.round((down / price) * 10000) / 100
}

export function rublesToPercent(rubles: string, propertyPrice: string): string {
  const price = parseAmount(propertyPrice)
  const rub = parseAmount(rubles)
  if (price <= 0 || rub <= 0) return ''
  const percent = (rub / price) * 100
  return percent % 1 === 0 ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '')
}

export function percentToRubles(percent: string, propertyPrice: string): string {
  const price = parseAmount(propertyPrice)
  const pct = parseAmount(percent)
  if (price <= 0 || pct <= 0) return ''
  return String(Math.round((price * Math.min(pct, 100)) / 100))
}
