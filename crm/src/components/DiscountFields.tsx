import { MoneyInput } from './MoneyInput'
import { UnitToggle } from './UnitToggle'
import { DiscountSummary } from './DiscountSummary'
import { applyLoanDiscount, discountToApi, type DiscountUnit } from '../utils/discount'
import { sanitizePercentInput } from '../utils/loanAmount'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block space-y-2">
      <span className="text-sm font-medium text-chid-text">{label}</span>
      {children}
    </div>
  )
}

interface DiscountFieldsProps {
  discountValue: string
  discountType: DiscountUnit
  baseLoanAmount: number
  onValueChange: (value: string) => void
  onTypeChange: (type: DiscountUnit) => void
}

export function DiscountFields({
  discountValue,
  discountType,
  baseLoanAmount,
  onValueChange,
  onTypeChange,
}: DiscountFieldsProps) {
  const effectiveLoanAmount = applyLoanDiscount(baseLoanAmount, discountValue, discountType)
  const apiDiscount = discountToApi(discountValue, discountType)
  const hasDiscount =
    (apiDiscount.discountAmount ?? 0) > 0 || (apiDiscount.discountPercent ?? 0) > 0

  const handleTypeChange = (type: DiscountUnit) => {
    if (type === discountType) return
    onTypeChange(type)
    onValueChange('')
  }

  return (
    <div className="md:col-span-2 rounded-xl bg-chid-accent-muted/70 p-4 ring-1 ring-chid-ring/40">
      <p className="text-sm font-medium text-chid-text">Скидка по договору с ЖК</p>
      <p className="mt-1 text-xs text-chid-text/50">Клиент увидит скидку на публичной ссылке</p>

      <div className="mt-3">
        <Field label={discountType === 'PERCENT' ? 'Скидка, %' : 'Скидка, ₽'}>
          <div className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1">
              {discountType === 'PERCENT' ? (
                <input
                  className="input"
                  value={discountValue}
                  onChange={(e) => onValueChange(sanitizePercentInput(e.target.value))}
                  placeholder="0"
                  inputMode="decimal"
                />
              ) : (
                <MoneyInput value={discountValue} onChange={onValueChange} placeholder="0" />
              )}
            </div>
            <UnitToggle value={discountType} onChange={handleTypeChange} />
          </div>
        </Field>
      </div>

      {hasDiscount && (
        <div className="mt-3">
          <DiscountSummary
            baseLoanAmount={baseLoanAmount}
            discountAmount={apiDiscount.discountAmount ?? 0}
            discountPercent={apiDiscount.discountPercent ?? 0}
            loanAmount={effectiveLoanAmount}
          />
        </div>
      )}
    </div>
  )
}
