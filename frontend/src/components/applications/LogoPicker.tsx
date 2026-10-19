import { ImageOff, Link2, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { Input } from '@/components/ui/Input'
import { type LogoValue, pickLogoUrl } from '@/lib/logos'

interface LogoPickerProps {
  company: string
  value: LogoValue
  onChange: (value: LogoValue) => void
  /** Result of `useCompanyLogo` owned by the parent form. */
  autoUrl: string | null
  resolvedDomain: string | null
  isFetching: boolean
}

export function LogoPicker({ company, value, onChange, autoUrl, resolvedDomain, isFetching }: LogoPickerProps) {
  const [draftUrl, setDraftUrl] = useState(value.customUrl)

  const preview = pickLogoUrl(value, autoUrl)
  const status =
    value.mode === 'none'
      ? 'No logo — initials will be shown.'
      : value.mode === 'custom'
        ? 'Using your image URL.'
        : isFetching
          ? 'Looking up logo…'
          : autoUrl
            ? `Found a logo for ${resolvedDomain}.`
            : company.trim()
              ? 'No logo found — add a website domain or paste an image URL.'
              : 'Type a company name to fetch its logo.'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border-strong bg-surface-raised p-4">
      <div className="flex items-center gap-4">
        <CompanyLogo name={company || '?'} src={preview} size="lg" className={isFetching ? 'animate-pulse' : ''} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Company logo</p>
          <p className="truncate text-xs text-muted">{status}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.mode !== 'auto' && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ ...value, mode: 'auto' })}>
            {autoUrl ? <Sparkles /> : <RotateCcw />} Use fetched logo
          </Button>
        )}
        {value.mode !== 'custom' && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ ...value, mode: 'custom' })}>
            <Link2 /> Replace with URL
          </Button>
        )}
        {value.mode !== 'none' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, mode: 'none' })}>
            <ImageOff /> Remove
          </Button>
        )}
      </div>
      {value.mode === 'custom' && (
        <div className="flex gap-2 animate-fade-in">
          <Input
            type="url"
            placeholder="https://example.com/logo.png"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onBlur={() => onChange({ mode: 'custom', customUrl: draftUrl })}
            aria-label="Logo image URL"
          />
          <Button type="button" size="md" variant="secondary" onClick={() => onChange({ mode: 'custom', customUrl: draftUrl })}>
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
