import { Navigate, Outlet } from 'react-router'

import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/stores/authStore'

import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Skeleton className="h-2 w-40" />
      </div>
    )
  }
  if (status === 'anonymous') return <Navigate to="/login" replace />

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-sidebar">
        <Topbar />
        <main className="mx-auto w-full max-w-content px-4 pt-8 pb-28 sm:px-8 lg:pb-16">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
