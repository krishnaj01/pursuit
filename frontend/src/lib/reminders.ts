import { addDays, formatISO } from 'date-fns'

export type ReminderChoice =
  | { mode: 'days'; days: number }
  | { mode: 'date'; date: string }
  | { mode: 'none' }

/** The calendar date (YYYY-MM-DD) a reminder choice resolves to, or null for no reminder. */
export function reminderDate(choice: ReminderChoice): string | null {
  if (choice.mode === 'none') return null
  return choice.mode === 'date' ? choice.date : formatISO(addDays(new Date(), choice.days), { representation: 'date' })
}

/** Request fields for creating an application with this first-reminder choice. */
export function reminderPayload(choice: ReminderChoice): { reminder_days?: number; reminder_on?: string } {
  if (choice.mode === 'days') return { reminder_days: choice.days }
  if (choice.mode === 'date') return { reminder_on: choice.date }
  return {}
}
