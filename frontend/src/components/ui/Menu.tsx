import { DropdownMenu } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const menuContentClasses =
  'z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-pop-in'

export const menuItemClasses =
  'relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg outline-none select-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-surface-sunken [&_svg]:size-4 [&_svg]:text-muted'

export const Menu = DropdownMenu.Root
export const MenuTrigger = DropdownMenu.Trigger

export function MenuContent({ className, children, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={6} className={cn(menuContentClasses, className)} {...props}>
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function MenuItem({ className, ...props }: ComponentProps<typeof DropdownMenu.Item>) {
  return <DropdownMenu.Item className={cn(menuItemClasses, className)} {...props} />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wider text-subtle uppercase">
      {children}
    </DropdownMenu.Label>
  )
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-border" />
}
