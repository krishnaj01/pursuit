import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from 'radix-ui'

import { cn } from '@/lib/utils'

import { Button } from './Button'

interface PaginationProps {
  pageIndex: number
  pageCount: number
  pageSize: number
  pageSizeOptions: readonly number[]
  totalRows: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  itemLabel?: string
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageItems(current: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i)
  const pages = new Set([0, count - 1, current - 1, current, current + 1])
  if (current <= 2) [1, 2, 3].forEach((p) => pages.add(p))
  if (current >= count - 3) [count - 4, count - 3, count - 2].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 0 && p < count).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  pageSizeOptions,
  totalRows,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
}: PaginationProps) {
  const first = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const last = Math.min(totalRows, (pageIndex + 1) * pageSize)

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:px-6">
      <div className="flex items-center gap-4 text-[13px] text-muted">
        <span className="tabular">
          <span className="font-medium text-fg">
            {first}–{last}
          </span>{' '}
          of <span className="font-medium text-fg">{totalRows}</span> {itemLabel}
        </span>
        <span className="h-4 w-px bg-border" aria-hidden />
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows per page</span>
          <span className="sm:hidden">Per page</span>
          <Select.Root value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <Select.Trigger
              aria-label="Rows per page"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 font-mono text-xs text-fg shadow-sm transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Select.Value />
              <ChevronDown className="size-3.5 text-subtle" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                side="top"
                sideOffset={6}
                className="z-50 min-w-[var(--radix-select-trigger-width)] rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-pop-in"
              >
                <Select.Viewport>
                  {pageSizeOptions.map((size) => (
                    <Select.Item
                      key={size}
                      value={String(size)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 font-mono text-xs outline-none select-none data-[highlighted]:bg-surface-sunken"
                    >
                      <Select.ItemText>{size}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check className="size-3 text-accent" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </label>
      </div>

      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ChevronLeft />
          </Button>
          {pageItems(pageIndex, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="w-6 text-center text-xs text-subtle" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item + 1}`}
                aria-current={item === pageIndex ? 'page' : undefined}
                className={cn(
                  'tabular grid h-8 min-w-8 place-items-center rounded-md px-2 font-mono text-xs transition-colors duration-150',
                  item === pageIndex
                    ? 'bg-fg font-semibold text-bg shadow-sm'
                    : 'text-muted hover:bg-surface-sunken hover:text-fg',
                )}
              >
                {item + 1}
              </button>
            ),
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}
