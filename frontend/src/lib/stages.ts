import { STAGES } from '@/lib/constants'
import type { Stage } from '@/types'

export const stageLabel = (stage: Stage, customLabel?: string | null) =>
  stage === 'custom' ? customLabel || 'Custom' : STAGES[stage].label
