import { useMutation } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'

const FALLBACK_FILENAME = 'pursuit-applications.csv'

function filenameFrom(disposition: string | undefined) {
  return disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? FALLBACK_FILENAME
}

/** Download all of the user's applications as a CSV file. */
export const useExportCsv = () =>
  useMutation({
    mutationFn: async () => {
      const response = await api.get<Blob>('/account/export.csv', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = Object.assign(document.createElement('a'), {
        href: url,
        download: filenameFrom(response.headers['content-disposition']),
      })
      link.click()
      URL.revokeObjectURL(url)
    },
  })

/** Permanently delete the account; the user must re-type their email. */
export const useDeleteAccount = () => {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: (confirmEmail: string) => api.delete('/account', { data: { confirm_email: confirmEmail } }),
    onSuccess: () => {
      queryClient.clear()
      clear()
    },
  })
}
