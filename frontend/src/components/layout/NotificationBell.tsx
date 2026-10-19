import { Bell, CheckCheck } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/notifications'
import { Button } from '@/components/ui/Button'
import { cn, formatDate, relativeDay } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import type { AppNotification } from '@/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const focusApplications = useUiStore((s) => s.focusApplications)
  const unread = data?.unread_count ?? 0

  const openNotification = (notification: AppNotification) => {
    if (!notification.read_at) markRead.mutate(notification.id)
    focusApplications(notification.application_ids)
    setOpen(false)
    navigate('/pipeline')
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative grid size-9 place-items-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-fg"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-on-accent ring-2 ring-bg">
              {unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          className="z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-surface shadow-lg data-[state=open]:animate-pop-in"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-display font-semibold">Reminders</p>
              <p className="text-xs text-muted">Daily check-ins for your applications</p>
            </div>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
                <CheckCheck /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-1.5">
            {!data?.items.length ? (
              <p className="px-4 py-10 text-center text-sm text-muted">
                You're all caught up. Reminders show up here on their due day.
              </p>
            ) : (
              data.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-surface-sunken"
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-accent')} />
                  <span className="flex flex-col gap-0.5">
                    <span className={cn('text-sm', n.read_at ? 'text-muted' : 'font-medium text-fg')}>{n.title}</span>
                    <span className="text-xs leading-relaxed text-muted">{n.body}</span>
                    <span className="mt-1 font-mono text-[10px] tracking-wide text-subtle uppercase">
                      {relativeDay(n.for_date)} · {formatDate(n.for_date, 'EEE d MMM')}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
