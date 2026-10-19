import { AlertTriangle, ExternalLink, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { api, logoSrc } from '@/lib/api'
import { DEFAULT_REMINDER_DAYS, PURSUIT_URL, REMINDER_PRESETS } from '@/lib/config'
import { findDuplicates, saveApplication, todayISO } from '@/lib/save'
import type { Application, JobDetails } from '@/lib/types'

import { Button, Field } from './ui'

interface LogFormProps {
  details: JobDetails
  onSaved: (application: Application) => void
  onError: (error: unknown) => void
}

export function LogForm({ details, onSaved, onError }: LogFormProps) {
  const [form, setForm] = useState({
    company: details.company ?? '',
    role: details.role ?? '',
    jobUrl: details.jobUrl,
    appliedOn: todayISO(),
    notes: '',
  })
  const [reminder, setReminder] = useState<number | null>(DEFAULT_REMINDER_DAYS)
  const [duplicate, setDuplicate] = useState<Application | null>(null)
  const [logo, setLogo] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Warn early if this job is already in Pursuit.
  useEffect(() => {
    if (!details.jobUrl && !(details.company && details.role)) return
    findDuplicates(details)
      .then(([existing]) => setDuplicate(existing ?? null))
      .catch(onError)
  }, [details, onError])

  // Logo preview, debounced while the company name is edited.
  useEffect(() => {
    const company = form.company.trim()
    if (company.length < 2) return setLogo(undefined)
    const timer = setTimeout(() => {
      api
        .resolveLogo({ company, domain: details.companyDomain })
        .then((result) => setLogo(logoSrc(result.logo_url)))
        .catch(() => setLogo(undefined))
    }, 400)
    return () => clearTimeout(timer)
  }, [form.company, details.companyDomain])

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const valid = form.company.trim() && form.role.trim() && (!form.jobUrl || /^https?:\/\//.test(form.jobUrl.trim()))

  const save = async () => {
    setSaving(true)
    setError(undefined)
    try {
      const application = await saveApplication({
        company_name: form.company.trim(),
        company_domain: details.companyDomain ?? null,
        role: form.role.trim(),
        applied_on: form.appliedOn,
        job_url: form.jobUrl.trim() || null,
        notes: form.notes.trim() || null,
        ...(reminder === null ? {} : { reminder_days: reminder }),
      })
      onSaved(application)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      onError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-3 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) void save()
      }}
    >
      {duplicate && (
        <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <div>
            <p className="font-medium text-fg">Already in Pursuit</p>
            <p className="text-muted">
              {duplicate.company_name} · {duplicate.role}, logged {new Date(duplicate.created_at).toLocaleDateString()}.{' '}
              <a href={`${PURSUIT_URL}/pipeline`} target="_blank" rel="noreferrer" className="text-accent underline">
                Open
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-raised text-xs font-semibold text-muted">
          {logo ? <img src={logo} alt="" className="size-full bg-white object-contain p-0.5" /> : (form.company[0] ?? '?').toUpperCase()}
        </div>
        <div className="flex-1">
          <Field label="Company" htmlFor="company">
            <input id="company" className="field" value={form.company} onChange={set('company')} placeholder="e.g. Stripe" autoFocus={!form.company} />
          </Field>
        </div>
      </div>
      <Field label="Role" htmlFor="role">
        <input id="role" className="field" value={form.role} onChange={set('role')} placeholder="e.g. Software Engineer" />
      </Field>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Job posting" htmlFor="jobUrl">
          <input id="jobUrl" className="field font-mono text-xs" value={form.jobUrl} onChange={set('jobUrl')} placeholder="https://…" />
        </Field>
        <Field label="Applied" htmlFor="appliedOn">
          <input id="appliedOn" type="date" className="field w-36" value={form.appliedOn} max={todayISO()} onChange={set('appliedOn')} />
        </Field>
      </div>

      <div>
        <span className="label">Remind me to check in</span>
        <div className="flex flex-wrap gap-1.5">
          {[...REMINDER_PRESETS, null].map((days) => (
            <button
              key={days ?? 'none'}
              type="button"
              onClick={() => setReminder(days)}
              aria-pressed={reminder === days}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
            >
              {days === null ? 'No reminder' : `${days} days`}
            </button>
          ))}
        </div>
      </div>

      <Field label="Notes (optional)" htmlFor="notes">
        <textarea id="notes" rows={2} className="field resize-none" value={form.notes} onChange={set('notes')} placeholder="Referral, recruiter, what to prepare…" />
      </Field>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={!valid || saving}>
          {saving && <LoaderCircle className="animate-spin" />}
          {duplicate ? 'Log anyway' : 'Log application'}
        </Button>
        <Button variant="secondary" onClick={() => void browser.tabs.create({ url: `${PURSUIT_URL}/pipeline` })} aria-label="Open Pursuit">
          <ExternalLink />
        </Button>
      </div>
    </form>
  )
}
