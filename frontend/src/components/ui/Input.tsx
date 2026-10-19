import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const fieldClasses =
  'w-full rounded-md border border-border bg-surface px-3.5 text-sm text-fg shadow-sm transition-colors duration-200 placeholder:text-subtle hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger/15'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldClasses, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClasses, 'min-h-24 resize-y py-2.5', className)} {...props} />
}
