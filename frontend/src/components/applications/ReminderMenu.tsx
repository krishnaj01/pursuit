import { BellOff, BellPlus, CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useClearReminder, useSetReminder } from '@/api/applications'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'
import { errorMessage } from '@/lib/api'
import { REMINDER_PRESETS } from '@/lib/constants'
import { isClosed } from '@/lib/stages'
import type { ReminderChoice } from '@/lib/reminders'
import { formatDate } from '@/lib/utils'
import type { Application, ReminderUpdate } from '@/types'

import { ReminderPicker } from './ReminderPicker'

/** Schedule the next check-in (3/5/7/15 days, custom) or turn reminders off. Hidden when closed. */
export function ReminderMenu({ application, emphasize }: { application: Application; emphasize?: boolean }) {
  const setReminder = useSetReminder()
  const clearReminder = useClearReminder()
  const [customOpen, setCustomOpen] = useState(false)
  const [choice, setChoice] = useState<ReminderChoice>({ mode: 'days', days: 10 })

  if (isClosed(application.stage)) return null
  const hasReminder = !!application.next_reminder_on
  const buttonLabel = emphasize ? 'Set next' : hasReminder ? 'Reschedule' : 'Remind me'

  const schedule = (payload: ReminderUpdate) =>
    setReminder.mutateAsync({ id: application.id, ...payload }).then(
      (updated) => {
        toast.success(`Next check-in for ${updated.company_name}: ${formatDate(updated.next_reminder_on!, 'EEE d MMM')}`)
        setCustomOpen(false)
      },
      (error) => toast.error(errorMessage(error, 'Could not set the reminder')),
    )

  const removeReminder = () =>
    clearReminder.mutateAsync(application.id).then(
      () => toast.success(`Reminder removed for ${application.company_name}`),
      (error) => toast.error(errorMessage(error, 'Could not remove the reminder')),
    )

  const submitCustom = () => {
    if (choice.mode === 'none') {
      setCustomOpen(false)
      void removeReminder()
    } else {
      void schedule(choice.mode === 'days' ? { days: choice.days } : { on_date: choice.date })
    }
  }

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button
            variant={emphasize ? 'highlight' : 'secondary'}
            size="sm"
            aria-label={buttonLabel}
            title={buttonLabel}
            className="max-[1379px]:w-8 max-[1379px]:px-0"
          >
            <BellPlus /> <span className="hidden min-[1380px]:inline">{buttonLabel}</span>
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLabel>Next check-in</MenuLabel>
          {REMINDER_PRESETS.map((days) => (
            <MenuItem key={days} onSelect={() => schedule({ days })}>
              <CalendarClock /> In {days} days
            </MenuItem>
          ))}
          <MenuItem onSelect={() => setCustomOpen(true)}>
            <CalendarClock /> Custom…
          </MenuItem>
          {hasReminder && (
            <>
              <MenuSeparator />
              <MenuItem onSelect={removeReminder}>
                <BellOff /> No reminder
              </MenuItem>
            </>
          )}
        </MenuContent>
      </Menu>

      <Dialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        title="Custom reminder"
        description={`When should we nudge you about ${application.company_name}?`}
      >
        <div className="flex flex-col gap-6">
          <ReminderPicker value={choice} onChange={setChoice} allowNone={hasReminder} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button loading={setReminder.isPending || clearReminder.isPending} onClick={submitCustom}>
              {choice.mode === 'none' ? 'Remove reminder' : 'Set reminder'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
