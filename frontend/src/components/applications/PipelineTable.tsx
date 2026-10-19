import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { Pagination } from '@/components/ui/Pagination'
import { TruncatedText } from '@/components/ui/TruncatedText'
import { PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { isClosed, stageLabel } from '@/lib/stages'
import { cn, daysFromToday, formatDate } from '@/lib/utils'
import { type PageSize, useUiStore } from '@/stores/uiStore'
import type { Application } from '@/types'

import { NotePreview } from './NotePreview'
import { ReminderCell } from './ReminderCell'
import { ReminderMenu } from './ReminderMenu'
import { RowActions } from './RowActions'
import { StageSelect } from './StageSelect'

const isDue = (a: Application) => !isClosed(a.stage) && !!a.next_reminder_on && daysFromToday(a.next_reminder_on) <= 0

/** Fixed widths for content-sized columns; company and role share the remaining space.
 *  The actions column narrows on smaller screens, where the reminder button goes icon-only. */
const COLUMN_WIDTHS: Record<string, string> = {
  applied_on: 'w-[7.5rem]',
  stage: 'w-[10rem]',
  reminder: 'w-[13rem]',
  actions: 'w-[7.5rem] min-[1380px]:w-[12.5rem]',
}

const rowTone = (a: Application, highlighted: Set<string>) =>
  cn(
    'transition-colors duration-200',
    isDue(a) && 'bg-accent-soft/40',
    highlighted.has(a.id) && 'bg-highlight/15',
    a.stage === 'rejected' && 'opacity-60 hover:opacity-100',
  )

function CompanyCell({ application: a }: { application: Application }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CompanyLogo name={a.company_name} src={a.logo_url} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1">
          <TruncatedText as="p" className="font-medium">{a.company_name}</TruncatedText>
          <NotePreview companyName={a.company_name} notes={a.notes} />
        </div>
        {a.company_domain && <TruncatedText as="p" className="font-mono text-[11px] text-subtle">{a.company_domain}</TruncatedText>}
      </div>
    </div>
  )
}

const columns: ColumnDef<Application>[] = [
  {
    id: 'company',
    header: 'Company',
    accessorFn: (a) => `${a.company_name} ${a.company_domain ?? ''}`,
    cell: ({ row }) => <CompanyCell application={row.original} />,
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

/** Rows arrive ordered by upcoming reminder from the API; filtering and paging happen client-side.
 *  Wide screens get a table; narrower ones get cards built from the same paginated rows. */
export function PipelineTable({ data, search, highlightedIds }: PipelineTableProps) {
  const highlighted = useMemo(() => new Set(highlightedIds), [highlightedIds])
  const { pageSize, setPageSize } = useUiStore()
  const [pageIndex, setPageIndex] = useState(0)

  // Back to the first page whenever the search changes.
  const [searchedFor, setSearchedFor] = useState(search)
  if (searchedFor !== search) {
    setSearchedFor(search)
    setPageIndex(0)
  }

  const onPaginationChange = (updater: Updater<PaginationState>) => {
    const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
    setPageIndex(next.pageIndex)
    if (next.pageSize !== pageSize) setPageSize(next.pageSize as PageSize)
  }

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: search, pagination: { pageIndex, pageSize } },
    onPaginationChange,
    autoResetPageIndex: false,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  // Deleting the last row of the last page (or a smaller result set) leaves us past the end.
  if (pageIndex > 0 && pageIndex >= pageCount) setPageIndex(Math.max(0, pageCount - 1))

  const rows = table.getRowModel().rows

  if (totalRows === 0) {
    return search ? <p className="px-6 py-10 text-center text-sm text-muted">No applications match “{search}”.</p> : null
  }

  return (
    <>
      {/* Table: wide screens */}
      <div className="hidden overflow-x-auto xl:block">
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
              <tr key={row.id} className={cn('group hover:bg-surface-raised', rowTone(row.original, highlighted))}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="h-[4.25rem] border-b border-border px-4 py-3 align-middle first:pl-6 last:pr-6 group-last:border-b-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards: phones and tablets */}
      <ul className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2 xl:hidden">
        {rows.map(({ original: a }) => (
          <li key={a.id} className={cn('flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm', rowTone(a, highlighted))}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <CompanyCell application={a} />
              </div>
              <RowActions application={a} />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <TruncatedText className="text-fg">{a.role}</TruncatedText>
              <time dateTime={a.applied_on} className="shrink-0 font-mono text-xs whitespace-nowrap text-muted">
                {formatDate(a.applied_on, 'd MMM yyyy')}
              </time>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border pt-3">
              <div className="min-w-0 flex-1">
                <ReminderCell application={a} />
              </div>
              <ReminderMenu application={a} emphasize={isDue(a)} />
            </div>
            <div className="min-w-0">
              <StageSelect application={a} />
            </div>
          </li>
        ))}
      </ul>

      <Pagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalRows={totalRows}
        onPageChange={(index) => table.setPageIndex(index)}
        onPageSizeChange={(size) => {
          setPageSize(size as PageSize)
          setPageIndex(0)
        }}
        itemLabel={totalRows === 1 ? 'application' : 'applications'}
      />
    </>
  )
}
