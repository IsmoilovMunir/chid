import type { MortgageRequest } from '../types/mortgage'
import type {
  AdminDashboard,
  AuthUser,
  CalculationDetail,
  CalculationSummary,
  Client,
  ClientRequest,
  CreateRealtorRequest,
  RealtorUser,
  RealtorAccessRequest,
  UpdateRealtorRequest,
} from '../types/crm'
import { getStoredToken, clearAuth } from '../auth/storage'

const API_BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = typeof error.error === 'string' ? error.error : 'Ошибка запроса'
    // 401 — нет/просрочен токен; 403 на API — нет роли или сессия уже недействительна
    if (response.status === 401 || response.status === 403) {
      clearAuth()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = typeof error.error === 'string' ? error.error : 'Неверный email или пароль'
    throw new Error(message)
  }

  return response.json()
}

export async function fetchMe(): Promise<Omit<AuthUser, 'token'>> {
  return request<Omit<AuthUser, 'token'>>('/me')
}

export async function fetchClients(search?: string): Promise<Client[]> {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return request<Client[]>(`/clients${query}`)
}

export async function fetchClient(id: number): Promise<Client> {
  return request<Client>(`/clients/${id}`)
}

export async function fetchClientCalculations(clientId: number): Promise<CalculationSummary[]> {
  return request<CalculationSummary[]>(`/clients/${clientId}/calculations`)
}

export async function createClient(data: ClientRequest): Promise<Client> {
  return request<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateClient(id: number, data: ClientRequest): Promise<Client> {
  return request<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchCalculations(): Promise<CalculationSummary[]> {
  return request<CalculationSummary[]>('/calculations')
}

export async function fetchCalculation(id: number): Promise<CalculationDetail> {
  return request<CalculationDetail>(`/calculations/${id}`)
}

export async function saveCalculation(data: {
  calculation: MortgageRequest
  clientId?: number
  title?: string
  propertyUrl?: string
  comment?: string
  baseLoanAmount?: number
  discountAmount?: number
  discountPercent?: number
}): Promise<CalculationSummary> {
  return request<CalculationSummary>('/calculations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCalculation(
  id: number,
  data: {
    calculation: MortgageRequest
    clientId?: number
    title?: string
    propertyUrl?: string
    comment?: string
    baseLoanAmount?: number
    discountAmount?: number
    discountPercent?: number
  },
): Promise<CalculationSummary> {
  return request<CalculationSummary>(`/calculations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export interface PropertyImportResult {
  title: string | null
  propertyPrice: number | null
  address: string | null
  source: string | null
  blocked: boolean
  message: string | null
}

export async function importPropertyListing(data: {
  url?: string
  text?: string
}): Promise<PropertyImportResult> {
  return request<PropertyImportResult>('/property/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return request<AdminDashboard>('/admin/dashboard')
}

export async function fetchRealtors(activeOnly?: boolean): Promise<RealtorUser[]> {
  const query = activeOnly ? '?activeOnly=true' : ''
  return request<RealtorUser[]>(`/admin/realtors${query}`)
}

export async function fetchBrokers(): Promise<RealtorUser[]> {
  return request<RealtorUser[]>('/brokers')
}

export async function updateRealtorAccess(
  id: number,
  data: RealtorAccessRequest,
): Promise<RealtorUser> {
  return request<RealtorUser>(`/admin/realtors/${id}/access`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createRealtor(data: CreateRealtorRequest): Promise<RealtorUser> {
  return request<RealtorUser>('/admin/realtors', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRealtor(id: number, data: UpdateRealtorRequest): Promise<RealtorUser> {
  return request<RealtorUser>(`/admin/realtors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchRealtorClients(id: number): Promise<Client[]> {
  return request<Client[]>(`/admin/realtors/${id}/clients`)
}

export async function deleteRealtor(
  id: number,
  reassignments: { clientId: number; assignToUserId: number }[] = [],
): Promise<void> {
  return request<void>(`/admin/realtors/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reassignments }),
  })
}

export async function calculateMortgage(request: MortgageRequest) {
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
