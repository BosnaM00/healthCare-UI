import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type Theme = 'light' | 'dark' | 'high-contrast' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  root.classList.remove('dark', 'high-contrast')
  if (resolved === 'dark') root.classList.add('dark')
  if (resolved === 'high-contrast') root.classList.add('high-contrast')
}

export const useThemeStore = create<ThemeStore>()(
  immer((set) => ({
    theme: (localStorage.getItem('mc-theme') as Theme | null) ?? 'system',

    setTheme: (theme) => {
      set((state) => { state.theme = theme })
      localStorage.setItem('mc-theme', theme)
      applyTheme(theme)
    },
  }))
)

// Init on first load
applyTheme((localStorage.getItem('mc-theme') as Theme | null) ?? 'system')

// Keep `system` mode in sync with OS-level appearance changes
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system')
  })
