import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center justify-between gap-4 border-b border-border/60 bg-bg/70 px-4 backdrop-blur-xl sm:px-8">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
