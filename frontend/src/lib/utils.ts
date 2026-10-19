import { type ClassValue, clsx } from 'clsx'
import { differenceInCalendarDays, format, formatISO, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Today's date as YYYY-MM-DD in the browser's timezone. */
export const todayISO = () => formatISO(new Date(), { representation: 'date' })

export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const formatDate = (iso: string, pattern = 'd MMM yyyy') => format(parseISO(iso), pattern)

export const daysFromToday = (iso: string) => differenceInCalendarDays(parseISO(iso), new Date())

export function relativeDay(iso: string): string {
  const diff = daysFromToday(iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days overdue`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export const percent = (ratio: number) => `${Math.round(ratio * 100)}%`
