import { CLOSED_STAGES, STAGES } from '@/lib/constants'
import type { Stage } from '@/types'

export const isClosed = (stage: Stage) => CLOSED_STAGES.has(stage)

export const stageLabel = (stage: Stage, customLabel?: string | null) =>
  stage === 'custom' ? customLabel || 'Custom' : STAGES[stage].label
