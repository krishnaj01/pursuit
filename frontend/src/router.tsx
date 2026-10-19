import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'

// Pages are code-split; heavy dependencies (e.g. charts) load only where used.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppShell />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/pages/NewApplicationPage')).NewApplicationPage }) },
      { path: 'pipeline', lazy: async () => ({ Component: (await import('@/pages/PipelinePage')).PipelinePage }) },
      { path: 'profile', lazy: async () => ({ Component: (await import('@/pages/ProfilePage')).ProfilePage }) },
      { path: '*', lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
])
