import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Logo } from '@/components/layout/Logo'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { APP_NAME } from '@/lib/constants'
import { SOCIAL_LINKS } from '@/lib/socials'

const LAST_UPDATED = '20 October 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted [&_strong]:font-medium [&_strong]:text-fg">
        {children}
      </div>
    </section>
  )
}

/** Public privacy policy — also the policy URL for the Chrome Web Store listing. */
export function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col px-6 pt-6 pb-4 sm:px-10">
      <header className="flex items-center justify-between">
        <Link to="/" aria-label={`${APP_NAME} home`}>
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 py-14">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">Privacy policy</span>
          <h1 className="text-4xl font-semibold">Your data, plainly</h1>
          <p className="text-sm text-subtle">Last updated {LAST_UPDATED}</p>
        </div>

        <Section title="What we store">
          <p>
            <strong>Your Google profile</strong> — name, email address and profile photo, shared by Google when you sign in.
            We never see your Google password or anything else in your Google account.
          </p>
          <p>
            <strong>What you add</strong> — companies, roles, dates, stages, job posting links, notes, reminders and the
            history of each application.
          </p>
          <p>
            <strong>Your timezone</strong> — so reminders arrive on the right day for you.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            Only to run {APP_NAME} for you: showing your pipeline, building your daily reminders and your stats. We don't
            show ads, don't use analytics or tracking, and never sell or share your data.
          </p>
        </Section>

        <Section title="The browser extension">
          <p>
            The {APP_NAME} extension reads a job page <strong>only when you click its icon</strong>, to pre-fill the
            company, role and link. If you turn on <strong>auto-prompt</strong>, it also checks pages on supported job
            sites (Greenhouse, Lever, Ashby and Workday) for an "application submitted" confirmation, so it can offer to
            log the application.
          </p>
          <p>
            Nothing is saved without your click. Details are sent only to your {APP_NAME} account, using a token you can
            disconnect at any time from your profile. The extension doesn't read other websites, your browsing history or
            anything you type into application forms.
          </p>
        </Section>

        <Section title="Services we rely on">
          <p>
            <strong>Google</strong> for sign-in. <strong>logo.dev</strong> and <strong>Google's favicon service</strong>{' '}
            to fetch company logos — they receive only a company name or website, never anything about you. Our hosting
            and database providers store the data above on our behalf.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            From your <Link to="/profile" className="text-accent underline underline-offset-4">profile</Link> you can
            download everything as a CSV file, disconnect browser extensions, or permanently delete your account and all
            of its data. One sign-in cookie keeps you signed in; signing out removes it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests? Open an issue on{' '}
            <a
              href={`${SOCIAL_LINKS.repo}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </Section>
      </main>

      <SiteFooter className="mx-auto mt-0 max-w-2xl" />
    </div>
  )
}
