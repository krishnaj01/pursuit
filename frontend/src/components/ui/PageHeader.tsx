import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-accent uppercase">{eyebrow}</span>
        )}
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description && <p className="max-w-xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  )
}
