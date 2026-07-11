import { useEffect, useState } from 'react'
import { ChidLogo } from '../components/ChidLogo'
import { fetchPublicCalculation } from '../api/client'
import type { PublicCalculation } from '../api/client'
import { formatMoney, formatMoneyExact } from '../types/mortgage'
import { PaymentAnalytics } from '../components/PaymentAnalytics'
import { ScheduleTable } from '../components/ScheduleTable'
import { LeadForm } from '../components/LeadForm'
import { DiscountSummary } from '../components/DiscountSummary'

interface PublicCalculationPageProps {
  token: string
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-chid-accent-muted p-4 ring-1 ring-chid-accent/40">
      <p className="text-sm text-chid-text/70">{title}</p>
      <p className="mt-1 text-xl font-semibold text-chid-text">{value}</p>
    </div>
  )
}

export function PublicCalculationPage({ token }: PublicCalculationPageProps) {
  const [data, setData] = useState<PublicCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPublicCalculation(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [token])

  const result = data?.result

  return (
    <div className="min-h-screen bg-chid-white">
      <header className="border-b border-chid-ring/40 bg-chid-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/">
            <ChidLogo className="h-14 w-auto md:h-16" />
          </a>
          <a href="/" className="text-sm font-medium text-chid-text/80 hover:text-chid-btn">
            Калькулятор
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-chid-text">
          {data?.clientName || 'Ипотечный расчёт'}
        </h1>
        {data?.title ? (
          <p className="mt-2 text-lg text-chid-text/80">Квартира: {data.title}</p>
        ) : result?.propertyPrice ? (
          <p className="mt-2 text-lg text-chid-text/80">
            Стоимость недвижимости: {formatMoney(result.propertyPrice)}
          </p>
        ) : (
          <p className="mt-2 text-chid-text/70">Расчёт подготовлен агентством CHID</p>
        )}
        {data?.propertyUrl && (
          <a
            href={data.propertyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-lg bg-chid-btn px-5 py-2.5 text-sm font-medium text-white hover:bg-chid-btn-hover"
          >
            Посмотреть квартиру
          </a>
        )}

        {loading && <p className="mt-8 text-chid-text/60">Загрузка…</p>}
        {error && <p className="mt-8 text-red-600">{error}</p>}

        {result && (
          <div className="mt-8 space-y-6">
            {(result.discountAmount || result.discountPercent) && (
              <DiscountSummary
                baseLoanAmount={result.baseLoanAmount}
                discountAmount={result.discountAmount}
                discountPercent={result.discountPercent}
                loanAmount={result.loanAmount}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ResultCard
                title="Ежемесячный платёж"
                value={formatMoneyExact(result.monthlyPayment ?? result.firstMonthlyPayment)}
              />
              <ResultCard title="Сумма кредита" value={formatMoney(result.loanAmount)} />
              <ResultCard title="Переплата" value={formatMoney(result.overpayment)} />
              <ResultCard title="Срок" value={`${Math.round(result.termMonths / 12)} лет`} />
            </div>

            {result.paymentType === 'DIFFERENTIATED' && (
              <p className="text-sm text-chid-text/70">
                Первый платёж: {formatMoneyExact(result.firstMonthlyPayment)}, последний:{' '}
                {formatMoneyExact(result.lastMonthlyPayment)}
              </p>
            )}

            <PaymentAnalytics
              schedule={result.schedule}
              totalPrincipal={result.loanAmount}
              totalInterest={result.totalInterest}
            />

            <ScheduleTable
              schedule={result.schedule}
              totalPayment={result.totalPayment}
              totalPrincipal={result.loanAmount}
              totalInterest={result.totalInterest}
            />

            <LeadForm />
          </div>
        )}
      </main>
    </div>
  )
}
