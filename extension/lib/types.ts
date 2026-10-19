/** Job details read from a page. Every field is optional except the URL — the popup lets
 *  the user fill in or correct anything that couldn't be found. */
export interface JobDetails {
  company?: string
  companyDomain?: string
  role?: string
  jobUrl: string
  /** Which strategy produced the details, for debugging. */
  source: 'json-ld' | 'job-site' | 'meta' | 'none'
}

export interface Application {
  id: string
  company_name: string
  role: string
  applied_on: string
  stage: string
  job_url: string | null
  created_at: string
}

export interface NewApplication {
  company_name: string
  company_domain?: string | null
  logo_url?: string | null
  role: string
  applied_on: string
  reminder_days?: number
  job_url?: string | null
  notes?: string | null
}
