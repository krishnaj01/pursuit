export type Stage =
  | 'applied'
  | 'oa_cleared'
  | 'assignment'
  | 'hackathon'
  | 'round_1'
  | 'round_2'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'custom'

export type ReminderKind = 'status_check' | 'event'

export type ApplicationFilter = 'all' | 'due' | 'upcoming' | 'closed'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  timezone: string
  created_at: string
}

export interface Application {
  id: string
  company_name: string
  company_domain: string | null
  logo_url: string | null
  role: string
  applied_on: string
  stage: Stage
  custom_stage_label: string | null
  event_date: string | null
  next_reminder_on: string | null
  reminder_kind: ReminderKind
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationCreate {
  company_name: string
  company_domain?: string | null
  logo_url?: string | null
  role: string
  applied_on: string
  /** First reminder: days from today (date added) or an exact custom date. */
  reminder_days?: number
  reminder_on?: string
  notes?: string | null
}

export type ApplicationUpdate = Partial<Omit<ApplicationCreate, 'reminder_days' | 'reminder_on'>>

export interface StageUpdate {
  stage: Stage
  custom_stage_label?: string | null
  event_date?: string | null
}

export type ReminderUpdate = { days: number } | { on_date: string }

export interface StageEvent {
  id: string
  from_stage: Stage | null
  to_stage: Stage
  custom_stage_label: string | null
  event_date: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  for_date: string
  application_ids: string[]
  title: string
  body: string
  read_at: string | null
  created_at: string
}

export interface NotificationList {
  items: AppNotification[]
  unread_count: number
}

export interface LogoResolution {
  domain: string | null
  /** Path to the backend's cached copy of the logo. */
  logo_url: string | null
}

export interface Stats {
  total: number
  active: number
  rejected: number
  offers: number
  interviewing: number
  due_today: number
  response_rate: number
  offer_rate: number
  by_stage: { stage: Stage; count: number }[]
  weekly: { week_start: string; count: number }[]
  upcoming_events: {
    application_id: string
    company_name: string
    role: string
    stage: Stage
    custom_stage_label: string | null
    event_date: string
  }[]
}
