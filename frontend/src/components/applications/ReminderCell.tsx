import { BellOff, CalendarCheck, CircleSlash } from 'lucide-react'

import { stageLabel } from '@/lib/stages'
import { cn, daysFromToday, formatDate, relativeDay } from '@/lib/utils'
import type { Application } from '@/types'

export function ReminderCell({ application }: { application: Application }) {
  const { next_reminder_on: next, reminder_kind: kind, stage } = application
  if (!next || stage === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-subtle">
        {stage === 'rejected' ? <CircleSlash className="size-3.5" /> : <BellOff className="size-3.5" />}
        {stage === 'rejected' ? 'Closed' : 'No reminder'}
      </span>
    )
  }
  const diff = daysFromToday(next)
  const tone = diff < 0 ? 'text-danger' : diff === 0 ? 'text-accent' : diff <= 2 ? 'text-warning' : 'text-fg'

  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', tone)}>
        <CalendarCheck className="size-3.5" />
        {relativeDay(next)}
      </span>
      <span className="font-mono text-[11px] text-muted">
        {formatDate(next, 'EEE d MMM')} · {kind === 'event' ? stageLabel(stage, application.custom_stage_label) : 'Status check'}
      </span>
    </div>
  )
}
