export type LogoMode = 'auto' | 'custom' | 'none'

export interface LogoValue {
  mode: LogoMode
  customUrl: string
}

/** Final logo URL to persist for a given picker state. */
export function pickLogoUrl(value: LogoValue, autoUrl: string | null): string | null {
  if (value.mode === 'none') return null
  if (value.mode === 'custom') return value.customUrl.trim() || null
  return autoUrl
}
