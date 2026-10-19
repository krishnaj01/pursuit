import { Tooltip } from 'radix-ui'
import { type ElementType, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface TruncatedTextProps {
  children: string
  className?: string
  as?: ElementType
}

/** Single-line text that ends in "…" when it overflows, revealing the full value in a tooltip. */
export function TruncatedText({ children, className, as: Tag = 'span' }: TruncatedTextProps) {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  // Only open when the text is actually cut off.
  const onOpenChange = (next: boolean) => {
    const el = ref.current
    setOpen(next && !!el && el.scrollWidth > el.clientWidth)
  }

  return (
    <Tooltip.Root open={open} onOpenChange={onOpenChange}>
      <Tooltip.Trigger asChild>
        <Tag ref={ref} className={cn('block min-w-0 truncate', className)}>
          {children}
        </Tag>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 max-w-xs rounded-md border border-border bg-fg px-2.5 py-1.5 text-xs leading-relaxed text-bg shadow-lg data-[state=delayed-open]:animate-fade-in"
        >
          {children}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
