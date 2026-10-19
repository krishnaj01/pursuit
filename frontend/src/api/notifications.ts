import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { NOTIFICATION_POLL_MS } from '@/lib/constants'
import { queryClient, queryKeys } from '@/lib/queryClient'
import type { NotificationList } from '@/types'

const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications })

export const useNotifications = () =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => (await api.get<NotificationList>('/notifications')).data,
    refetchInterval: NOTIFICATION_POLL_MS,
  })

export const useMarkNotificationRead = () =>
  useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: refresh,
  })

export const useMarkAllNotificationsRead = () =>
  useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: refresh,
  })
