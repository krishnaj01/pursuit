import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

import { NAV_ITEMS } from './navItems'

export function MobileNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-xl border border-border bg-surface/85 p-1.5 shadow-lg backdrop-blur-xl lg:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors',
              isActive ? 'bg-fg text-bg' : 'text-muted',
            )
          }
        >
          <Icon className="size-4" />
          {label.split(' ').at(-1)}
        </NavLink>
      ))}
    </nav>
  )
}
