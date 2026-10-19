import type { Stage } from '@/types'

export const APP_NAME = 'Pursuit'

interface StageMeta {
  label: string
  /** CSS variable holding the stage colour (see styles/globals.css). */
  color: string
  /** Prompt for the date the user must provide when moving into this stage. */
  datePrompt?: string
}

export const STAGES: Record<Stage, StageMeta> = {
  applied: { label: 'Applied', color: 'var(--stage-applied)' },
  oa_cleared: { label: 'OA cleared', color: 'var(--stage-oa)', datePrompt: 'When is the next step after the OA?' },
  assignment: { label: 'Assignment', color: 'var(--stage-assignment)', datePrompt: 'When is the assignment due?' },
  hackathon: { label: 'Hackathon', color: 'var(--stage-hackathon)', datePrompt: 'When is the hackathon?' },
  round_1: { label: 'Round 1', color: 'var(--stage-round-1)', datePrompt: 'When is round 1?' },
  round_2: { label: 'Round 2', color: 'var(--stage-round-2)', datePrompt: 'When is round 2?' },
  interview: { label: 'Interview', color: 'var(--stage-interview)', datePrompt: 'When is the interview?' },
  offer: { label: 'Offer', color: 'var(--stage-offer)', datePrompt: 'When do you need to respond to the offer?' },
  rejected: { label: 'Rejected', color: 'var(--stage-rejected)' },
  custom: { label: 'Custom…', color: 'var(--stage-custom)', datePrompt: 'When is this happening?' },
}

export const STAGE_ORDER: Stage[] = [
  'applied',
  'oa_cleared',
  'assignment',
  'hackathon',
  'round_1',
  'round_2',
  'interview',
  'offer',
  'rejected',
  'custom',
]

/** Stages that don't need an accompanying event date. */
export const UNDATED_STAGES: ReadonlySet<Stage> = new Set(['applied', 'rejected'])

export const REMINDER_PRESETS = [3, 5, 7, 15] as const

export const NOTIFICATION_POLL_MS = 60_000
export const LOGO_LOOKUP_DEBOUNCE_MS = 450
