import { QueryCache, QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { useAuthStore } from '@/stores/authStore'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        useAuthStore.getState().clear()
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, error) =>
        !(error instanceof AxiosError && error.response?.status && error.response.status < 500) &&
        count < 2,
    },
  },
})

export const queryKeys = {
  me: ['me'] as const,
  applications: (filter?: string) => ['applications', filter ?? 'all'] as const,
  allApplications: ['applications'] as const,
  history: (id: string) => ['applications', 'history', id] as const,
  notifications: ['notifications'] as const,
  stats: ['stats'] as const,
  logo: (company: string, domain: string) => ['logo', company, domain] as const,
}
