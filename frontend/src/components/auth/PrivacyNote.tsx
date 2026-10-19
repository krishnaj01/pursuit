import { Clock, Cookie, Download, Image, ListChecks, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react'

const ITEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: UserRound,
    title: 'Your Google profile',
    body: 'Name, email and photo — to sign you in and show your profile. We never see your password or anything else in your Google account.',
  },
  {
    icon: ListChecks,
    title: 'What you add',
    body: 'Companies, roles, dates, stages, notes and reminders — only to run your pipeline and stats.',
  },
  {
    icon: Clock,
    title: 'Your timezone',
    body: 'So reminders land on the right day for you.',
  },
  {
    icon: Image,
    title: 'Company logos',
    body: "To fetch a logo, only the company name or website is sent to logo.dev or Google's favicon service — never anything about you.",
  },
  {
    icon: Cookie,
    title: 'One sign-in cookie',
    body: 'Keeps you signed in. No ads, analytics or tracking, and your data is never sold or shared.',
  },
  {
    icon: Download,
    title: 'Yours to take or delete',
    body: 'Download everything as CSV or delete your account and all its data any time from your profile.',
  },
]

export function PrivacyNote() {
  return (
    <section id="privacy" aria-labelledby="privacy-title" className="w-full scroll-mt-8 rounded-xl border border-border bg-surface/80 p-6 text-left shadow-md backdrop-blur sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <h2 id="privacy-title" className="text-lg font-semibold">What we store, and why</h2>
          <p className="text-sm text-muted">The short version — no fine print.</p>
        </div>
      </div>
      <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-subtle" />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
