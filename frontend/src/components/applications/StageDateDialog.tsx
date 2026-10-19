import { Switch } from 'radix-ui'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { STAGES } from '@/lib/constants'
import { todayISO } from '@/lib/utils'
import type { Stage } from '@/types'

interface StageDateDialogProps {
  stage: Stage
  companyName: string
  pending: boolean
  onCancel: () => void
  onConfirm: (values: { event_date: string; custom_stage_label?: string; remind: boolean }) => void
}

/** Collects the event date (and a label for custom stages) when moving into a dated stage. */
export function StageDateDialog({ stage, companyName, pending, onCancel, onConfirm }: StageDateDialogProps) {
  const [eventDate, setEventDate] = useState('')
  const [label, setLabel] = useState('')
  const [remind, setRemind] = useState(true)
  const switchId = useId()
  const isCustom = stage === 'custom'
  const valid = !!eventDate && (!isCustom || label.trim().length > 0)

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onCancel()}
      title={isCustom ? 'Custom stage' : `${STAGES[stage].label} · ${companyName}`}
      description={remind ? 'Your reminder will move to this date instead of a status check.' : "We'll log the date without reminding you."}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onConfirm({ event_date: eventDate, remind, ...(isCustom && { custom_stage_label: label.trim() }) })
        }}
      >
        {isCustom && (
          <Field label="Stage name" htmlFor="custom-stage">
            <Input id="custom-stage" autoFocus maxLength={100} placeholder="e.g. HR call" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        )}
        <Field label={STAGES[stage].datePrompt ?? 'Date'} htmlFor="event-date">
          <DatePicker id="event-date" min={todayISO()} value={eventDate} onChange={setEventDate} />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-raised px-4 py-3">
          <label htmlFor={switchId} className="flex flex-col">
            <span className="text-sm font-medium">Remind me on this date</span>
            <span className="text-xs text-muted">Turn off to just record it in the timeline.</span>
          </label>
          <Switch.Root
            id={switchId}
            checked={remind}
            onCheckedChange={setRemind}
            className="relative h-6 w-10 shrink-0 rounded-full bg-border-strong transition-colors duration-200 data-[state=checked]:bg-accent"
          >
            <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[1.125rem]" />
          </Switch.Root>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} loading={pending}>
            {remind ? 'Save & set reminder' : 'Save'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
