import { addDays, formatISO } from 'date-fns'

export type ReminderChoice = { mode: 'days'; days: number } | { mode: 'date'; date: string }

/** The calendar date (YYYY-MM-DD) a reminder choice resolves to, counted from today. */
export function reminderDate(choice: ReminderChoice): string {
  return choice.mode === 'date' ? choice.date : formatISO(addDays(new Date(), choice.days), { representation: 'date' })
}
