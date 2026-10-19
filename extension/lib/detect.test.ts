import { describe, expect, it } from 'vitest'

import { looksSubmitted } from './detect'

describe('looksSubmitted', () => {
  it('recognises confirmation URLs', () => {
    expect(looksSubmitted('https://jobs.lever.co/linear/abc/thanks', '')).toBe(true)
    expect(looksSubmitted('https://job-boards.greenhouse.io/acme/jobs/1/confirmation', '')).toBe(true)
  })

  it('recognises confirmation wording', () => {
    for (const text of [
      'Thank you for applying to Ramp!',
      'Your application has been submitted.',
      "We've received your application",
      'Application Submitted',
      'You have successfully applied',
    ]) {
      expect(looksSubmitted('https://jobs.ashbyhq.com/ramp/1/application', text)).toBe(true)
    }
  })

  it('ignores ordinary posting and form pages', () => {
    expect(looksSubmitted('https://jobs.lever.co/linear/abc', 'Apply for this job. Submit application')).toBe(false)
    expect(looksSubmitted('https://jobs.ashbyhq.com/ramp/1', 'About the role… Application form')).toBe(false)
    expect(looksSubmitted('https://jobs.lever.co/x/1', 'Thank you for your interest in joining us!')).toBe(false)
  })
})
