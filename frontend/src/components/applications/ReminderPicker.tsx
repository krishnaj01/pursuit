import { DatePicker } from '@/components/ui/DatePicker'
import { Input } from '@/components/ui/Input'
import { REMINDER_PRESETS } from '@/lib/constants'
import { type ReminderChoice, reminderDate } from '@/lib/reminders'
import { formatDate, todayISO } from '@/lib/utils'

interface ReminderPickerProps {
  value: ReminderChoice
  onChange: (value: ReminderChoice) => void
  /** Allow "Today" (0 days) — useful for the very first reminder. */
  allowToday?: boolean
  /** Offer a "No reminder" choice. */
  allowNone?: boolean
  id?: string
}

const presetClasses =
  'h-9 rounded-md border px-3 text-[13px] font-medium transition-all duration-200 data-[active=true]:border-accent data-[active=true]:bg-accent-soft data-[active=true]:text-accent border-border bg-surface text-muted hover:border-border-strong hover:text-fg'

/** Preset day offsets (3/5/7/15), a custom number of days, an exact date, or no reminder. */
export function ReminderPicker({ value, onChange, allowToday, allowNone, id }: ReminderPickerProps) {
  const presets = allowToday ? [0, ...REMINDER_PRESETS] : [...REMINDER_PRESETS]
  const isPreset = value.mode === 'days' && presets.includes(value.days)
  const isCustomDays = value.mode === 'days' && !isPreset

  return (
    <div className="flex flex-col gap-3" id={id}>
      <div className="flex flex-wrap gap-2">
        {presets.map((days) => (
          <button
            key={days}
            type="button"
            data-active={value.mode === 'days' && value.days === days}
            className={presetClasses}
            onClick={() => onChange({ mode: 'days', days })}
          >
            {days === 0 ? 'Today' : `${days} days`}
          </button>
        ))}
        <button
          type="button"
          data-active={isCustomDays}
          className={presetClasses}
          onClick={() => onChange({ mode: 'days', days: isCustomDays ? value.days : 10 })}
        >
          Custom days
        </button>
        <button
          type="button"
          data-active={value.mode === 'date'}
          className={presetClasses}
          onClick={() => onChange({ mode: 'date', date: value.mode === 'date' ? value.date : (reminderDate(value) ?? todayISO()) })}
        >
          Pick a date
        </button>
        {allowNone && (
          <button type="button" data-active={value.mode === 'none'} className={presetClasses} onClick={() => onChange({ mode: 'none' })}>
            No reminder
          </button>
        )}
      </div>

      {isCustomDays && (
        <div className="flex items-center gap-2 text-sm text-muted animate-fade-in">
          <span>Remind me in</span>
          <Input
            type="number"
            min={1}
            max={365}
            value={value.days}
            onChange={(e) => onChange({ mode: 'days', days: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
            className="h-9 w-20 text-center font-mono"
            aria-label="Custom number of days"
          />
          <span>days</span>
        </div>
      )}
      {value.mode === 'date' && (
        <DatePicker
          min={todayISO()}
          value={value.date}
          onChange={(date) => onChange({ mode: 'date', date })}
          className="w-60 animate-fade-in"
          aria-label="Reminder date"
        />
      )}

      {value.mode === 'none' ? (
        <p className="text-xs text-muted">No reminder, you can add one any time from the pipeline.</p>
      ) : (
        <p className="text-xs text-muted">
          Next check-in:{' '}
          <span className="font-mono font-medium text-fg">{formatDate(reminderDate(value)!, 'EEE, d MMM yyyy')}</span>
        </p>
      )}
    </div>
  )
}
