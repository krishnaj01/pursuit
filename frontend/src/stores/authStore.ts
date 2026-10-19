import { create } from 'zustand'

import type { User } from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  user: User | null
  status: AuthStatus
  setUser: (user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, status: 'anonymous' }),
}))
