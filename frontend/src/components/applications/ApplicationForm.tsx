import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCreateApplication } from '@/api/applications'
import { useCompanyLogo } from '@/api/logos'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { errorMessage } from '@/lib/api'
import { type LogoValue, pickLogoUrl } from '@/lib/logos'
import type { ReminderChoice } from '@/lib/reminders'
import { todayISO } from '@/lib/utils'

import { LogoPicker } from './LogoPicker'
import { ReminderPicker } from './ReminderPicker'

const DOMAIN_PATTERN = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const schema = z.object({
  company_name: z.string().trim().min(1, 'Company is required').max(200),
  company_domain: z
    .string()
    .trim()
    .transform((v) => v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
    .refine((v) => v === '' || DOMAIN_PATTERN.test(v), 'Enter a domain like stripe.com'),
  role: z.string().trim().min(1, 'Role is required').max(200),
  applied_on: z.iso.date('Pick a date').refine((v) => v <= todayISO(), "Can't be in the future"),
  reminder: z.custom<ReminderChoice>(),
  notes: z.string().max(5000),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const DEFAULT_VALUES: FormInput = {
  company_name: '',
  company_domain: '',
  role: '',
  applied_on: todayISO(),
  reminder: { mode: 'days', days: 7 },
  notes: '',
}

const DEFAULT_LOGO: LogoValue = { mode: 'auto', customUrl: '' }

export function ApplicationForm() {
  const create = useCreateApplication()
  const [logo, setLogo] = useState<LogoValue>(DEFAULT_LOGO)
  const [logoKey, setLogoKey] = useState(0)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES })

  const [company, domain] = useWatch({ control, name: ['company_name', 'company_domain'] })
  const lookup = useCompanyLogo(company ?? '', DOMAIN_PATTERN.test(domain ?? '') ? (domain ?? '') : '')

  const onSubmit = handleSubmit(async ({ reminder, company_domain, notes, ...values }) => {
    try {
      const created = await create.mutateAsync({
        ...values,
        company_domain: company_domain || lookup.data?.domain || null,
        logo_url: pickLogoUrl(logo, lookup.data?.logo_url ?? null),
        notes: notes.trim() || null,
        ...(reminder.mode === 'days' ? { reminder_days: reminder.days } : { reminder_on: reminder.date }),
      })
      toast.success(`${created.company_name} added to your pipeline`)
      reset({ ...DEFAULT_VALUES, applied_on: todayISO() })
      setLogo(DEFAULT_LOGO)
      setLogoKey((k) => k + 1)
      setFocus('company_name')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save the application'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company" htmlFor="company_name" error={errors.company_name?.message}>
          <Input id="company_name" placeholder="e.g. Stripe" autoComplete="off" autoFocus aria-invalid={!!errors.company_name} {...register('company_name')} />
        </Field>
        <Field
          label="Website"
          htmlFor="company_domain"
          error={errors.company_domain?.message}
          hint="Optional — sharpens the logo match."
        >
          <Input id="company_domain" placeholder="stripe.com" autoComplete="off" aria-invalid={!!errors.company_domain} {...register('company_domain')} />
        </Field>
        <Field label="Role" htmlFor="role" error={errors.role?.message}>
          <Input id="role" placeholder="e.g. Software Engineer Intern" aria-invalid={!!errors.role} {...register('role')} />
        </Field>
        <Field label="Date applied" htmlFor="applied_on" error={errors.applied_on?.message}>
          <Input id="applied_on" type="date" max={todayISO()} className="font-mono" aria-invalid={!!errors.applied_on} {...register('applied_on')} />
        </Field>
      </div>

      <LogoPicker
        key={logoKey}
        company={company ?? ''}
        value={logo}
        onChange={setLogo}
        autoUrl={lookup.data?.logo_url ?? null}
        resolvedDomain={lookup.data?.domain ?? null}
        isFetching={lookup.isFetching}
      />

      <Field label="Remind me to check in" hint="Counted from today, the day you add it.">
        <Controller
          control={control}
          name="reminder"
          render={({ field }) => <ReminderPicker value={field.value} onChange={field.onChange} allowToday />}
        />
      </Field>

      <Field label="Notes" htmlFor="notes" hint="Referral, job link, recruiter name…">
        <Textarea id="notes" placeholder="Anything worth remembering" {...register('notes')} />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="ghost" onClick={() => reset(DEFAULT_VALUES)}>
          Clear
        </Button>
        <Button type="submit" size="lg" loading={create.isPending}>
          Add to pipeline <ArrowRight />
        </Button>
      </div>
    </form>
  )
}
