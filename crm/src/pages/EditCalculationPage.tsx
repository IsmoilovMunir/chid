import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchCalculation } from '../api/client'
import type { CalculationDetail } from '../types/crm'
import { CrmMortgageCalculator } from '../components/CrmMortgageCalculator'
import { discountFromApi } from '../utils/discount'

export function EditCalculationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [calculation, setCalculation] = useState<CalculationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetchCalculation(Number(id))
      .then(setCalculation)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-chid-text/60">Загрузка…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!calculation) return null

  const restoredDiscount = discountFromApi(
    calculation.result.discountAmount,
    calculation.result.discountPercent,
  )

  return (
    <div>
      <Link to={`/calculations/${calculation.id}`} className="text-sm text-chid-btn hover:underline">
        ← К расчёту
      </Link>

      <h1 className="mt-4 mb-2 text-2xl font-bold text-chid-text">Изменить расчёт</h1>
      <p className="mb-6 text-sm text-chid-text/60">
        {calculation.clientName
          ? `Клиент: ${calculation.clientName}`
          : 'Обновите параметры и сохраните изменения'}
      </p>

      <CrmMortgageCalculator
        isEdit
        calculationId={calculation.id}
        initialResult={calculation.result}
        defaultClientId={calculation.clientId ?? undefined}
        defaultTitle={calculation.title ?? ''}
        defaultPropertyUrl={calculation.propertyUrl ?? ''}
        defaultComment={calculation.comment ?? ''}
        defaultDiscountValue={restoredDiscount.value}
        defaultDiscountType={restoredDiscount.type}
        onSaved={(savedId) => navigate(`/calculations/${savedId}`)}
      />
    </div>
  )
}
