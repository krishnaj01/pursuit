import { Navigate, Outlet, useLocation } from 'react-router'

import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'

import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { Topbar } from './Topbar'

export function AppShell() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Skeleton className="h-2 w-40" />
      </div>
    )
  }
  // Remember where the user was headed (e.g. /extension/connect) to return after sign-in.
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return (
    <div className="min-h-dvh">
      <Sidebar />
      {/* Column fills the screen so the footer sits at the bottom of short pages. */}
      <div className="flex min-h-dvh flex-col lg:pl-sidebar">
        <Topbar />
        <main className="mx-auto flex w-full max-w-content flex-1 flex-col px-4 pt-8 pb-28 sm:px-8 lg:pb-8">
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
