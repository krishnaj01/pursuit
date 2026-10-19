interface ChartTooltipProps {
  active?: boolean
  label?: string
  value?: number
  unit: string
}

export function ChartTooltip({ active, label, value, unit }: ChartTooltipProps) {
  if (!active || value === undefined) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="font-mono text-[11px] text-muted">{label}</p>
      <p className="text-sm font-semibold text-fg">
        {value} {unit}
        {value === 1 ? '' : 's'}
      </p>
    </div>
  )
}
