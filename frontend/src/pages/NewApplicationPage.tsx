import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { useApplications } from '@/api/applications'
import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { JobLinkPreview } from '@/components/applications/JobLinkPreview'
import { NotePreview } from '@/components/applications/NotePreview'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { StagePill } from '@/components/ui/StagePill'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const RECENT_COUNT = 5

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function NewApplicationPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useApplications('all')
  const recent = [...(data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, RECENT_COUNT)

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${user?.name.split(' ')[0] ?? ''}`}
        title="Log an application"
        description="Add where you applied and when to check back in. We'll nudge you on the day."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="animate-pop-in">
          <CardContent className="p-6 sm:p-8">
            <ApplicationForm />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Recently added</CardTitle>
            <CardDescription>Your latest entries</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-4">
            {isLoading &&
              Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            {!isLoading && recent.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">Nothing yet, your first one goes here.</p>
            )}
            {recent.map((app) => (
              <div key={app.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-sunken">
                <CompanyLogo name={app.company_name} src={app.logo_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1">
                    <p className="truncate text-sm font-medium">{app.company_name}</p>
                    <JobLinkPreview companyName={app.company_name} url={app.job_url} />
                    <NotePreview companyName={app.company_name} notes={app.notes} />
                  </div>
                  <p className="truncate text-xs text-muted">{app.role}</p>
                </div>
                <div className="flex max-w-[45%] min-w-0 shrink-0 flex-col items-end gap-1">
                  <StagePill stage={app.stage} customLabel={app.custom_stage_label} className="px-2 text-[10px]" />
                  <span className="font-mono text-[10px] text-subtle">{formatDate(app.created_at, 'd MMM')}</span>
                </div>
              </div>
            ))}
            {!!data?.length && (
              <Link to="/pipeline" className="mt-3 inline-flex items-center gap-1 self-start px-2 text-sm font-medium text-accent hover:underline">
                Open pipeline <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
      <SiteFooter />
    </>
  )
}
