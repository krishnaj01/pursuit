import { Briefcase, CalendarDays, Hourglass, MessagesSquare, Reply, Trophy } from 'lucide-react'

import { useStats } from '@/api/stats'
import { UserAvatar } from '@/components/layout/UserMenu'
import { ExtensionCard } from '@/components/extension/ExtensionCard'
import { YourDataCard } from '@/components/profile/YourDataCard'
import { StageBreakdown } from '@/components/stats/StageBreakdown'
import { StatTile } from '@/components/stats/StatTile'
import { WeeklyChart } from '@/components/stats/WeeklyChart'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { StagePill } from '@/components/ui/StagePill'
import { formatDate, percent, relativeDay } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { data: stats, isLoading } = useStats()

  return (
    <>
      <Card className="relative mb-8 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-accent-soft via-accent-soft/50 to-transparent" />
        <CardContent className="relative flex flex-wrap items-end gap-5 pt-16">
          <UserAvatar className="size-20 ring-4 ring-surface" />
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{user?.name}</h1>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
          <div className="flex flex-col gap-1 font-mono text-[11px] text-subtle sm:items-end">
            {user && <span>Member since {formatDate(user.created_at, 'MMM yyyy')}</span>}
            {user && <span>Reminders in {user.timezone}</span>}
          </div>
        </CardContent>
      </Card>

      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile icon={Briefcase} label="Applications" value={stats.total} hint={`${stats.active} still active`} />
            <StatTile icon={Reply} label="Response rate" value={percent(stats.response_rate)} hint="Heard back — past Applied or Awaiting, rejections included" />
            <StatTile icon={MessagesSquare} label="In interviews" value={stats.interviewing} hint="Round 1, round 2 or interview" />
            <StatTile icon={Trophy} label="Offers" value={stats.offers} hint={`${percent(stats.offer_rate)} offer rate`} />
            <StatTile icon={Hourglass} label="Due for a check-in" value={stats.due_today} hint="Reminders due today or overdue" />
            <StatTile
              icon={CalendarDays}
              label="Closed"
              value={stats.closed}
              hint={`${stats.offers} offer${stats.offers === 1 ? '' : 's'} · ${stats.rejected} rejection${stats.rejected === 1 ? '' : 's'}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <WeeklyChart weekly={stats.weekly} />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <StageBreakdown byStage={stats.by_stage} total={stats.total} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold">Coming up</h3>
              <p className="mb-4 text-sm text-muted">Your next OAs, interviews and deadlines</p>
              {stats.upcoming_events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No scheduled events. Set a stage with a date to see it here.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.upcoming_events.map((e) => (
                    <li key={e.application_id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="w-24 font-mono text-xs">
                        <p className="text-fg">{formatDate(e.event_date, 'EEE d MMM')}</p>
                        <p className="text-subtle">{relativeDay(e.event_date)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.company_name}</p>
                        <p className="truncate text-sm text-muted">{e.role}</p>
                      </div>
                      <StagePill stage={e.stage} customLabel={e.custom_stage_label} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <ExtensionCard />
          <YourDataCard />
        </div>
      )}
    </>
  )
}
