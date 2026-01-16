import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (userData) => {
    // userData: { id, name, role: 'studio' | 'cliente', clienteId? }
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
  }

  const isStudio = () => user?.role === 'studio'
  const isCliente = () => user?.role === 'cliente'

  return (
    <AuthContext.Provider value={{ user, login, logout, isStudio, isCliente }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
