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

/** Logo with an initials monogram underneath: shown while the image loads (then the
 *  image fades in over it) and kept if the image fails or there is none. */
export function CompanyLogo({ name, src, size = 'md', className }: CompanyLogoProps) {
  const resolved = assetUrl(src)
  const [failedSrc, setFailedSrc] = useState<string>()
  const [loadedSrc, setLoadedSrc] = useState<string>()
  const current = resolved && resolved !== failedSrc ? resolved : undefined
  const loaded = !!current && loadedSrc === current

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden border border-border bg-surface-raised font-display font-semibold text-muted',
        sizes[size],
        className,
      )}
    >
      <span aria-hidden className={cn('transition-opacity duration-300', loaded && 'opacity-0')}>
        {initials(name) || '?'}
      </span>
      {current && (
        <img
          key={current}
          // Cached images can finish before React attaches onLoad; check on mount too.
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setLoadedSrc(current)
          }}
          src={current}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          className={cn(
            'absolute inset-0 size-full bg-white object-contain p-1 opacity-0 transition-opacity duration-300 ease-out',
            loaded && 'opacity-100',
          )}
          onLoad={() => setLoadedSrc(current)}
          onError={() => setFailedSrc(current)}
        />
      )}
    </div>
  )
}
