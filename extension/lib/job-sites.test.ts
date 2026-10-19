import { describe, expect, it } from 'vitest'

import { JOB_SITE_PATTERNS } from './job-sites'

/** Minimal Chrome match-pattern check (scheme + host with optional "*." prefix; any path). */
function matches(pattern: string, url: string): boolean {
  const [, scheme, host] = pattern.match(/^(\w+):\/\/([^/]+)\//) ?? []
  if (!scheme || !host) throw new Error(`Unexpected pattern: ${pattern}`)
  const target = new URL(url)
  if (target.protocol !== `${scheme}:`) return false
  return host.startsWith('*.') ? target.hostname.endsWith(host.slice(1)) : target.hostname === host
}

const covered = (url: string) => JOB_SITE_PATTERNS.some((pattern) => matches(pattern, url))

describe('JOB_SITE_PATTERNS', () => {
  it('cover the job pages the auto-prompt understands', () => {
    for (const url of [
      'https://job-boards.greenhouse.io/acme/jobs/4821',
      'https://job-boards.eu.greenhouse.io/acme/jobs/4821',
      'https://boards.greenhouse.io/acme/jobs/4821',
      'https://jobs.lever.co/linear/abc/thanks',
      'https://jobs.eu.lever.co/linear/abc',
      'https://jobs.ashbyhq.com/ramp/1/application',
      'https://nvidia.wd5.myworkdayjobs.com/en-US/Careers/job/Data-Analyst_JR1',
    ]) {
      expect(covered(url), url).toBe(true)
    }
  })

  it('stay off the rest of those companies’ sites', () => {
    for (const url of ['https://www.greenhouse.io/', 'https://www.lever.co/', 'https://app.ashbyhq.com/', 'https://www.workday.com/']) {
      expect(covered(url), url).toBe(false)
    }
  })
})
