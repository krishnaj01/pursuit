import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'

import { api } from '@/lib/api'
import { LOGO_LOOKUP_DEBOUNCE_MS } from '@/lib/constants'
import { queryKeys } from '@/lib/queryClient'
import type { LogoResolution } from '@/types'

/** Debounced logo lookup as the user types a company name or domain. */
export function useCompanyLogo(company: string, domain: string) {
  const [debouncedCompany] = useDebounce(company.trim(), LOGO_LOOKUP_DEBOUNCE_MS)
  const [debouncedDomain] = useDebounce(domain.trim(), LOGO_LOOKUP_DEBOUNCE_MS)
  return useQuery({
    queryKey: queryKeys.logo(debouncedCompany, debouncedDomain),
    queryFn: async () =>
      (
        await api.get<LogoResolution>('/logos/resolve', {
          params: { company: debouncedCompany || undefined, domain: debouncedDomain || undefined },
        })
      ).data,
    enabled: debouncedCompany.length > 1 || debouncedDomain.length > 3,
    staleTime: Infinity,
  })
}
