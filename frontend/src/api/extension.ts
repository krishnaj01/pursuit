import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'

export interface ExtensionToken {
  id: string
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
}

const TOKENS_KEY = ['extension-tokens'] as const
const refresh = () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY })

export const useExtensionTokens = () =>
  useQuery({
    queryKey: TOKENS_KEY,
    queryFn: async () => (await api.get<ExtensionToken[]>('/extension/tokens')).data,
  })

export const useCreateExtensionToken = () =>
  useMutation({
    mutationFn: async (name: string) =>
      (await api.post<ExtensionToken & { token: string }>('/extension/tokens', { name })).data,
    onSuccess: refresh,
  })

export const useRevokeExtensionToken = () =>
  useMutation({
    mutationFn: (id: string) => api.delete(`/extension/tokens/${id}`),
    onSuccess: refresh,
  })
