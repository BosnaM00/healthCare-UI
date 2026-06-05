import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
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
  persist(
    immer((set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      // Start as false when hydrating from storage (user already authenticated),
      // true only on a fresh load with no stored session.
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
    })),
    {
      name: 'mc-auth',
      // Only persist what is needed to restore the session —
      // never persist isLoading (it is always a runtime signal).
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Once storage is rehydrated the user is already known → stop loading.
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = false
      },
    }
  )
)
