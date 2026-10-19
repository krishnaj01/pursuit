import type { LucideIcon } from 'lucide-react'

interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
}

export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <Icon className="size-4 text-subtle" />
      </div>
      <span className="tabular font-display text-4xl font-semibold tracking-tight">{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  )
}
