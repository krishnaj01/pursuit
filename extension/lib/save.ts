import { api } from './api'
import type { Application, JobDetails, NewApplication } from './types'

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Applications that look like this job (same link, or same company + role). */
export async function findDuplicates(details: Pick<JobDetails, 'jobUrl' | 'company' | 'role'>): Promise<Application[]> {
  return api.lookup({
    job_url: details.jobUrl,
    ...(details.company && details.role ? { company: details.company, role: details.role } : {}),
  })
}

/** Save an application, attaching the company logo when Pursuit can find one. */
export async function saveApplication(input: Omit<NewApplication, 'logo_url'>): Promise<Application> {
  const logo = await api
    .resolveLogo({ company: input.company_name, domain: input.company_domain ?? undefined })
    .catch(() => null)
  return api.createApplication({
    ...input,
    company_domain: input.company_domain ?? logo?.domain ?? null,
    logo_url: logo?.logo_url ?? null,
  })
}
