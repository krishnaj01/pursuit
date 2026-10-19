import { format, formatISO, isValid, parseISO } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { DayPicker, type Matcher } from 'react-day-picker'

import { cn, todayISO } from '@/lib/utils'

import { fieldClasses } from './Input'

interface DatePickerProps {
  /** ISO date (YYYY-MM-DD) or '' when empty. */
  value: string
  onChange: (value: string) => void
  /** Inclusive bounds, as ISO dates. */
  min?: string
  max?: string
  placeholder?: string
  id?: string
  invalid?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const toDate = (iso: string) => {
  const date = iso ? parseISO(iso) : undefined
  return date && isValid(date) ? date : undefined
}
const toISO = (date: Date) => formatISO(date, { representation: 'date' })

const dayButton =
  'grid size-9 place-items-center rounded-md text-sm tabular transition-colors duration-150 hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-ring'

/** Popover calendar (react-day-picker) styled entirely from design tokens. */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Pick a date',
  id,
  invalid,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const minDate = min ? toDate(min) : undefined
  const maxDate = max ? toDate(max) : undefined
  const disabled: Matcher[] = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]
  const today = todayISO()
  const todayAllowed = (!min || today >= min) && (!max || today <= max)

  const pick = (date: Date | undefined) => {
    if (!date) return
    onChange(toISO(date))
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn(
            fieldClasses,
            'flex items-center gap-2.5 text-left',
            size === 'sm' ? 'h-9' : 'h-10',
            !selected && 'text-subtle',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted" />
          <span className="truncate">{selected ? format(selected, 'EEE, d MMM yyyy') : placeholder}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] rounded-xl border border-border bg-surface p-3 shadow-lg data-[state=open]:animate-pop-in"
        >
          <DayPicker
            mode="single"
            required
            selected={selected}
            onSelect={pick}
            defaultMonth={selected ?? maxDate ?? minDate}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={disabled}
            weekStartsOn={1}
            showOutsideDays
            autoFocus
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
            }}
            classNames={{
              root: 'relative select-none',
              months: 'flex flex-col',
              month: 'flex flex-col gap-3',
              month_caption: 'flex h-8 items-center px-1',
              caption_label: 'font-display text-[15px] font-semibold',
              nav: 'absolute top-0 right-0 flex items-center gap-1',
              button_previous: 'grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-fg disabled:opacity-30',
              button_next: 'grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-fg disabled:opacity-30',
              month_grid: 'border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 pb-1 text-center font-mono text-[10px] font-medium tracking-wider text-subtle uppercase',
              week: 'mt-0.5 flex',
              day: 'p-0 text-fg',
              day_button: dayButton,
              today: 'font-semibold text-accent',
              selected: '[&>button]:bg-accent [&>button]:text-on-accent [&>button]:hover:bg-accent-hover',
              outside: 'text-subtle/60',
              disabled: 'pointer-events-none opacity-30',
              hidden: 'invisible',
            }}
          />
          {todayAllowed && (
            <div className="mt-2 flex justify-end border-t border-border pt-2">
              <button
                type="button"
                onClick={() => pick(parseISO(today))}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                Today
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
