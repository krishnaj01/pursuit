import { Check, Copy, NotebookText } from 'lucide-react'
import { Popover } from 'radix-ui'
import { Fragment, type PointerEvent, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const OPEN_DELAY_MS = 200
const CLOSE_DELAY_MS = 150
const URL_PATTERN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g

/** Render plain-text notes with http(s) links made clickable. */
function Linkified({ text }: { text: string }) {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      >
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}

interface NotePreviewProps {
  companyName: string
  notes: string | null
  className?: string
}

/** Note indicator: hover (mouse) or tap/click to read the application's notes. */
export function NotePreview({ companyName, notes, className }: NotePreviewProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const text = notes?.trim()
  if (!text) return null

  // Hover only applies to real mice; touch and pen use tap to toggle.
  const schedule = (next: boolean) => (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), next ? OPEN_DELAY_MS : CLOSE_DELAY_MS)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        clearTimeout(timer.current)
        setOpen(next)
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Notes for ${companyName}`}
          onPointerEnter={schedule(true)}
          onPointerLeave={schedule(false)}
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-accent-soft hover:text-accent data-[state=open]:bg-accent-soft data-[state=open]:text-accent',
            className,
          )}
        >
          <NotebookText className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onPointerEnter={schedule(true)}
          onPointerLeave={schedule(false)}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-surface shadow-lg data-[state=open]:animate-pop-in"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <NotebookText className="size-3.5 shrink-0 text-accent" />
              <span className="truncate text-[13px] font-medium">Notes · {companyName}</span>
            </div>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy notes"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-sunken hover:text-fg"
            >
              {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.5rem))] overflow-y-auto px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
            <Linkified text={text} />
          </p>
          <Popover.Arrow className="fill-surface" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
