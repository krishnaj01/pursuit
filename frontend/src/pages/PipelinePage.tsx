import { Inbox, Plus, Search, X } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useApplications } from '@/api/applications'
import { PipelineTable } from '@/components/applications/PipelineTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUiStore } from '@/stores/uiStore'
import type { ApplicationFilter } from '@/types'

const FILTERS: { value: ApplicationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'due', label: 'Due today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'closed', label: 'Closed' },
]

const EMPTY_COPY: Record<ApplicationFilter, { title: string; description: string }> = {
  all: { title: 'Your pipeline is empty', description: 'Log your first application and it will show up here, sorted by the next reminder.' },
  due: { title: 'Nothing due today', description: 'No check-ins needed right now. Enjoy the quiet — or send another application.' },
  upcoming: { title: 'No upcoming reminders', description: 'Applications with future reminders will be listed here.' },
  closed: { title: 'No closed applications', description: 'Offers and rejections land here, so the rest of your pipeline stays focused.' },
}

export function PipelinePage() {
  const { pipelineFilter, setPipelineFilter, highlightedIds, clearHighlight } = useUiStore()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useApplications(pipelineFilter)
  const { data: due } = useApplications('due')

  // Spotlight from a notification fades after a few seconds.
  useEffect(() => {
    if (!highlightedIds.length) return
    const timer = setTimeout(clearHighlight, 6000)
    return () => clearTimeout(timer)
  }, [highlightedIds, clearHighlight])

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Every application, in order"
        description="Sorted by the next reminder. Update stages inline — dated stages move your reminder to the event."
        actions={
          <Button asChild>
            <Link to="/">
              <Plus /> New application
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs.Root value={pipelineFilter} onValueChange={(v) => setPipelineFilter(v as ApplicationFilter)}>
            <Tabs.List className="flex gap-1 rounded-lg bg-surface-sunken p-1" aria-label="Filter applications">
              {FILTERS.map(({ value, label }) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted transition-all duration-200 hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm"
                >
                  {label}
                  {value === 'due' && !!due?.length && (
                    <span className="rounded-full bg-highlight px-1.5 font-mono text-[10px] font-semibold text-highlight-fg">{due.length}</span>
                  )}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, stage…"
              className="h-9 pl-9"
              aria-label="Search applications"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle hover:text-fg" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-6">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.length ? (
          <PipelineTable key={pipelineFilter} data={data} search={search} highlightedIds={highlightedIds} />
        ) : (
          <EmptyState
            icon={Inbox}
            {...EMPTY_COPY[pipelineFilter]}
            action={
              pipelineFilter === 'all' && (
                <Button asChild>
                  <Link to="/">
                    <Plus /> Log application
                  </Link>
                </Button>
              )
            }
          />
        )}
      </Card>
    </>
  )
}
