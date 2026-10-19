import { NotebookText } from 'lucide-react'
import { Fragment } from 'react'

import { HoverPreview } from '@/components/ui/HoverPreview'

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
  const text = notes?.trim()
  if (!text) return null

  return (
    <HoverPreview
      icon={NotebookText}
      label={`Notes for ${companyName}`}
      title={`Notes · ${companyName}`}
      copyText={text}
      copyLabel="Copy notes"
      className={className}
    >
      <p className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.5rem))] overflow-y-auto px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
        <Linkified text={text} />
      </p>
    </HoverPreview>
  )
}
