import { useNavigate, useSearchParams } from 'react-router-dom'
import { CrmMortgageCalculator } from '../components/CrmMortgageCalculator'
import { useCrmPaths } from '../hooks/useCrmPaths'

export function NewCalculationPage() {
  const navigate = useNavigate()
  const paths = useCrmPaths()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-chid-text">Новый расчёт</h1>
      <p className="mb-6 text-sm text-chid-text/60">Рассчитайте ипотеку и сохраните в CRM</p>
      <CrmMortgageCalculator
        defaultClientId={clientId ? Number(clientId) : undefined}
        onSaved={(id) => navigate(paths.calculation(id))}
      />
    </div>
  )
}
