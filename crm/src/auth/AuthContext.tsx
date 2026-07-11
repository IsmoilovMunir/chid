import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as apiLogin } from '../api/client'
import type { AuthUser } from '../types/crm'
import { clearAuth, getStoredToken, getStoredUser, storeAuth } from './storage'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  const token = getStoredToken()
  const raw = getStoredUser()
  if (!token || !raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthUser
    return { ...parsed, token }
  } catch {
    clearAuth()
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    const authUser: AuthUser = {
      token: response.token,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    }
    storeAuth(authUser.token, JSON.stringify({
      email: authUser.email,
      fullName: authUser.fullName,
      role: authUser.role,
    }))
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
