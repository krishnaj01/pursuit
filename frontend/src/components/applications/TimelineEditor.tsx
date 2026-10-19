import { Check, Pencil, Trash2, X } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import { toast } from 'sonner'

import { useApplicationHistory, useDeleteStageEvent, useUpdateStageEvent } from '@/api/applications'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { errorMessage } from '@/lib/api'
import { STAGES, UNDATED_STAGES } from '@/lib/constants'
import { stageLabel } from '@/lib/stages'
import { formatDate, todayISO } from '@/lib/utils'
import type { StageEvent, StageEventUpdate } from '@/types'

interface EntryProps {
  applicationId: string
  event: StageEvent
  isFirst: boolean
  /** Entry the application falls back to if this (latest) entry is deleted. */
  revertsTo?: StageEvent
}

function TimelineEntry({ applicationId, event, isFirst, revertsTo }: EntryProps) {
  const update = useUpdateStageEvent()
  const remove = useDeleteStageEvent()
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [draft, setDraft] = useState({
    occurred_on: event.occurred_on,
    event_date: event.event_date ?? '',
    custom_stage_label: event.custom_stage_label ?? '',
  })
  const dated = !UNDATED_STAGES.has(event.to_stage)
  const isCustom = event.to_stage === 'custom'

  const save = () => {
    const changes: StageEventUpdate = {}
    if (draft.occurred_on !== event.occurred_on) changes.occurred_on = draft.occurred_on
    if (dated && draft.event_date && draft.event_date !== event.event_date) changes.event_date = draft.event_date
    if (isCustom && draft.custom_stage_label.trim() !== event.custom_stage_label)
      changes.custom_stage_label = draft.custom_stage_label.trim()
    if (!Object.keys(changes).length) return setMode('view')

    update.mutate(
      { applicationId, eventId: event.id, ...changes },
      {
        onSuccess: () => {
          toast.success('Timeline updated')
          setMode('view')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not update the entry')),
      },
    )
  }

  const confirmDelete = () =>
    remove.mutate(
      { applicationId, eventId: event.id },
      {
        onSuccess: () => toast.success('Entry removed'),
        onError: (error) => toast.error(errorMessage(error, 'Could not remove the entry')),
      },
    )

  const valid =
    !!draft.occurred_on &&
    draft.occurred_on <= todayISO() &&
    (!dated || !!draft.event_date) &&
    (!isCustom || !!draft.custom_stage_label.trim())

  return (
    <li className="group relative text-sm">
      <span
        className="stage-dot absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full"
        style={{ '--stage': STAGES[event.to_stage].color } as CSSProperties}
      />

      {mode === 'edit' ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3 animate-fade-in">
          <p className="font-medium">{stageLabel(event.to_stage, event.custom_stage_label)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {isCustom && (
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                Stage name
                <Input
                  value={draft.custom_stage_label}
                  maxLength={100}
                  onChange={(e) => setDraft((d) => ({ ...d, custom_stage_label: e.target.value }))}
                  className="h-9"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs text-muted">
              {isFirst ? 'Applied on' : 'Happened on'}
              <DatePicker
                size="sm"
                max={todayISO()}
                value={draft.occurred_on}
                onChange={(occurred_on) => setDraft((d) => ({ ...d, occurred_on }))}
              />
            </label>
            {dated && (
              <label className="flex flex-col gap-1 text-xs text-muted">
                {STAGES[event.to_stage].datePrompt?.replace(/\?$/, '') ?? 'Event date'}
                <DatePicker
                  size="sm"
                  value={draft.event_date}
                  onChange={(event_date) => setDraft((d) => ({ ...d, event_date }))}
                />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('view')}>
              <X /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={!valid} loading={update.isPending}>
              <Check /> Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-medium">{stageLabel(event.to_stage, event.custom_stage_label)}</span>
            {event.event_date && <span className="text-muted"> · {formatDate(event.event_date, 'EEE d MMM')}</span>}
            <span className="block font-mono text-[11px] text-subtle">{formatDate(event.occurred_on, 'd MMM yyyy')}</span>
          </div>
          {mode === 'view' && (
            <div className="flex shrink-0 gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button variant="ghost" size="icon" className="size-7" aria-label="Edit entry" onClick={() => setMode('edit')}>
                <Pencil className="!size-3.5" />
              </Button>
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 hover:text-danger"
                  aria-label="Delete entry"
                  onClick={() => setMode('confirm-delete')}
                >
                  <Trash2 className="!size-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 animate-fade-in">
          <span className="text-xs text-fg">
            Remove this entry?
            {revertsTo && <> The stage goes back to <b>{stageLabel(revertsTo.to_stage, revertsTo.custom_stage_label)}</b>.</>}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setMode('view')}>
              Keep
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={remove.isPending}>
              Remove
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

/** Editable stage history: fix dates, rename custom stages, or remove mistaken entries. */
export function TimelineEditor({ applicationId }: { applicationId: string }) {
  const { data: events, isLoading } = useApplicationHistory(applicationId, true)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[13px] font-medium">Timeline</p>
        <p className="text-xs text-muted">Edit dates or remove entries logged by mistake. The latest entry is the current stage.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <ol className="relative ml-1.5 flex flex-col gap-4 border-l border-border pl-5">
          {events?.map((event, index) => (
            // Key on content so drafts reset after the server returns updated values.
            <TimelineEntry
              key={`${event.id}-${event.occurred_on}-${event.event_date}-${event.custom_stage_label}`}
              applicationId={applicationId}
              event={event}
              isFirst={index === 0}
              revertsTo={index === events.length - 1 ? events[index - 1] : undefined}
            />
          ))}
        </ol>
      )}
    </div>
  )
}
