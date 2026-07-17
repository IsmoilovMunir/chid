import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export function useCrmPaths() {
  const { pathname } = useLocation()
  const base = pathname.startsWith('/admin/crm') ? '/admin/crm' : ''

  return useMemo(
    () => ({
      clients: `${base}/clients`,
      clientsNew: `${base}/clients/new`,
      client: (id: number | string) => `${base}/clients/${id}`,
      clientEdit: (id: number | string) => `${base}/clients/${id}/edit`,
      calculations: `${base}/calculations`,
      calculationsNew: (clientId?: number | string) =>
        clientId != null
          ? `${base}/calculations/new?clientId=${clientId}`
          : `${base}/calculations/new`,
      calculation: (id: number | string) => `${base}/calculations/${id}`,
      calculationEdit: (id: number | string) => `${base}/calculations/${id}/edit`,
    }),
    [base],
  )
}
