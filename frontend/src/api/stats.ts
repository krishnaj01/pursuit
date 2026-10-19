import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import type { Stats } from '@/types'

export const useStats = () =>
  useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => (await api.get<Stats>('/stats')).data,
  })
