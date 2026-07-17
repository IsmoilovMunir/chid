import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login as apiLogin } from '../api/client'
import type { AuthUser } from '../types/crm'
import { clearAuth, getStoredToken, getStoredUser, storeAuth } from './storage'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toStoredUser(user: Pick<AuthUser, 'id' | 'email' | 'fullName' | 'role' | 'realtor' | 'broker'>) {
  return JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    realtor: user.realtor,
    broker: user.broker,
  })
}

function loadUser(): AuthUser | null {
  const token = getStoredToken()
  const raw = getStoredUser()
  if (!token || !raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (!parsed.email || !parsed.fullName || !parsed.role) {
      clearAuth()
      return null
    }
    return {
      id: typeof parsed.id === 'number' ? parsed.id : 0,
      token,
      email: parsed.email,
      fullName: parsed.fullName,
      role: parsed.role,
      realtor: parsed.realtor ?? parsed.role !== 'ADMIN',
      broker: parsed.broker ?? false,
    }
  } catch {
    clearAuth()
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  useEffect(() => {
    if (!user?.token || user.id > 0) return

    let cancelled = false
    fetchMe()
      .then((profile) => {
        if (cancelled || !profile.id) return
        const next: AuthUser = {
          id: profile.id,
          token: user.token,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
          realtor: profile.realtor ?? profile.role !== 'ADMIN',
          broker: profile.broker ?? false,
        }
        storeAuth(next.token, toStoredUser(next))
        setUser(next)
      })
      .catch(() => {
        // keep local session; 401/403 already clears auth in request()
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    const authUser: AuthUser = {
      id: response.id,
      token: response.token,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      realtor: response.realtor ?? response.role !== 'ADMIN',
      broker: response.broker ?? false,
    }
    storeAuth(authUser.token, toStoredUser(authUser))
    setUser(authUser)
    return authUser
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
