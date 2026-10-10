import { createContext, useContext, ReactNode } from 'react'
import type { User } from '../api'

// No auth — everyone is a local admin
const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@local.dev',
  name: 'Admin',
  role: 'admin',
  created_at: new Date().toISOString(),
}

interface AuthContextType {
  user: User
  loading: false
}

const AuthContext = createContext<AuthContextType>({
  user: MOCK_USER,
  loading: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: MOCK_USER, loading: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
