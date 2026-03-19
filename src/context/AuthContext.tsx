import React, { createContext, useContext, useState, useEffect } from 'react'

const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || 'adcraft2024'
const STORAGE_KEY = 'adcraft_access'

interface AuthContextValue {
  user: { id: string; email: string } | null
  loading: boolean
  signIn: (code: string) => { error: string | null }
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'granted') {
      setUser({ id: 'user', email: 'usuario@adcraft.app' })
    }
    setLoading(false)
  }, [])

  function signIn(code: string): { error: string | null } {
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'granted')
      setUser({ id: 'user', email: 'usuario@adcraft.app' })
      return { error: null }
    }
    return { error: 'Código de acesso inválido.' }
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
