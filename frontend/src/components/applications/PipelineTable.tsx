import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'

import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { stageLabel } from '@/lib/stages'
import { cn, daysFromToday, formatDate } from '@/lib/utils'
import type { Application } from '@/types'

import { ReminderCell } from './ReminderCell'
import { ReminderMenu } from './ReminderMenu'
import { RowActions } from './RowActions'
import { StageSelect } from './StageSelect'

const isDue = (a: Application) => a.stage !== 'rejected' && !!a.next_reminder_on && daysFromToday(a.next_reminder_on) <= 0

const columns: ColumnDef<Application>[] = [
  {
    id: 'company',
    header: 'Company',
    accessorFn: (a) => `${a.company_name} ${a.company_domain ?? ''}`,
    cell: ({ row: { original: a } }) => (
      <div className="flex items-center gap-3">
        <CompanyLogo name={a.company_name} src={a.logo_url} />
        <div className="min-w-0">
          <p className="truncate font-medium">{a.company_name}</p>
          {a.company_domain && <p className="truncate font-mono text-[11px] text-subtle">{a.company_domain}</p>}
        </div>
      </div>
    ),
  },
  { accessorKey: 'role', header: 'Role', cell: (info) => <span className="text-sm">{info.getValue<string>()}</span> },
  {
    accessorKey: 'applied_on',
    header: 'Applied',
    cell: (info) => <span className="font-mono text-[13px] text-muted">{formatDate(info.getValue<string>(), 'd MMM yy')}</span>,
  },
  {
    id: 'stage',
    header: 'Stage',
    accessorFn: (a) => stageLabel(a.stage, a.custom_stage_label),
    cell: ({ row }) => <StageSelect application={row.original} />,
  },
  {
    id: 'reminder',
    header: 'Next reminder',
    enableGlobalFilter: false,
    cell: ({ row }) => <ReminderCell application={row.original} />,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <ReminderMenu application={row.original} emphasize={isDue(row.original)} />
        <RowActions application={row.original} />
      </div>
    ),
  },
]

interface PipelineTableProps {
  data: Application[]
  search: string
  highlightedIds: string[]
}

/** Rows arrive ordered by upcoming reminder from the API; we only filter client-side. */
export function PipelineTable({ data, search, highlightedIds }: PipelineTableProps) {
  const highlighted = useMemo(() => new Set(highlightedIds), [highlightedIds])
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: search },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="sticky top-0 border-b border-border bg-surface-raised px-4 py-3 font-mono text-[10px] font-medium tracking-[0.14em] text-subtle uppercase first:pl-6 last:pr-6"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'group transition-colors duration-200 hover:bg-surface-raised',
                isDue(row.original) && 'bg-accent-soft/40',
                highlighted.has(row.id) && 'bg-highlight/15',
                row.original.stage === 'rejected' && 'opacity-60 hover:opacity-100',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b border-border px-4 py-3.5 align-middle first:pl-6 last:pr-6 group-last:border-b-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && search && (
        <p className="px-6 py-10 text-center text-sm text-muted">No applications match “{search}”.</p>
      )}
    </div>
  )
}
