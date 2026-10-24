import { BellRing, Copy, MousePointerClick, ShieldCheck, type LucideIcon } from 'lucide-react'

import { GetExtensionButtons } from '@/components/extension/GetExtensionButtons'

import { BrowserBar } from './BrowserBar'

const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MousePointerClick,
    title: 'One click on any job page',
    body: 'Company, role, link and date are filled in from the page, just pick a reminder and save.',
  },
  {
    icon: BellRing,
    title: 'A nudge right after you apply',
    body: 'Optional: on Greenhouse, Lever, Ashby and Workday, a small card offers to log it the moment you submit.',
  },
  {
    icon: Copy,
    title: 'No duplicates',
    body: 'It tells you when a job is already in your pipeline.',
  },
  {
    icon: ShieldCheck,
    title: 'Only on your click',
    body: 'Nothing is saved without you, and you can disconnect it from your profile any time.',
  },
]

/** Illustration of the extension's in-page card on a job board — built from tokens, not a
 *  screenshot, so it stays crisp and themed in light and dark. */
function PromptIllustration() {
  return (
    <div aria-hidden className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <BrowserBar url="jobs.lever.co/linear/…/thanks" extensionActive />
      <div className="relative h-[21rem] px-6 py-6 sm:h-72">
        <p className="font-display text-lg font-semibold">Thank you for applying!</p>
        <p className="mt-1 text-sm text-muted">We've received your application for Product Engineer.</p>
        <div className="mt-5 flex flex-col gap-2">
          <span className="h-2 w-3/4 rounded-full bg-surface-sunken" />
          <span className="h-2 w-2/3 rounded-full bg-surface-sunken" />
          <span className="h-2 w-1/2 rounded-full bg-surface-sunken" />
        </div>

        <div className="absolute right-4 bottom-4 w-64 rounded-xl border border-border bg-surface p-4 text-left shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-5 place-items-center rounded-md bg-fg text-[11px] text-bg">↗</span>
            Pursuit
            <span className="ml-auto text-muted">×</span>
          </div>
          <p className="mt-2.5 text-sm font-semibold">Product Engineer</p>
          <p className="text-xs text-muted">Linear</p>
          <p className="mt-2.5 text-xs text-muted">Application submitted? Log it with a follow-up reminder in 7 days.</p>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-lg bg-accent py-1.5 text-center text-xs font-semibold text-on-accent">Log to Pursuit</span>
            <span className="rounded-lg border border-border px-2.5 py-1.5 text-xs">Not now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Login-page section introducing the browser extension. */
export function ExtensionPromo() {
  return (
    <section aria-labelledby="extension-title" className="w-full text-left">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">Browser extension</span>
        <h2 id="extension-title" className="text-3xl font-semibold text-balance sm:text-4xl">
          Log applications where you apply
        </h2>
        <p className="max-w-lg text-balance text-muted">
          The Pursuit extension reads the job page for you, so no more copying company names and links into a form.
        </p>
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-5">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <GetExtensionButtons />
            <p className="text-xs text-subtle">Free · Chrome, Edge, Brave and Arc</p>
          </div>
        </div>
        <PromptIllustration />
      </div>
    </section>
  )
}
