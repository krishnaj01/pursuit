import { ExternalLink, Link2 } from 'lucide-react'

import { HoverPreview } from '@/components/ui/HoverPreview'

interface JobLinkPreviewProps {
  companyName: string
  url: string | null
  className?: string
}

function describe(url: string) {
  try {
    const parsed = new URL(url)
    return { host: parsed.hostname.replace(/^www\./, ''), path: `${parsed.pathname}${parsed.search}` }
  } catch {
    return { host: url, path: '' }
  }
}

/** Job posting indicator: hover (mouse) or tap/click to see and open the posting link. */
export function JobLinkPreview({ companyName, url, className }: JobLinkPreviewProps) {
  if (!url) return null
  const { host, path } = describe(url)

  return (
    <HoverPreview
      icon={Link2}
      label={`Job posting for ${companyName}`}
      title={`Job posting · ${companyName}`}
      copyText={url}
      copyLabel="Copy job link"
      className={className}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{host}</p>
          {path && path !== '/' && (
            <p className="mt-0.5 line-clamp-2 font-mono text-[11px] break-all text-subtle">{path}</p>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
        >
          Open posting <ExternalLink className="size-3.5" />
        </a>
      </div>
    </HoverPreview>
  )
}
