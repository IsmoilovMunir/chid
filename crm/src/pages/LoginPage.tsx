import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ChidLogo } from '../components/ChidLogo'
import { useAuth } from '../auth/AuthContext'

function defaultPathForRole(role?: string): string {
  return role === 'ADMIN' ? '/admin' : '/clients'
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  if (isAuthenticated) {
    return <Navigate to={from ?? defaultPathForRole(user?.role)} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authUser = await login(email, password)
      const target =
        from && !(from.startsWith('/admin') && authUser.role !== 'ADMIN')
          ? from
          : defaultPathForRole(authUser.role)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-chid-white p-8 shadow-sm ring-1 ring-chid-ring/40">
        <div className="mb-8 flex justify-center">
          <ChidLogo className="h-12 w-auto" />
        </div>

        <h1 className="text-center text-2xl font-bold text-chid-text">CRM CHID</h1>
        <p className="mt-2 text-center text-sm text-chid-text/60">
          Вход для риелторов и администраторов
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-chid-text">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chid.ru"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-chid-text">Пароль</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-chid-btn py-3 font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
