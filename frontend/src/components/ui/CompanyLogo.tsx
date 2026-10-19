import { useState } from 'react'

import { assetUrl } from '@/lib/api'
import { cn, initials } from '@/lib/utils'

interface CompanyLogoProps {
  name: string
  src: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-8 rounded-md text-[11px]',
  md: 'size-10 rounded-lg text-xs',
  lg: 'size-14 rounded-xl text-sm',
}

/** Logo with graceful degradation to an initials monogram. */
export function CompanyLogo({ name, src, size = 'md', className }: CompanyLogoProps) {
  const resolved = assetUrl(src)
  const [failedSrc, setFailedSrc] = useState<string>()
  const current = resolved && resolved !== failedSrc ? resolved : undefined

  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden border border-border bg-surface-raised font-display font-semibold text-muted',
        sizes[size],
        className,
      )}
    >
      {current ? (
        <img
          key={current}
          src={current}
          alt={`${name} logo`}
          loading="lazy"
          className="size-full bg-white object-contain p-1"
          onError={() => setFailedSrc(current)}
        />
      ) : (
        <span aria-hidden>{initials(name) || '?'}</span>
      )}
    </div>
  )
}
