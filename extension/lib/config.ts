/** Where Pursuit lives. Set WXT_PURSUIT_URL in .env (e.g. your Render frontend URL) when
 *  building for the store; it defaults to the local dev server. */
export const PURSUIT_URL = (import.meta.env.WXT_PURSUIT_URL ?? 'http://localhost:5173').replace(/\/$/, '')
export const API_BASE = `${PURSUIT_URL}/api/v1`
export const PURSUIT_ORIGIN_PATTERN = `${new URL(PURSUIT_URL).origin}/*`

export const REMINDER_PRESETS = [3, 5, 7, 15] as const
export const DEFAULT_REMINDER_DAYS = 7

export { JOB_SITE_PATTERNS } from './job-sites'
