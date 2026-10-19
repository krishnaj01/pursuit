import { Tooltip } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface IconLinkProps {
  href: string
  label: string
  children: ReactNode
  className?: string
}

/** Icon-only external link with an accessible name and a hover tooltip. */
export function IconLink({ href, label, children, className }: IconLinkProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            'grid size-8 place-items-center rounded-md text-subtle transition-colors duration-200 hover:bg-surface-sunken hover:text-fg [&_svg]:size-4',
            className,
          )}
        >
          {children}
        </a>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 rounded-md bg-fg px-2 py-1 text-[11px] font-medium text-bg shadow-md data-[state=delayed-open]:animate-fade-in"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
