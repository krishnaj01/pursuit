import type { CSSProperties } from 'react'

import { STAGES } from '@/lib/constants'
import { stageLabel } from '@/lib/stages'
import { cn } from '@/lib/utils'
import type { Stage } from '@/types'

export function StagePill({ stage, customLabel, className }: { stage: Stage; customLabel?: string | null; className?: string }) {
  return (
    <span
      style={{ '--stage': STAGES[stage].color } as CSSProperties}
      className={cn('stage-tint inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', className)}
    >
      <span className="stage-dot size-1.5 shrink-0 rounded-full" />
      <span className="truncate">{stageLabel(stage, customLabel)}</span>
    </span>
  )
}
