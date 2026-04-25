import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  immer((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user, token) =>
      set((state) => {
        state.user = user
        state.token = token
        state.isAuthenticated = true
        state.isLoading = false
      }),

    clearAuth: () =>
      set((state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.isLoading = false
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading
      }),
  }))
)
