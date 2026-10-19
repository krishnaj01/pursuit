import { BellOff, CalendarCheck, CircleSlash, Trophy } from 'lucide-react'

import { TruncatedText } from '@/components/ui/TruncatedText'
import { isClosed, stageLabel } from '@/lib/stages'
import { cn, daysFromToday, formatDate, relativeDay } from '@/lib/utils'
import type { Application } from '@/types'

export function ReminderCell({ application }: { application: Application }) {
  const { next_reminder_on: next, reminder_kind: kind, stage } = application
  if (stage === 'offer') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-success">
        <Trophy className="size-3.5" /> Closed · offer
      </span>
    )
  }
  if (!next || isClosed(stage)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-subtle">
        {isClosed(stage) ? <CircleSlash className="size-3.5" /> : <BellOff className="size-3.5" />}
        {isClosed(stage) ? 'Closed' : 'No reminder'}
      </span>
    )
  }
  const diff = daysFromToday(next)
  const tone = diff < 0 ? 'text-danger' : diff === 0 ? 'text-accent' : diff <= 2 ? 'text-warning' : 'text-fg'

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap', tone)}>
        <CalendarCheck className="size-3.5 shrink-0" />
        {relativeDay(next)}
      </span>
      <TruncatedText className="font-mono text-[11px] text-muted">
        {`${formatDate(next, 'EEE d MMM')} · ${kind === 'event' ? stageLabel(stage, application.custom_stage_label) : 'Status check'}`}
      </TruncatedText>
    </div>
  )
}
