import { useState } from 'react'
import { toast } from 'sonner'

import { useUpdateApplication } from '@/api/applications'
import { useCompanyLogo } from '@/api/logos'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { errorMessage } from '@/lib/api'
import { type LogoValue, pickLogoUrl } from '@/lib/logos'
import { isHttpUrl } from '@/lib/utils'
import type { Application, ApplicationUpdate } from '@/types'

import { LogoPicker } from './LogoPicker'
import { TimelineEditor } from './TimelineEditor'

const CACHED_LOGO_PREFIX = '/api/v1/logos/'

function initialLogo(app: Application): LogoValue {
  if (!app.logo_url) return { mode: 'none', customUrl: '' }
  if (app.logo_url.startsWith(CACHED_LOGO_PREFIX)) return { mode: 'auto', customUrl: '' }
  return { mode: 'custom', customUrl: app.logo_url }
}

const formFrom = (app: Application) => ({
  company_name: app.company_name,
  company_domain: app.company_domain ?? '',
  role: app.role,
  job_url: app.job_url ?? '',
  notes: app.notes ?? '',
})

interface EditApplicationDialogProps {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditApplicationDialog({ application, open, onOpenChange }: EditApplicationDialogProps) {
  const update = useUpdateApplication()
  // Snapshot at open: only fields the user changes are sent. The applied date is edited
  // through the timeline's first entry, so the two can never disagree.
  const [initial] = useState(() => formFrom(application))
  const [form, setForm] = useState(initial)
  const [initialLogoValue] = useState(() => initialLogo(application))
  const [logo, setLogo] = useState<LogoValue>(initialLogoValue)
  const lookup = useCompanyLogo(form.company_name, form.company_domain)

  const jobUrlError =
    form.job_url.trim() && !isHttpUrl(form.job_url.trim()) ? 'Paste the full link, starting with https://' : undefined

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    const changes: ApplicationUpdate = {}
    if (form.company_name !== initial.company_name) changes.company_name = form.company_name.trim()
    if (form.company_domain !== initial.company_domain) changes.company_domain = form.company_domain.trim() || null
    if (form.role !== initial.role) changes.role = form.role.trim()
    if (form.job_url !== initial.job_url) changes.job_url = form.job_url.trim() || null
    if (form.notes !== initial.notes) changes.notes = form.notes.trim() || null
    const logoUrl = pickLogoUrl(logo, lookup.data?.logo_url ?? application.logo_url)
    if (logo !== initialLogoValue || logoUrl !== application.logo_url) changes.logo_url = logoUrl

    if (!Object.keys(changes).length) return onOpenChange(false)
    try {
      await update.mutateAsync({ id: application.id, ...changes })
      toast.success('Application updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save changes'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Edit application" className="max-w-xl">
      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="edit-company">
            <Input id="edit-company" value={form.company_name} onChange={set('company_name')} />
          </Field>
          <Field label="Website" htmlFor="edit-domain">
            <Input id="edit-domain" placeholder="stripe.com" value={form.company_domain} onChange={set('company_domain')} />
          </Field>
          <Field label="Role" htmlFor="edit-role" className="sm:col-span-2">
            <Input id="edit-role" value={form.role} onChange={set('role')} />
          </Field>
          <Field label="Job posting" htmlFor="edit-job-url" error={jobUrlError} className="sm:col-span-2">
            <Input
              id="edit-job-url"
              type="url"
              inputMode="url"
              placeholder="https://company.com/careers/role"
              value={form.job_url}
              onChange={set('job_url')}
              aria-invalid={!!jobUrlError}
            />
          </Field>
        </div>
        <LogoPicker
          company={form.company_name}
          value={logo}
          onChange={setLogo}
          autoUrl={lookup.data?.logo_url ?? (logo.mode === 'auto' ? application.logo_url : null)}
          resolvedDomain={lookup.data?.domain ?? application.company_domain}
          isFetching={lookup.isFetching}
        />
        <Field label="Notes" htmlFor="edit-notes">
          <Textarea id="edit-notes" value={form.notes} onChange={set('notes')} />
        </Field>

        <TimelineEditor applicationId={application.id} />
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={save} loading={update.isPending} disabled={!form.company_name.trim() || !form.role.trim() || !!jobUrlError}>
          Save changes
        </Button>
      </div>
    </Dialog>
  )
}
