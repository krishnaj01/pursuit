import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

export function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && darkQuery.matches)
  document.documentElement.classList.toggle('dark', dark)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        applyTheme(preference)
        set({ preference })
      },
    }),
    {
      name: 'pursuit-theme',
      onRehydrateStorage: () => (state) => applyTheme(state?.preference ?? 'system'),
    },
  ),
)

darkQuery.addEventListener('change', () => {
  if (useThemeStore.getState().preference === 'system') applyTheme('system')
})
