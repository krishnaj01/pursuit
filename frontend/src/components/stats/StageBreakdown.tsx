import type { CSSProperties } from 'react'

import { stageLabel } from '@/lib/stages'
import { STAGE_ORDER, STAGES } from '@/lib/constants'
import type { Stats } from '@/types'

/** Horizontal bars, one hue; stage identity comes from the labelled dot, values sit at the tip. */
export function StageBreakdown({ byStage, total }: { byStage: Stats['by_stage']; total: number }) {
  const rows = [...byStage].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">Where things stand</h3>
        <p className="text-sm text-muted">Current stage of each application</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ stage, count }) => (
            <li
              key={stage}
              className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm"
              title={`${stageLabel(stage)}: ${count} of ${total}`}
            >
              <span className="flex min-w-0 items-center gap-2.5 pl-1 text-muted">
                <span className="stage-dot size-2 shrink-0 rounded-full" style={{ '--stage': STAGES[stage].color } as CSSProperties} />
                <span className="truncate">{stageLabel(stage)}</span>
              </span>
              <span className="h-2.5 overflow-hidden rounded-r bg-surface-sunken">
                <span
                  className="block h-full rounded-r bg-chart-1 transition-[width] duration-700 ease-out"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="tabular w-8 text-right font-medium">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
