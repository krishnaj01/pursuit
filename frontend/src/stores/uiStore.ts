import { create } from 'zustand'

import type { ApplicationFilter } from '@/types'

interface UiState {
  pipelineFilter: ApplicationFilter
  /** Applications to spotlight in the pipeline (e.g. after opening a reminder). */
  highlightedIds: string[]
  setPipelineFilter: (filter: ApplicationFilter) => void
  focusApplications: (ids: string[]) => void
  clearHighlight: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  pipelineFilter: 'all',
  highlightedIds: [],
  setPipelineFilter: (pipelineFilter) => set({ pipelineFilter }),
  focusApplications: (ids) => set({ highlightedIds: ids, pipelineFilter: 'due' }),
  clearHighlight: () => set({ highlightedIds: [] }),
}))
