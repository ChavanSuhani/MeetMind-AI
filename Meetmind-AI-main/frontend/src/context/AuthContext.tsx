import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/types'
import { fetchCurrentUser, loginUser, registerUser } from '@/services/authService'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mm_access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('mm_access_token')
        localStorage.removeItem('mm_refresh_token')
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await loginUser(email, password)
    localStorage.setItem('mm_access_token', res.access_token)
    localStorage.setItem('mm_refresh_token', res.refresh_token)
    setUser(res.user)
  }

  async function register(fullName: string, email: string, password: string) {
    const res = await registerUser(fullName, email, password)
    localStorage.setItem('mm_access_token', res.access_token)
    localStorage.setItem('mm_refresh_token', res.refresh_token)
    setUser(res.user)
  }

  function logout() {
    localStorage.removeItem('mm_access_token')
    localStorage.removeItem('mm_refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
