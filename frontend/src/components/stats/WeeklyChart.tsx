import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDate } from '@/lib/utils'
import type { Stats } from '@/types'

import { ChartTooltip } from './ChartTooltip'

const AXIS_TICK = { fill: 'var(--fg-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }

export function WeeklyChart({ weekly }: { weekly: Stats['weekly'] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const data = weekly.map((w) => ({ week: formatDate(w.week_start, 'd MMM'), count: w.count }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Applications per week</h3>
          <p className="text-sm text-muted">Last 12 weeks, by date applied</p>
        </div>
        <div className="flex rounded-md bg-surface-sunken p-0.5 text-xs">
          {(['chart', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('rounded px-2.5 py-1 capitalize transition-colors', view === v ? 'bg-surface text-fg shadow-sm' : 'text-muted')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === 'chart' ? (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-sunken)' }}
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} label={`Week of ${label}`} value={payload?.[0]?.value as number | undefined} unit="application" />
                )}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Week of</th>
                <th className="px-3 py-2 text-right font-medium">Applications</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.week} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono text-xs">{row.week}</td>
                  <td className="tabular px-3 py-1.5 text-right">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
