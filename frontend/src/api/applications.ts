import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import type {
  Application,
  ApplicationCreate,
  ApplicationFilter,
  ApplicationUpdate,
  ReminderUpdate,
  StageEvent,
  StageEventUpdate,
  StageUpdate,
} from '@/types'

/** Anything that changes an application can affect lists, stats and reminders. */
const invalidateAll = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.allApplications }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  ])

export const useApplications = (filter: ApplicationFilter = 'all') =>
  useQuery({
    queryKey: queryKeys.applications(filter),
    queryFn: async () =>
      (await api.get<Application[]>('/applications', { params: { filter } })).data,
    placeholderData: keepPreviousData,
  })

export const useApplicationHistory = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.history(id),
    queryFn: async () => (await api.get<StageEvent[]>(`/applications/${id}/history`)).data,
    enabled,
  })

export const useCreateApplication = () =>
  useMutation({
    mutationFn: async (payload: ApplicationCreate) =>
      (await api.post<Application>('/applications', payload)).data,
    onSuccess: invalidateAll,
  })

export const useUpdateApplication = () =>
  useMutation({
    mutationFn: async ({ id, ...payload }: ApplicationUpdate & { id: string }) =>
      (await api.patch<Application>(`/applications/${id}`, payload)).data,
    onSuccess: invalidateAll,
  })

export const useUpdateStage = () =>
  useMutation({
    mutationFn: async ({ id, ...payload }: StageUpdate & { id: string }) =>
      (await api.patch<Application>(`/applications/${id}/stage`, payload)).data,
    onSuccess: invalidateAll,
  })

export const useSetReminder = () =>
  useMutation({
    mutationFn: async ({ id, ...payload }: ReminderUpdate & { id: string }) =>
      (await api.post<Application>(`/applications/${id}/reminder`, payload)).data,
    onSuccess: invalidateAll,
  })

export const useDeleteApplication = () =>
  useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: invalidateAll,
  })

export const useClearReminder = () =>
  useMutation({
    mutationFn: async (id: string) => (await api.delete<Application>(`/applications/${id}/reminder`)).data,
    onSuccess: invalidateAll,
  })

export const useUpdateStageEvent = () =>
  useMutation({
    mutationFn: async ({ applicationId, eventId, ...payload }: StageEventUpdate & { applicationId: string; eventId: string }) =>
      (await api.patch<Application>(`/applications/${applicationId}/history/${eventId}`, payload)).data,
    onSuccess: invalidateAll,
  })

export const useDeleteStageEvent = () =>
  useMutation({
    mutationFn: async ({ applicationId, eventId }: { applicationId: string; eventId: string }) =>
      (await api.delete<Application>(`/applications/${applicationId}/history/${eventId}`)).data,
    onSuccess: invalidateAll,
  })
