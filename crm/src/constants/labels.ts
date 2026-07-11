import type { ClientSource, ClientStatus, CalculationMode, PaymentType } from '../types/crm'

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  SEARCH: 'Поиск',
  CALL: 'Звонок',
  REFERRAL: 'Рекомендация',
  WEBSITE: 'Сайт',
  OTHER: 'Другое',
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  THINKING: 'Думает',
  REJECTED: 'Отказ',
  DEAL: 'Сделка',
}

export const CALCULATION_MODE_LABELS: Record<CalculationMode, string> = {
  PAYMENT: 'Платёж',
  TERM: 'Срок',
  AMOUNT: 'Сумма',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ANNUITY: 'Аннуитет',
  DIFFERENTIATED: 'Дифференцированный',
}

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  THINKING: 'bg-purple-100 text-purple-800',
  REJECTED: 'bg-red-100 text-red-800',
  DEAL: 'bg-green-100 text-green-800',
}
