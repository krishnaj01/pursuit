import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { PAGE_SIZE_OPTIONS } from '@/lib/constants'
import type { ApplicationFilter } from '@/types'

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

interface UiState {
  pipelineFilter: ApplicationFilter
  /** Rows per page in the pipeline table (remembered across visits). */
  pageSize: PageSize
  /** Applications to spotlight in the pipeline (e.g. after opening a reminder). */
  highlightedIds: string[]
  setPipelineFilter: (filter: ApplicationFilter) => void
  setPageSize: (size: PageSize) => void
  focusApplications: (ids: string[]) => void
  clearHighlight: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      pipelineFilter: 'all',
      pageSize: PAGE_SIZE_OPTIONS[0],
      highlightedIds: [],
      setPipelineFilter: (pipelineFilter) => set({ pipelineFilter }),
      setPageSize: (pageSize) => set({ pageSize }),
      focusApplications: (ids) => set({ highlightedIds: ids, pipelineFilter: 'due' }),
      clearHighlight: () => set({ highlightedIds: [] }),
    }),
    { name: 'pursuit-ui', partialize: ({ pageSize }) => ({ pageSize }) },
  ),
)
