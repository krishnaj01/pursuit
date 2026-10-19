import { BellPlus, CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useSetReminder } from '@/api/applications'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'
import { errorMessage } from '@/lib/api'
import { REMINDER_PRESETS } from '@/lib/constants'
import type { ReminderChoice } from '@/lib/reminders'
import { formatDate } from '@/lib/utils'
import type { Application, ReminderUpdate } from '@/types'

import { ReminderPicker } from './ReminderPicker'

/** Schedule the next status check (3/5/7/15 days or custom). Hidden for rejected applications. */
export function ReminderMenu({ application, emphasize }: { application: Application; emphasize?: boolean }) {
  const setReminder = useSetReminder()
  const [customOpen, setCustomOpen] = useState(false)
  const [choice, setChoice] = useState<ReminderChoice>({ mode: 'days', days: 10 })

  if (application.stage === 'rejected') return null

  const schedule = (payload: ReminderUpdate) =>
    setReminder.mutateAsync({ id: application.id, ...payload }).then(
      (updated) => {
        toast.success(`Next check-in for ${updated.company_name}: ${formatDate(updated.next_reminder_on!, 'EEE d MMM')}`)
        setCustomOpen(false)
      },
      (error) => toast.error(errorMessage(error, 'Could not set the reminder')),
    )

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button variant={emphasize ? 'highlight' : 'secondary'} size="sm" aria-label="Set next reminder">
            <BellPlus /> {emphasize ? 'Set next' : 'Snooze'}
          </Button>
        </MenuTrigger>
        <MenuContent align="end">
          <MenuLabel>Next check-in</MenuLabel>
          {REMINDER_PRESETS.map((days) => (
            <MenuItem key={days} onSelect={() => schedule({ days })}>
              <CalendarClock /> In {days} days
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem onSelect={() => setCustomOpen(true)}>
            <CalendarClock /> Custom…
          </MenuItem>
        </MenuContent>
      </Menu>

      <Dialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        title="Custom reminder"
        description={`When should we nudge you about ${application.company_name}?`}
      >
        <div className="flex flex-col gap-6">
          <ReminderPicker value={choice} onChange={setChoice} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={setReminder.isPending}
              onClick={() => schedule(choice.mode === 'days' ? { days: choice.days } : { on_date: choice.date })}
            >
              Set reminder
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
