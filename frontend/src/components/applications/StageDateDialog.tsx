import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
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
  onConfirm: (values: { event_date: string; custom_stage_label?: string }) => void
}

/** Collects the event date (and a label for custom stages) when moving into a dated stage. */
export function StageDateDialog({ stage, companyName, pending, onCancel, onConfirm }: StageDateDialogProps) {
  const [eventDate, setEventDate] = useState('')
  const [label, setLabel] = useState('')
  const isCustom = stage === 'custom'
  const valid = !!eventDate && (!isCustom || label.trim().length > 0)

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onCancel()}
      title={isCustom ? 'Custom stage' : `${STAGES[stage].label} · ${companyName}`}
      description="Your reminder will move to this date instead of a status check."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onConfirm({ event_date: eventDate, ...(isCustom && { custom_stage_label: label.trim() }) })
        }}
      >
        {isCustom && (
          <Field label="Stage name" htmlFor="custom-stage">
            <Input id="custom-stage" autoFocus maxLength={100} placeholder="e.g. HR call" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        )}
        <Field label={STAGES[stage].datePrompt ?? 'Date'} htmlFor="event-date">
          <Input
            id="event-date"
            type="date"
            autoFocus={!isCustom}
            min={todayISO()}
            className="font-mono"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} loading={pending}>
            Save & set reminder
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
