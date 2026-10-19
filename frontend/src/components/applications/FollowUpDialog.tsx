import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import type { ReminderChoice } from '@/lib/reminders'
import type { StageUpdate } from '@/types'

import { ReminderPicker } from './ReminderPicker'

type FollowUp = Pick<StageUpdate, 'follow_up_days' | 'follow_up_on' | 'remind'>

interface FollowUpDialogProps {
  companyName: string
  pending: boolean
  onCancel: () => void
  onConfirm: (followUp: FollowUp) => void
}

/** Moving to "Awaiting": pick when to be nudged to follow up with the company. */
export function FollowUpDialog({ companyName, pending, onCancel, onConfirm }: FollowUpDialogProps) {
  const [choice, setChoice] = useState<ReminderChoice>({ mode: 'days', days: 7 })

  const confirm = () =>
    onConfirm(
      choice.mode === 'days'
        ? { follow_up_days: choice.days }
        : choice.mode === 'date'
          ? { follow_up_on: choice.date }
          : { remind: false },
    )

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onCancel()}
      title={`Awaiting · ${companyName}`}
      description="Waiting to hear back? We'll nudge you to follow up."
    >
      <div className="flex flex-col gap-6">
        <ReminderPicker value={choice} onChange={setChoice} allowNone />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={confirm} loading={pending}>
            {choice.mode === 'none' ? 'Save' : 'Save & set reminder'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
