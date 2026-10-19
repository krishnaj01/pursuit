import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { api } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { browserTimezone } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'

/** Resolve the current session once on boot and mirror it into the auth store. */
export function useSessionBootstrap() {
  const { setUser, clear } = useAuthStore()
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api.get<User>('/auth/me')).data,
    retry: false,
    staleTime: Infinity,
  })
  useEffect(() => {
    if (query.data) setUser(query.data)
    else if (query.isError) clear()
  }, [query.data, query.isError, setUser, clear])
}

export function useGoogleSignIn() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: async (idToken: string) =>
      (await api.post<User>('/auth/google', { id_token: idToken, timezone: browserTimezone() })).data,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user)
      setUser(user)
    },
  })
}

export function useSignOut() {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      queryClient.clear()
      clear()
    },
  })
}
