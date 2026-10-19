import { GoogleLogin } from '@react-oauth/google'
import { BellRing, KanbanSquare, LineChart } from 'lucide-react'
import { Navigate } from 'react-router'
import { toast } from 'sonner'

import { useGoogleSignIn } from '@/api/auth'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { errorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

const FEATURES = [
  { icon: KanbanSquare, title: 'One pipeline', body: 'Every application, ordered by what needs you next.' },
  { icon: BellRing, title: 'Timely nudges', body: 'Daily in-app reminders for follow-ups, OAs and interviews.' },
  { icon: LineChart, title: 'Honest stats', body: 'Response and offer rates that show what is working.' },
]

export function LoginPage() {
  const status = useAuthStore((s) => s.status)
  const signIn = useGoogleSignIn()
  const preference = useThemeStore((s) => s.preference)
  const isDark = document.documentElement.classList.contains('dark')

  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <div className="relative flex min-h-dvh flex-col px-6 py-6 sm:px-10">
      <header className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-14 py-16 text-center">
        <div className="flex flex-col items-center gap-6 animate-pop-in">
          <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-muted uppercase shadow-sm">
            Your job search, organised
          </span>
          <h1 className="max-w-3xl text-5xl leading-[1.02] font-semibold sm:text-7xl">
            Apply widely. <span className="relative whitespace-nowrap text-accent">Follow up<svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full text-highlight" preserveAspectRatio="none" aria-hidden><path d="M2 9C50 3 150 3 198 8" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span> wisely.
          </h1>
          <p className="max-w-lg text-lg text-muted">
            Track every application, never miss an OA or interview, and know exactly when to check back in.
          </p>
          <div className="mt-2 flex min-h-11 flex-col items-center gap-3">
            <GoogleLogin
              key={`${preference}-${isDark}`}
              onSuccess={({ credential }) =>
                credential &&
                signIn.mutate(credential, { onError: (e) => toast.error(errorMessage(e, 'Sign-in failed')) })
              }
              onError={() => toast.error('Google sign-in was cancelled or failed')}
              theme={isDark ? 'filled_black' : 'outline'}
              shape="pill"
              size="large"
              text="continue_with"
            />
            <p className="text-xs text-subtle">We only use your name, email and photo.</p>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-surface/80 p-5 text-left shadow-md backdrop-blur">
              <div className="mb-4 grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon className="size-4" />
              </div>
              <p className="font-display font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
