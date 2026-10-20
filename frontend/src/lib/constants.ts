import type { Stage } from '@/types'

export const APP_NAME = 'Pursuit'
export const COPYRIGHT_HOLDER = APP_NAME

interface StageMeta {
  label: string
  /** CSS variable holding the stage colour (see styles/globals.css). */
  color: string
  /** Prompt for the date the user must provide when moving into this stage. */
  datePrompt?: string
}

export const STAGES: Record<Stage, StageMeta> = {
  applied: { label: 'Applied', color: 'var(--stage-applied)' },
  awaiting: { label: 'Awaiting', color: 'var(--stage-awaiting)' },
  oa_cleared: { label: 'OA', color: 'var(--stage-oa)', datePrompt: 'When is the OA?' },
  assignment: { label: 'Assignment', color: 'var(--stage-assignment)', datePrompt: 'When is the assignment due?' },
  hackathon: { label: 'Hackathon', color: 'var(--stage-hackathon)', datePrompt: 'When is the hackathon?' },
  round_1: { label: 'Round 1', color: 'var(--stage-round-1)', datePrompt: 'When is round 1?' },
  round_2: { label: 'Round 2', color: 'var(--stage-round-2)', datePrompt: 'When is round 2?' },
  interview: { label: 'Interview', color: 'var(--stage-interview)', datePrompt: 'When is the interview?' },
  offer: { label: 'Offer', color: 'var(--stage-offer)' },
  rejected: { label: 'Rejected', color: 'var(--stage-rejected)' },
  custom: { label: 'Custom…', color: 'var(--stage-custom)', datePrompt: 'When is this happening?' },
}

export const STAGE_ORDER: Stage[] = [
  'applied',
  'awaiting',
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

/** Finished applications: no reminders, listed under "Closed". Mirrors the backend. */
export const CLOSED_STAGES: ReadonlySet<Stage> = new Set(['offer', 'rejected'])

/** Stages that don't need an accompanying event date. */
export const UNDATED_STAGES: ReadonlySet<Stage> = new Set(['applied', 'awaiting', ...CLOSED_STAGES])

export const REMINDER_PRESETS = [3, 5, 7, 15] as const

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

// Only re-reads notifications (the digest itself is built on the first visit of the day);
// frequent enough for a tab left open past midnight to pick up the new day.
export const NOTIFICATION_POLL_MS = 5 * 60_000
export const LOGO_LOOKUP_DEBOUNCE_MS = 450
