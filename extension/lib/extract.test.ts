import { describe, expect, it } from 'vitest'

import { extractJobDetails } from './extract'

function page(html: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head>${html}</head><body></body></html>`, 'text/html')
}

function pageWithBody(head: string, body: string): Document {
  return new DOMParser().parseFromString(`<!doctype html><html><head>${head}</head><body>${body}</body></html>`, 'text/html')
}

describe('extractJobDetails', () => {
  it('prefers schema.org JobPosting JSON-LD', () => {
    const doc = page(`
      <title>Careers</title>
      <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Senior Engineer, R&amp;D',
        hiringOrganization: { '@type': 'Organization', name: 'Acme Corp', sameAs: 'https://www.acme.com' },
      })}</script>`)
    expect(extractJobDetails(doc, 'https://acme.com/careers/123#apply')).toEqual({
      role: 'Senior Engineer, R&D',
      company: 'Acme Corp',
      companyDomain: 'acme.com',
      jobUrl: 'https://acme.com/careers/123',
      source: 'json-ld',
    })
  })

  it('finds JobPosting inside @graph and ignores malformed blocks', () => {
    const doc = page(`
      <script type="application/ld+json">{ not json</script>
      <script type="application/ld+json">${JSON.stringify({
        '@graph': [{ '@type': 'WebPage' }, { '@type': ['JobPosting'], title: 'Designer', hiringOrganization: 'Figma' }],
      })}</script>`)
    const details = extractJobDetails(doc, 'https://figma.com/careers/designer')
    expect(details.role).toBe('Designer')
    expect(details.company).toBe('Figma')
  })

  it('does not use a job board as the company website', () => {
    const doc = page(`<script type="application/ld+json">${JSON.stringify({
      '@type': 'JobPosting', title: 'SWE', hiringOrganization: { name: 'Ramp', sameAs: 'https://jobs.ashbyhq.com/ramp' },
    })}</script>`)
    expect(extractJobDetails(doc, 'https://jobs.ashbyhq.com/ramp/1').companyDomain).toBeUndefined()
  })

  it('reads Greenhouse postings from the URL and heading', () => {
    const doc = pageWithBody('<title>Job Application for Backend Engineer at Acme</title>', '<div class="job__title"><h1>Backend Engineer</h1></div>')
    const details = extractJobDetails(doc, 'https://job-boards.greenhouse.io/acme-labs/jobs/4821?gh_src=li')
    expect(details).toMatchObject({ company: 'Acme Labs', role: 'Backend Engineer', source: 'job-site' })
    expect(details.jobUrl).toBe('https://job-boards.greenhouse.io/acme-labs/jobs/4821?gh_src=li')
  })

  it('reads Lever postings', () => {
    const doc = pageWithBody('', '<div class="posting-headline"><h2>Product Engineer (Remote)</h2></div>')
    expect(extractJobDetails(doc, 'https://jobs.lever.co/linear/9f1c-uuid')).toMatchObject({
      company: 'Linear',
      role: 'Product Engineer',
    })
  })

  it('reads Ashby and Workday postings', () => {
    expect(
      extractJobDetails(pageWithBody('', '<h1>Software Engineer, Payments</h1>'), 'https://jobs.ashbyhq.com/ramp/abc'),
    ).toMatchObject({ company: 'Ramp', role: 'Software Engineer, Payments' })
    expect(
      extractJobDetails(
        pageWithBody('', '<h2 data-automation-id="jobPostingHeader">Data Analyst</h2>'),
        'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/Data-Analyst_JR1',
      ),
    ).toMatchObject({ company: 'Nvidia', role: 'Data Analyst' })
  })

  it('falls back to Open Graph and "Role at Company" titles', () => {
    expect(
      extractJobDetails(page('<meta property="og:title" content="Frontend Engineer at Vercel | Careers">'), 'https://vercel.com/careers/x'),
    ).toMatchObject({ role: 'Frontend Engineer', company: 'Vercel', source: 'meta' })
    expect(
      extractJobDetails(page('<title>Notion - Software Engineer Intern - Careers</title>'), 'https://notion.so/careers/1'),
    ).toMatchObject({ role: 'Software Engineer Intern', company: 'Notion' })
  })

  it('uses og:site_name as the company unless it is generic', () => {
    expect(
      extractJobDetails(
        page('<meta property="og:site_name" content="Stripe"><meta property="og:title" content="Backend Engineer">'),
        'https://stripe.com/jobs/1',
      ),
    ).toMatchObject({ company: 'Stripe', role: 'Backend Engineer' })
    expect(
      extractJobDetails(page('<meta property="og:site_name" content="Careers"><title>Designer</title>'), 'https://x.com/1').company,
    ).toBeUndefined()
  })

  it('only trusts a same-site canonical link', () => {
    expect(
      extractJobDetails(page('<link rel="canonical" href="/jobs/42">'), 'https://acme.com/jobs/42?utm_source=x').jobUrl,
    ).toBe('https://acme.com/jobs/42')
    expect(
      extractJobDetails(page('<link rel="canonical" href="https://elsewhere.com/x">'), 'https://acme.com/jobs/42').jobUrl,
    ).toBe('https://acme.com/jobs/42')
  })

  it('returns just the link when nothing is recognisable', () => {
    expect(extractJobDetails(page(''), 'https://example.com/')).toEqual({ jobUrl: 'https://example.com/', source: 'none' })
  })
})
