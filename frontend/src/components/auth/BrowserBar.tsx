import { Lock, Puzzle } from 'lucide-react'

import { cn } from '@/lib/utils'

interface BrowserBarProps {
  /** Shown in the address bar, without the scheme. */
  url: string
  /** Highlight the Pursuit toolbar icon, as when its popup or prompt is open. */
  extensionActive?: boolean
}

/** Decorative browser chrome for login-page illustrations: address bar plus the
 *  extensions area with Pursuit pinned. */
export function BrowserBar({ url, extensionActive = false }: BrowserBarProps) {
  return (
    <div aria-hidden className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-2.5">
      <span className="size-2.5 shrink-0 rounded-full bg-border-strong" />
      <span className="size-2.5 shrink-0 rounded-full bg-border-strong" />
      <span className="size-2.5 shrink-0 rounded-full bg-border-strong" />
      <span className="ml-3 flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-surface-sunken px-3 py-1 font-mono text-[11px] text-subtle sm:max-w-md">
        <Lock className="size-3 shrink-0" />
        <span className="truncate">{url}</span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2.5 pl-2 text-subtle">
        <Puzzle className="size-3.5" />
        <span
          className={cn(
            'grid size-5 place-items-center rounded-[6px] bg-fg text-bg',
            extensionActive && 'ring-2 ring-accent ring-offset-2 ring-offset-surface-raised',
          )}
        >
          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19 19 5M9 5h10v10" />
          </svg>
        </span>
      </span>
    </div>
  )
}
