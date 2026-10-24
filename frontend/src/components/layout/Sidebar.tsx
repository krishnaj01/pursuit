import { SiGithub } from '@icons-pack/react-simple-icons'
import { Heart, Star } from 'lucide-react'
import { NavLink } from 'react-router'

import { useApplications } from '@/api/applications'
import { IconLink } from '@/components/ui/IconLink'
import { SOCIAL_LINKS } from '@/lib/socials'
import { cn } from '@/lib/utils'

import { Copyright } from './Copyright'
import { Logo } from './Logo'
import { NAV_ITEMS } from './navItems'

export function Sidebar() {
  const { data: due } = useApplications('due')

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-border bg-surface/70 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-10 flex flex-col gap-1">
        <span className="px-3 pb-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Workspace</span>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive ? 'bg-fg text-bg shadow-md' : 'text-muted hover:bg-surface-sunken hover:text-fg',
              )
            }
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {to === '/pipeline' && !!due?.length && (
              <span className="rounded-full bg-highlight px-1.5 py-0.5 font-mono text-[10px] font-semibold text-highlight-fg">
                {due.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-border bg-surface-raised p-4">
        <p className="font-display text-sm font-semibold">Stay on the follow-up.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Reminders surface in the bell each morning. Check in, then schedule the next nudge.
        </p>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1">
        <IconLink href={SOCIAL_LINKS.github} label="GitHub">
          <SiGithub />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.support} label="Support" className="hover:text-danger">
          <Heart />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.repo} label="Star on GitHub" className="hover:text-warning">
          <Star />
        </IconLink>
      </div>
      <Copyright className="mt-2 text-center" />
    </aside>
  )
}
