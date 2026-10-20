import { COPYRIGHT_HOLDER } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Read when the app loads, from the visitor's clock — it rolls over on its own each year. */
const YEAR = new Date().getFullYear()

/** Short copyright line. */
export function Copyright({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] whitespace-nowrap text-subtle', className)}>
      © {YEAR} {COPYRIGHT_HOLDER}. All rights reserved.
    </p>
  )
}
