import type { MortgageRequest, MortgageResponse } from '../types/mortgage'

const API_BASE = '/api'

export async function calculateMortgage(request: MortgageRequest): Promise<MortgageResponse> {
  const response = await fetch(`${API_BASE}/calculator/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Ошибка расчёта')
  }

  return response.json()
}

export async function submitLead(data: {
  name: string
  phone: string
  consent: boolean
}): Promise<void> {
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Ошибка отправки заявки')
  }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('Неверный email или пароль')
  }

  return response.json()
}
