import type { MortgageResponse } from './mortgage'

export type UserRole = 'ADMIN' | 'REALTOR'

export type ClientSource = 'SEARCH' | 'CALL' | 'REFERRAL' | 'WEBSITE' | 'OTHER'

export type ClientStatus = 'NEW' | 'IN_PROGRESS' | 'THINKING' | 'REJECTED' | 'DEAL'

export type CalculationMode = 'PAYMENT' | 'TERM' | 'AMOUNT'

export type PaymentType = 'ANNUITY' | 'DIFFERENTIATED'

export interface AuthUser {
  id: number
  token: string
  email: string
  fullName: string
  role: UserRole
  realtor: boolean
  broker: boolean
}

export interface Client {
  id: number
  fullName: string
  phone: string
  email: string | null
  source: ClientSource
  status: ClientStatus
  comment: string | null
  assignedUserId: number
  assignedUserName: string
  brokerUserId: number | null
  brokerName: string | null
  createdAt: string
  updatedAt: string | null
}

export interface ClientRequest {
  fullName: string
  phone: string
  email?: string
  source: ClientSource
  status: ClientStatus
  comment?: string
  assignedUserId?: number
  brokerUserId?: number | null
}

export interface CalculationSummary {
  id: number
  clientId: number | null
  clientName: string | null
  title: string | null
  propertyUrl: string | null
  mode: CalculationMode
  paymentType: PaymentType
  loanAmount: number
  termMonths: number
  interestRate: number
  resultMonthlyPayment: number | null
  resultOverpayment: number | null
  publicToken: string | null
  createdAt: string
  brokerUserId: number | null
  brokerName: string | null
}

export interface CalculationDetail extends CalculationSummary {
  comment: string | null
  result: MortgageResponse
}

export interface AdminDashboard {
  clientsCount: number
  calculationsCount: number
  leadsCount: number
  realtorsCount: number
}

export interface RealtorUser {
  id: number
  fullName: string
  phone: string | null
  email: string
  createdAt: string
  active: boolean
  realtor: boolean
  broker: boolean
  clientsCount: number
}

export interface RealtorAccessRequest {
  active: boolean
  reassignToUserId?: number
}

export interface CreateRealtorRequest {
  fullName: string
  phone: string
  email: string
  password: string
  realtor: boolean
  broker: boolean
}

export interface UpdateRealtorRequest {
  fullName: string
  phone: string
  email: string
  password?: string
  realtor: boolean
  broker: boolean
}