import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'

import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { TruncatedText } from '@/components/ui/TruncatedText'
import { stageLabel } from '@/lib/stages'
import { cn, daysFromToday, formatDate } from '@/lib/utils'
import type { Application } from '@/types'

import { ReminderCell } from './ReminderCell'
import { ReminderMenu } from './ReminderMenu'
import { RowActions } from './RowActions'
import { StageSelect } from './StageSelect'

const isDue = (a: Application) => a.stage !== 'rejected' && !!a.next_reminder_on && daysFromToday(a.next_reminder_on) <= 0

/** Fixed widths for content-sized columns; company and role share the remaining space.
 *  The actions column narrows on smaller screens, where the reminder button goes icon-only. */
const COLUMN_WIDTHS: Record<string, string> = {
  applied_on: 'w-[7.5rem]',
  stage: 'w-[10rem]',
  reminder: 'w-[13rem]',
  actions: 'w-[7.5rem] min-[1380px]:w-[12.5rem]',
}

const columns: ColumnDef<Application>[] = [
  {
    id: 'company',
    header: 'Company',
    accessorFn: (a) => `${a.company_name} ${a.company_domain ?? ''}`,
    cell: ({ row: { original: a } }) => (
      <div className="flex min-w-0 items-center gap-3">
        <CompanyLogo name={a.company_name} src={a.logo_url} />
        <div className="min-w-0 flex-1">
          <TruncatedText as="p" className="font-medium">{a.company_name}</TruncatedText>
          {a.company_domain && <TruncatedText as="p" className="font-mono text-[11px] text-subtle">{a.company_domain}</TruncatedText>}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: (info) => <TruncatedText className="text-sm">{info.getValue<string>()}</TruncatedText>,
  },
  {
    accessorKey: 'applied_on',
    header: 'Applied',
    cell: (info) => (
      <time dateTime={info.getValue<string>()} className="font-mono text-[13px] whitespace-nowrap text-muted">
        {formatDate(info.getValue<string>(), 'd MMM yyyy')}
      </time>
    ),
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
      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
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
      <table className="w-full min-w-[60rem] table-fixed border-separate border-spacing-0 text-left">
        <colgroup>
          {table.getVisibleLeafColumns().map((column) => (
            <col key={column.id} className={COLUMN_WIDTHS[column.id]} />
          ))}
        </colgroup>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="sticky top-0 border-b border-border bg-surface-raised px-4 py-3 font-mono text-[10px] font-medium tracking-[0.14em] whitespace-nowrap text-subtle uppercase first:pl-6 last:pr-6"
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
                <td key={cell.id} className="h-[4.25rem] border-b border-border px-4 py-3 align-middle first:pl-6 last:pr-6 group-last:border-b-0">
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
