import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'

import { useSessionBootstrap } from '@/api/auth'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import { useThemeStore } from '@/stores/themeStore'

function Session() {
  useSessionBootstrap()
  return <RouterProvider router={router} />
}

export default function App() {
  const preference = useThemeStore((s) => s.preference)
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <Session />
        <Toaster
          theme={preference}
          position="bottom-right"
          toastOptions={{ className: '!rounded-lg !border-border !bg-surface !text-fg !font-sans !shadow-lg' }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
