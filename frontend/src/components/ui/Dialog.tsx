import { X } from 'lucide-react'
import { Dialog as RadixDialog } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            // Never taller than the screen; a dialog with long content scrolls a middle section (see DialogBody).
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-pop-in',
            className,
          )}
        >
          <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="font-display text-xl font-semibold">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="text-sm text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-md p-1 text-muted transition-colors hover:bg-surface-sunken hover:text-fg">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

/** Scrollable middle of a long dialog: spans the dialog's full width so the scrollbar sits on
 *  its edge rather than against the fields, with dividers above and below the scrolling area. */
export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('-mx-6 min-h-0 flex-1 overflow-y-auto overscroll-contain border-y border-border px-6 py-5', className)}>
      {children}
    </div>
  )
}
