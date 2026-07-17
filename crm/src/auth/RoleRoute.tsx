import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/clients" replace />
  }

  return children
}

export function RealtorRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  return children
}
