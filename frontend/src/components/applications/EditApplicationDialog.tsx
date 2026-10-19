import { useState } from 'react'
import { toast } from 'sonner'

import { useApplicationHistory, useUpdateApplication } from '@/api/applications'
import { useCompanyLogo } from '@/api/logos'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { stageLabel } from '@/lib/stages'
import { errorMessage } from '@/lib/api'
import { type LogoValue, pickLogoUrl } from '@/lib/logos'
import { formatDate, todayISO } from '@/lib/utils'
import type { Application } from '@/types'

import { LogoPicker } from './LogoPicker'

const CACHED_LOGO_PREFIX = '/api/v1/logos/'

function initialLogo(app: Application): LogoValue {
  if (!app.logo_url) return { mode: 'none', customUrl: '' }
  if (app.logo_url.startsWith(CACHED_LOGO_PREFIX)) return { mode: 'auto', customUrl: '' }
  return { mode: 'custom', customUrl: app.logo_url }
}

interface EditApplicationDialogProps {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditApplicationDialog({ application, open, onOpenChange }: EditApplicationDialogProps) {
  const update = useUpdateApplication()
  const history = useApplicationHistory(application.id, open)
  const [form, setForm] = useState({
    company_name: application.company_name,
    company_domain: application.company_domain ?? '',
    role: application.role,
    applied_on: application.applied_on,
    notes: application.notes ?? '',
  })
  const [logo, setLogo] = useState<LogoValue>(() => initialLogo(application))
  const lookup = useCompanyLogo(form.company_name, form.company_domain)

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    try {
      await update.mutateAsync({
        id: application.id,
        company_name: form.company_name.trim(),
        company_domain: form.company_domain.trim() || null,
        role: form.role.trim(),
        applied_on: form.applied_on,
        notes: form.notes.trim() || null,
        logo_url: pickLogoUrl(logo, lookup.data?.logo_url ?? application.logo_url),
      })
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
          <Field label="Role" htmlFor="edit-role">
            <Input id="edit-role" value={form.role} onChange={set('role')} />
          </Field>
          <Field label="Date applied" htmlFor="edit-applied">
            <Input id="edit-applied" type="date" max={todayISO()} className="font-mono" value={form.applied_on} onChange={set('applied_on')} />
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

        {!!history.data?.length && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-medium">Timeline</p>
            <ol className="relative flex flex-col gap-3 border-l border-border pl-5">
              {history.data.map((event) => (
                <li key={event.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-surface bg-accent" />
                  <span className="font-medium">{stageLabel(event.to_stage, event.custom_stage_label)}</span>
                  {event.event_date && <span className="text-muted"> · on {formatDate(event.event_date)}</span>}
                  <span className="block font-mono text-[11px] text-subtle">{formatDate(event.created_at, 'd MMM yyyy, HH:mm')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={save} loading={update.isPending} disabled={!form.company_name.trim() || !form.role.trim()}>
          Save changes
        </Button>
      </div>
    </Dialog>
  )
}
