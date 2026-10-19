/**
 * Job-board pages the optional auto-prompt may watch — the single source of truth, used by
 * wxt.config.ts (optional_host_permissions) and by the runtime code. Scoped to the
 * subdomains where postings and applications actually live, so Chrome's permission prompt
 * names those hosts rather than "all greenhouse.io sites".
 */
export const JOB_SITE_PATTERNS = [
  'https://job-boards.greenhouse.io/*',
  'https://job-boards.eu.greenhouse.io/*',
  'https://boards.greenhouse.io/*',
  'https://jobs.lever.co/*',
  'https://jobs.eu.lever.co/*',
  'https://jobs.ashbyhq.com/*',
  // Workday gives every company its own subdomain (e.g. nvidia.wd5.myworkdayjobs.com).
  'https://*.myworkdayjobs.com/*',
]
