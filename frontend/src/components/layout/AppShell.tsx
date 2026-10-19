import { Navigate, Outlet, useLocation } from 'react-router'

import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'

import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
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
      <div className="lg:pl-sidebar">
        <Topbar />
        <main className="mx-auto w-full max-w-content px-4 pt-8 pb-28 sm:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
