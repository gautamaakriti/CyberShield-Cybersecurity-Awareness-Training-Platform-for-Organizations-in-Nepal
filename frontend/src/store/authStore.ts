import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  admin: any | null
  isAuthenticated: boolean
  login: (token: string, admin: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) => {
        localStorage.setItem('admin_token', token)
        set({ token, admin, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        set({ token: null, admin: null, isAuthenticated: false })
      },
    }),
    { name: 'auth-storage' }
  )
)
