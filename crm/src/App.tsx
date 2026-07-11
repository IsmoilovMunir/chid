import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { DashboardLayout } from './layout/DashboardLayout'
import { LoginPage } from './pages/LoginPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientFormPage } from './pages/ClientFormPage'
import { CalculationsPage } from './pages/CalculationsPage'
import { NewCalculationPage } from './pages/NewCalculationPage'
import { CalculationDetailPage } from './pages/CalculationDetailPage'
import { EditCalculationPage } from './pages/EditCalculationPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/clients" replace />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/new" element={<ClientFormPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients/:id/edit" element={<ClientFormPage />} />
            <Route path="calculations" element={<CalculationsPage />} />
            <Route path="calculations/new" element={<NewCalculationPage />} />
            <Route path="calculations/:id/edit" element={<EditCalculationPage />} />
            <Route path="calculations/:id" element={<CalculationDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
