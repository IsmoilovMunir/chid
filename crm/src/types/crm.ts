import type { MortgageResponse } from './mortgage'

export type UserRole = 'ADMIN' | 'REALTOR'

export type ClientSource = 'SEARCH' | 'CALL' | 'REFERRAL' | 'WEBSITE' | 'OTHER'

export type ClientStatus = 'NEW' | 'IN_PROGRESS' | 'THINKING' | 'REJECTED' | 'DEAL'

export type CalculationMode = 'PAYMENT' | 'TERM' | 'AMOUNT'

export type PaymentType = 'ANNUITY' | 'DIFFERENTIATED'

export interface AuthUser {
  token: string
  email: string
  fullName: string
  role: UserRole
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
}

export interface CalculationDetail extends CalculationSummary {
  comment: string | null
  result: MortgageResponse
}