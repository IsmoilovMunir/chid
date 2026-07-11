import { useEffect, useMemo, useState } from 'react'
import type { CalculationMode, MortgageRequest, MortgageResponse, PaymentType } from '../types/mortgage'
import { calculateMortgage } from '../api/client'
import { formatMoney, formatMoneyExact } from '../types/mortgage'
import {
  computeLoanAmount,
  downPaymentInPercent,
  downPaymentInRubles,
  formatRublesHint,
  parseAmount,
  percentToRubles,
  rublesToPercent,
  sanitizePercentInput,
} from '../utils/loanAmount'
import { MoneyInput } from './MoneyInput'
import { AmountSlider } from './AmountSlider'
import { DownPaymentSlider, DOWN_PAYMENT_PERCENT_MIN } from './DownPaymentSlider'
import { UnitToggle } from './UnitToggle'
import { PaymentAnalytics } from './PaymentAnalytics'
import { ScheduleTable } from './ScheduleTable'
import { SaveCalculationPanel } from './SaveCalculationPanel'
import { PropertyImportPanel } from './PropertyImportPanel'
import { mortgageResponseToForm } from '../utils/calculationForm'
import { applyLoanDiscount, discountFromApi, discountToApi, hasLoanDiscount } from '../utils/discount'
import { DiscountFields } from './DiscountFields'
import { DiscountSummary } from './DiscountSummary'

const MODE_LABELS: Record<CalculationMode, string> = {
  PAYMENT: 'Платёж',
  TERM: 'Срок',
  AMOUNT: 'Сумма',
}

type FieldKey =
  | 'propertyPrice'
  | 'downPayment'
  | 'termYears'
  | 'interestRate'
  | 'loanAmount'
  | 'monthlyPayment'

type FieldErrors = Partial<Record<FieldKey, string>>

export function CrmMortgageCalculator({
  defaultClientId,
  calculationId,
  initialResult,
  defaultTitle,
  defaultPropertyUrl,
  defaultComment,
  defaultDiscountValue = '',
  defaultDiscountType = 'AMOUNT' as const,
  isEdit = false,
  onSaved,
}: {
  defaultClientId?: number
  calculationId?: number
  initialResult?: MortgageResponse
  defaultTitle?: string
  defaultPropertyUrl?: string
  defaultComment?: string
  defaultDiscountValue?: string
  defaultDiscountType?: 'AMOUNT' | 'PERCENT'
  isEdit?: boolean
  onSaved?: (id: number) => void
}) {
  const [mode, setMode] = useState<CalculationMode>('PAYMENT')
  const [paymentType, setPaymentType] = useState<PaymentType>('ANNUITY')
  const [propertyPrice, setPropertyPrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [downPaymentType, setDownPaymentType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT')
  const [loanAmount, setLoanAmount] = useState('')
  const [termYears, setTermYears] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [discountValue, setDiscountValue] = useState(defaultDiscountValue)
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>(defaultDiscountType)
  const [listingTitle, setListingTitle] = useState(defaultTitle ?? '')
  const [propertyUrl, setPropertyUrl] = useState(defaultPropertyUrl ?? '')
  const [result, setResult] = useState<MortgageResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fixedFields, setFixedFields] = useState<Set<FieldKey>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!initialResult) return
    const form = mortgageResponseToForm(initialResult)
    setMode(form.mode)
    setPaymentType(form.paymentType)
    setPropertyPrice(form.propertyPrice)
    setDownPayment(form.downPayment)
    setDownPaymentType(form.downPaymentType)
    setLoanAmount(form.loanAmount)
    setTermYears(form.termYears)
    setMonthlyPayment(form.monthlyPayment)
    setInterestRate(form.interestRate)
    const restored = discountFromApi(initialResult.discountAmount, initialResult.discountPercent)
    setDiscountValue(restored.value || defaultDiscountValue)
    setDiscountType(restored.type || defaultDiscountType)
    setResult(initialResult)
  }, [initialResult, defaultDiscountValue, defaultDiscountType])

  useEffect(() => {
    if (defaultTitle != null) setListingTitle(defaultTitle)
  }, [defaultTitle])

  useEffect(() => {
    if (defaultPropertyUrl != null) setPropertyUrl(defaultPropertyUrl)
  }, [defaultPropertyUrl])

  useEffect(() => {
    if (mode === 'PAYMENT') {
      setLoanAmount(computeLoanAmount(propertyPrice, downPayment, downPaymentType))
    }
  }, [mode, propertyPrice, downPayment, downPaymentType])

  useEffect(() => {
    if (isEdit || mode !== 'PAYMENT') return

    const price = parseAmount(propertyPrice)
    if (price <= 0) {
      setDownPayment('')
      return
    }

    if (downPaymentType === 'PERCENT') {
      setDownPayment(String(DOWN_PAYMENT_PERCENT_MIN))
    } else {
      setDownPayment(String(Math.round((price * DOWN_PAYMENT_PERCENT_MIN) / 100)))
    }
  }, [propertyPrice, downPaymentType, mode, isEdit])

  const downPaymentRub = downPaymentInRubles(propertyPrice, downPayment, downPaymentType)
  const downPaymentPct = downPaymentInPercent(propertyPrice, downPayment, downPaymentType)

  const getBaseLoanAmount = (): number => {
    if (mode === 'PAYMENT') {
      const computed = computeLoanAmount(propertyPrice, downPayment, downPaymentType)
      return computed ? parseAmount(computed) : 0
    }
    if (mode === 'TERM') {
      return parseAmount(loanAmount)
    }
    return 0
  }

  const baseLoanAmount = getBaseLoanAmount()
  const effectiveLoanAmount = applyLoanDiscount(baseLoanAmount, discountValue, discountType)
  const showDiscountFields = mode === 'PAYMENT' || mode === 'TERM'
  const hasDiscount = hasLoanDiscount(discountValue, discountType)
  const displayedLoanAmount =
    mode === 'PAYMENT' && baseLoanAmount > 0 ? String(effectiveLoanAmount) : loanAmount

  const getDownPaymentLogicError = (): string => {
    if (mode !== 'PAYMENT' || parseAmount(propertyPrice) <= 0) return ''
    if (downPaymentRub > parseAmount(propertyPrice)) {
      return 'Первоначальный взнос не может быть больше стоимости'
    }
    if (downPaymentPct > 100) return 'Процент не может быть больше 100'
    if (downPaymentPct > 0 && downPaymentPct < 20) return 'Минимальный первоначальный взнос — 20%'
    return ''
  }

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const downPaymentLogicError = getDownPaymentLogicError()

    if (mode === 'PAYMENT') {
      if (!propertyPrice || parseAmount(propertyPrice) <= 0) {
        errors.propertyPrice = 'Укажите стоимость недвижимости'
      }
      if (!downPayment || parseAmount(downPayment) <= 0) {
        errors.downPayment = 'Укажите первоначальный взнос'
      } else if (downPaymentLogicError) {
        errors.downPayment = downPaymentLogicError
      }
      const computed = computeLoanAmount(propertyPrice, downPayment, downPaymentType)
      if (!errors.propertyPrice && !errors.downPayment && (!computed || parseAmount(computed) <= 0)) {
        errors.loanAmount = 'Сумма кредита должна быть больше 0'
      } else if (
        !errors.propertyPrice &&
        !errors.downPayment &&
        effectiveLoanAmount <= 0 &&
        baseLoanAmount > 0
      ) {
        errors.loanAmount = 'Сумма кредита со скидкой должна быть больше 0'
      }
      if (!termYears || Number(termYears) <= 0) {
        errors.termYears = 'Укажите срок кредита'
      }
    }

    if (mode === 'TERM') {
      if (!loanAmount || parseAmount(loanAmount) <= 0) {
        errors.loanAmount = 'Укажите сумму кредита'
      } else if (effectiveLoanAmount <= 0) {
        errors.loanAmount = 'Сумма кредита со скидкой должна быть больше 0'
      }
      if (!monthlyPayment || parseAmount(monthlyPayment) <= 0) {
        errors.monthlyPayment = 'Укажите ежемесячный платёж'
      }
    }

    if (mode === 'AMOUNT') {
      if (!monthlyPayment || parseAmount(monthlyPayment) <= 0) {
        errors.monthlyPayment = 'Укажите ежемесячный платёж'
      }
      if (!termYears || Number(termYears) <= 0) {
        errors.termYears = 'Укажите срок кредита'
      }
    }

    if (!interestRate || Number(interestRate) <= 0) {
      errors.interestRate = 'Укажите процентную ставку'
    }

    return errors
  }

  const isFormValid = useMemo(() => Object.keys(validate()).length === 0, [
    mode,
    propertyPrice,
    downPayment,
    downPaymentType,
    loanAmount,
    termYears,
    monthlyPayment,
    interestRate,
  ])

  const markFieldFixed = (field: FieldKey) => {
    setFixedFields((prev) => new Set(prev).add(field))
    window.setTimeout(() => {
      setFixedFields((prev) => {
        const next = new Set(prev)
        next.delete(field)
        return next
      })
    }, 650)
  }

  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      markFieldFixed(field)
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handlePropertyImported = (data: {
    title?: string
    propertyPrice?: number
    propertyUrl?: string
    address?: string
  }) => {
    if (data.propertyPrice != null && data.propertyPrice > 0) {
      setPropertyPrice(String(Math.round(data.propertyPrice)))
      clearFieldError('propertyPrice')
    }
    if (data.title) {
      const nextTitle =
        data.address && !data.title.includes(data.address)
          ? `${data.title}, ${data.address}`
          : data.title
      setListingTitle(nextTitle)
    } else if (data.address) {
      setListingTitle(data.address)
    }
    if (data.propertyUrl) {
      setPropertyUrl(data.propertyUrl)
    }
  }

  useEffect(() => {
    if (!submitted) return

    const currentErrors = validate()

    setFieldErrors((prev) => {
      let changed = false
      const next = { ...prev }

      for (const field of Object.keys(prev) as FieldKey[]) {
        if (!currentErrors[field]) {
          markFieldFixed(field)
          delete next[field]
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [
    submitted,
    mode,
    propertyPrice,
    downPayment,
    downPaymentType,
    loanAmount,
    termYears,
    monthlyPayment,
    interestRate,
  ])

  const buildRequest = (): MortgageRequest => {
    const termMonths = Number(termYears) * 12

    if (mode === 'PAYMENT') {
      const computedLoan = computeLoanAmount(propertyPrice, downPayment, downPaymentType)
      const loanForCalc = effectiveLoanAmount > 0 ? effectiveLoanAmount : parseAmount(computedLoan || '')
      return {
        mode,
        propertyPrice: parseAmount(propertyPrice),
        downPayment: parseAmount(downPayment),
        downPaymentType,
        termMonths,
        interestRate: Number(interestRate),
        paymentType,
        ...(loanForCalc > 0 ? { loanAmount: loanForCalc } : {}),
      }
    }

    if (mode === 'TERM') {
      const loanForCalc = effectiveLoanAmount > 0 ? effectiveLoanAmount : parseAmount(loanAmount)
      return {
        mode,
        loanAmount: loanForCalc,
        monthlyPayment: parseAmount(monthlyPayment),
        interestRate: Number(interestRate),
        paymentType,
      }
    }

    return {
      mode,
      monthlyPayment: parseAmount(monthlyPayment),
      termMonths,
      interestRate: Number(interestRate),
      paymentType,
    }
  }

  const handleCalculate = async () => {
    setSubmitted(true)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    setApiError('')

    try {
      const data = await calculateMortgage(buildRequest())
      const apiDiscount = discountToApi(discountValue, discountType)
      setResult({
        ...data,
        baseLoanAmount: baseLoanAmount > 0 ? baseLoanAmount : data.loanAmount,
        discountAmount: apiDiscount.discountAmount ?? 0,
        discountPercent: apiDiscount.discountPercent ?? 0,
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Ошибка расчёта')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownPaymentTypeChange = (type: 'AMOUNT' | 'PERCENT') => {
    if (type === downPaymentType) return

    if (type === 'PERCENT') {
      setDownPayment(rublesToPercent(downPayment, propertyPrice))
    } else {
      setDownPayment(percentToRubles(downPayment, propertyPrice))
    }
    setDownPaymentType(type)
    clearFieldError('downPayment')
  }

  const handleClear = () => {
    setPropertyPrice('')
    setDownPayment('')
    setDownPaymentType('AMOUNT')
    setLoanAmount('')
    setTermYears('')
    setMonthlyPayment('')
    setInterestRate('')
    setDiscountValue('')
    setDiscountType('AMOUNT')
    setPaymentType('ANNUITY')
    setListingTitle('')
    setPropertyUrl('')
    setResult(null)
    setFieldErrors({})
    setFixedFields(new Set())
    setSubmitted(false)
    setApiError('')
  }

  const showError = (field: FieldKey) => submitted && fieldErrors[field]

  const inputClass = (field: FieldKey, extra = 'input') => {
    if (showError(field)) return `${extra} input-error`
    if (fixedFields.has(field)) return `${extra} input-valid`
    return extra
  }

  return (
    <div className="space-y-8">
      <PropertyImportPanel
        propertyUrl={propertyUrl}
        onPropertyUrlChange={setPropertyUrl}
        onImported={handlePropertyImported}
      />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODE_LABELS) as CalculationMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setFieldErrors({})
              setFixedFields(new Set())
              setSubmitted(false)
              setResult(null)
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === m
                ? 'bg-chid-btn text-white'
                : 'bg-chid-white text-chid-text ring-1 ring-chid-ring/50 hover:bg-chid-accent-muted'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40 md:grid-cols-2">
        {mode === 'PAYMENT' && (
          <>
            <Field label="Стоимость недвижимости, ₽" error={showError('propertyPrice')}>
              <MoneyInput
                value={propertyPrice}
                onChange={(v) => {
                  setPropertyPrice(v)
                  clearFieldError('propertyPrice')
                }}
                placeholder="5 000 000"
                hasError={!!showError('propertyPrice')}
                isFixed={fixedFields.has('propertyPrice')}
              />
              <AmountSlider
                value={propertyPrice}
                onChange={(v) => {
                  setPropertyPrice(v)
                  clearFieldError('propertyPrice')
                }}
              />
            </Field>
            <Field
              label={downPaymentType === 'PERCENT' ? 'Первоначальный взнос, %' : 'Первоначальный взнос, ₽'}
              error={showError('downPayment')}
            >
              <div className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1">
                  {downPaymentType === 'PERCENT' ? (
                    <input
                      className={inputClass('downPayment')}
                      type="text"
                      inputMode="decimal"
                      value={downPayment}
                      placeholder="20"
                      onChange={(e) => {
                        setDownPayment(sanitizePercentInput(e.target.value))
                        clearFieldError('downPayment')
                      }}
                    />
                  ) : (
                    <MoneyInput
                      className={inputClass('downPayment')}
                      value={downPayment}
                      onChange={(v) => {
                        setDownPayment(v)
                        clearFieldError('downPayment')
                      }}
                      placeholder="1 000 000"
                      hasError={!!showError('downPayment')}
                      isFixed={fixedFields.has('downPayment')}
                    />
                  )}
                </div>
                <UnitToggle value={downPaymentType} onChange={handleDownPaymentTypeChange} />
              </div>
              {parseAmount(propertyPrice) > 0 && parseAmount(downPayment) > 0 && !showError('downPayment') && (
                <span className="text-xs text-chid-text/35">
                  {downPaymentType === 'PERCENT'
                    ? `= ${formatRublesHint(String(downPaymentRub))}`
                    : `= ${downPaymentPct} % от стоимости`}
                </span>
              )}
              <DownPaymentSlider
                propertyPrice={propertyPrice}
                value={downPayment}
                downPaymentType={downPaymentType}
                onChange={(v) => {
                  setDownPayment(v)
                  clearFieldError('downPayment')
                }}
              />
            </Field>
            <Field label="Сумма кредита, ₽" error={showError('loanAmount')}>
              <MoneyInput
                className={`input bg-chid-accent-muted/50 text-chid-text${hasDiscount && mode === 'PAYMENT' ? ' ring-2 ring-chid-btn/30' : ''}`}
                value={displayedLoanAmount}
                onChange={() => {}}
                readOnly
                placeholder="Считается автоматически"
              />
              {!showError('loanAmount') && (
                <span className="text-xs text-chid-text/35">
                  {hasDiscount && mode === 'PAYMENT'
                    ? `С учётом скидки (без скидки: ${formatRublesHint(loanAmount)})`
                    : 'Стоимость недвижимости − первоначальный взнос'}
                </span>
              )}
            </Field>
            {showDiscountFields && baseLoanAmount > 0 && (
              <DiscountFields
                discountValue={discountValue}
                discountType={discountType}
                baseLoanAmount={baseLoanAmount}
                onValueChange={setDiscountValue}
                onTypeChange={setDiscountType}
              />
            )}
            <Field label="Срок кредита, лет" error={showError('termYears')}>
              <input
                className={inputClass('termYears')}
                value={termYears}
                onChange={(e) => {
                  setTermYears(e.target.value.replace(/\D/g, ''))
                  clearFieldError('termYears')
                }}
                placeholder="20"
                inputMode="numeric"
              />
            </Field>
          </>
        )}

        {mode === 'TERM' && (
          <>
            <Field label="Сумма кредита, ₽" error={showError('loanAmount')}>
              <MoneyInput
                value={loanAmount}
                onChange={(v) => {
                  setLoanAmount(v)
                  clearFieldError('loanAmount')
                }}
                placeholder="4 000 000"
                hasError={!!showError('loanAmount')}
                isFixed={fixedFields.has('loanAmount')}
              />
              {hasDiscount && baseLoanAmount > 0 && !showError('loanAmount') && (
                <span className="text-xs text-chid-text/35">
                  С учётом скидки: {formatRublesHint(String(effectiveLoanAmount))}
                </span>
              )}
            </Field>
            {showDiscountFields && baseLoanAmount > 0 && (
              <DiscountFields
                discountValue={discountValue}
                discountType={discountType}
                baseLoanAmount={baseLoanAmount}
                onValueChange={setDiscountValue}
                onTypeChange={setDiscountType}
              />
            )}
            <Field label="Ежемесячный платёж, ₽" error={showError('monthlyPayment')}>
              <MoneyInput
                value={monthlyPayment}
                onChange={(v) => {
                  setMonthlyPayment(v)
                  clearFieldError('monthlyPayment')
                }}
                placeholder="40 000"
                hasError={!!showError('monthlyPayment')}
                isFixed={fixedFields.has('monthlyPayment')}
              />
            </Field>
          </>
        )}

        {mode === 'AMOUNT' && (
          <>
            <Field label="Ежемесячный платёж, ₽" error={showError('monthlyPayment')}>
              <MoneyInput
                value={monthlyPayment}
                onChange={(v) => {
                  setMonthlyPayment(v)
                  clearFieldError('monthlyPayment')
                }}
                placeholder="40 000"
                hasError={!!showError('monthlyPayment')}
                isFixed={fixedFields.has('monthlyPayment')}
              />
            </Field>
            <Field label="Срок кредита, лет" error={showError('termYears')}>
              <input
                className={inputClass('termYears')}
                value={termYears}
                onChange={(e) => {
                  setTermYears(e.target.value.replace(/\D/g, ''))
                  clearFieldError('termYears')
                }}
                placeholder="20"
                inputMode="numeric"
              />
            </Field>
          </>
        )}

        <Field label="Процентная ставка, %" error={showError('interestRate')}>
          <input
            className={inputClass('interestRate')}
            value={interestRate}
            onChange={(e) => {
              setInterestRate(sanitizePercentInput(e.target.value))
              clearFieldError('interestRate')
            }}
            placeholder="12"
            inputMode="decimal"
          />
        </Field>

        <Field label="Тип платежа">
          <select
            className="input-select"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          >
            <option value="ANNUITY">Аннуитетный</option>
            <option value="DIFFERENTIATED">Дифференцированный</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading}
          className={`rounded-lg bg-chid-btn px-6 py-3 font-medium text-white hover:bg-chid-btn-hover disabled:cursor-not-allowed disabled:opacity-50 ${
            !isFormValid && !loading ? 'opacity-60' : ''
          }`}
        >
          {loading ? 'Считаем...' : 'Рассчитать'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg bg-chid-white px-6 py-3 font-medium text-chid-text ring-1 ring-chid-ring/50 hover:bg-chid-accent-muted"
        >
          Очистить
        </button>
      </div>

      {apiError && <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{apiError}</p>}

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard
              title="Ежемесячный платёж"
              value={formatMoneyExact(result.monthlyPayment ?? result.firstMonthlyPayment)}
            />
            <ResultCard title="Сумма кредита" value={formatMoney(result.loanAmount)} />
            <ResultCard title="Переплата" value={formatMoney(result.overpayment)} />
            <ResultCard title="Срок" value={`${Math.round(result.termMonths / 12)} лет`} />
          </div>

          {(result.discountAmount || result.discountPercent) && (
            <DiscountSummary
              baseLoanAmount={result.baseLoanAmount}
              discountAmount={result.discountAmount}
              discountPercent={result.discountPercent}
              loanAmount={result.loanAmount}
            />
          )}

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
          <SaveCalculationPanel
            request={buildRequest()}
            calculationId={calculationId}
            defaultClientId={defaultClientId}
            title={listingTitle}
            onTitleChange={setListingTitle}
            propertyUrl={propertyUrl}
            onPropertyUrlChange={setPropertyUrl}
            defaultComment={defaultComment}
            baseLoanAmount={baseLoanAmount}
            discountValue={discountValue}
            discountType={discountType}
            onSaved={(id) => onSaved?.(id)}
          />
        </div>
      )}

      <style>{`
        .input {
          box-sizing: border-box;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .input-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
        .input-valid {
          animation: input-fix-success 0.65s ease forwards;
        }
        @keyframes input-fix-success {
          0% {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
          }
          40% {
            border-color: #082f9b;
            box-shadow: 0 0 0 4px rgba(8, 47, 155, 0.22);
          }
          100% {
            border-color: #e2e8f0;
            box-shadow: none;
          }
        }
        .field-error-msg {
          animation: field-error-in 0.25s ease;
        }
        @keyframes field-error-in {
          from {
            opacity: 0;
            transform: translateY(-3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .input-select {
          box-sizing: border-box;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          outline: none;
          width: 100%;
        }
        .amount-slider-input {
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string | false
}) {
  return (
    <div className="block space-y-2">
      <span className="text-sm font-medium text-chid-text">{label}</span>
      {children}
      {error && <span className="field-error-msg text-xs text-red-600">{error}</span>}
    </div>
  )
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-chid-accent-muted p-4 ring-1 ring-chid-accent/40">
      <p className="text-sm text-chid-text/70">{title}</p>
      <p className="mt-1 text-xl font-semibold text-chid-text">{value}</p>
    </div>
  )
}
