import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AdminRoute, RealtorRoute } from './auth/RoleRoute'
import { DashboardLayout } from './layout/DashboardLayout'
import { AdminLayout } from './layout/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientFormPage } from './pages/ClientFormPage'
import { CalculationsPage } from './pages/CalculationsPage'
import { NewCalculationPage } from './pages/NewCalculationPage'
import { CalculationDetailPage } from './pages/CalculationDetailPage'
import { EditCalculationPage } from './pages/EditCalculationPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminRealtorsPage } from './pages/admin/AdminRealtorsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="realtors" element={<AdminRealtorsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="crm/clients" element={<ClientsPage />} />
            <Route path="crm/clients/new" element={<ClientFormPage />} />
            <Route path="crm/clients/:id" element={<ClientDetailPage />} />
            <Route path="crm/clients/:id/edit" element={<ClientFormPage />} />
            <Route path="crm/calculations" element={<CalculationsPage />} />
            <Route path="crm/calculations/new" element={<NewCalculationPage />} />
            <Route path="crm/calculations/:id/edit" element={<EditCalculationPage />} />
            <Route path="crm/calculations/:id" element={<CalculationDetailPage />} />
          </Route>

          <Route
            element={
              <RealtorRoute>
                <DashboardLayout />
              </RealtorRoute>
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
