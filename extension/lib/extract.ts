import type { JobDetails } from './types'

/**
 * Read company, role and link from a job page. Pure (takes a Document and URL) so it can be
 * unit-tested; strategies run in priority order and each fills only what's still missing:
 *   1. schema.org JobPosting JSON-LD   2. known job sites (by URL)   3. meta tags / <title>
 */
export function extractJobDetails(doc: Document, pageUrl: string): JobDetails {
  const details: JobDetails = { jobUrl: canonicalUrl(doc, pageUrl), source: 'none' }
  const merge = (found: Partial<JobDetails>, source: JobDetails['source']) => {
    let used = false
    for (const key of ['company', 'companyDomain', 'role'] as const) {
      const value = found[key]?.trim()
      if (value && !details[key]) {
        details[key] = value
        used = true
      }
    }
    if (used && details.source === 'none') details.source = source
  }

  merge(fromJsonLd(doc), 'json-ld')
  merge(fromJobSite(doc, new URL(pageUrl)), 'job-site')
  merge(fromMeta(doc), 'meta')
  if (details.role) details.role = cleanRole(details.role)
  return details
}

// --- 1. JSON-LD ------------------------------------------------------------------------

type Json = Record<string, unknown>

function jsonLdNodes(doc: Document): Json[] {
  const nodes: Json[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') {
      nodes.push(value as Json)
      if ('@graph' in value) visit((value as Json)['@graph'])
    }
  }
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(script.textContent ?? ''))
    } catch {
      // Malformed JSON-LD is common; ignore it and fall back to other strategies.
    }
  }
  return nodes
}

const isJobPosting = (node: Json) => {
  const type = node['@type']
  return type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))
}

function fromJsonLd(doc: Document): Partial<JobDetails> {
  const posting = jsonLdNodes(doc).find(isJobPosting)
  if (!posting) return {}
  const org = posting.hiringOrganization
  const orgJson = org && typeof org === 'object' ? (org as Json) : undefined
  const company = typeof org === 'string' ? org : asText(orgJson?.name)
  const website = [orgJson?.sameAs, orgJson?.url].flat().find((v) => typeof v === 'string') as string | undefined
  return { role: decode(asText(posting.title)), company: decode(company), companyDomain: domainOf(website) }
}

// --- 2. Known job sites -----------------------------------------------------------------

const JOB_BOARD_HOSTS = /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|linkedin\.com|indeed\.com|glassdoor\.com|wellfound\.com|workable\.com|smartrecruiters\.com)$/i

function fromJobSite(doc: Document, url: URL): Partial<JobDetails> {
  const host = url.hostname
  const segments = url.pathname.split('/').filter(Boolean)
  const heading = (selector: string) => doc.querySelector(selector)?.textContent?.trim() || undefined

  if (/(^|\.)greenhouse\.io$/.test(host) && segments[1] === 'jobs') {
    return { company: humanizeSlug(segments[0]), role: heading('.job__title h1, h1.app-title, h1') }
  }
  if (/(^|\.)lever\.co$/.test(host) && segments.length >= 2) {
    return { company: humanizeSlug(segments[0]), role: heading('.posting-headline h2, h2') }
  }
  if (/(^|\.)ashbyhq\.com$/.test(host) && segments.length >= 2) {
    return { company: humanizeSlug(segments[0]), role: heading('h1') }
  }
  if (/\.myworkdayjobs\.com$/.test(host)) {
    return {
      company: humanizeSlug(host.split('.')[0]),
      role: heading('[data-automation-id="jobPostingHeader"]') ?? heading('h1, h2'),
    }
  }
  return {}
}

// --- 3. Meta tags and the page title ---------------------------------------------------

const TITLE_PATTERNS = [
  /^(?<role>.+?)\s+(?:at|@)\s+(?<company>.+?)(?:\s*[|·–—-]\s*.*)?$/i, // "Engineer at Stripe | Careers"
  /^(?<company>[^|–—-]+?)\s*[|–—-]\s*(?<role>.+?)\s*[|–—-]\s*(?:careers|jobs)\b.*$/i, // "Stripe - Engineer - Careers"
]
const GENERIC_SITE_NAMES = /^(careers?|jobs?|job board|linkedin|indeed|glassdoor|greenhouse|lever|ashby|workday)$/i

function fromMeta(doc: Document): Partial<JobDetails> {
  const meta = (name: string) =>
    doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute('content')?.trim() || undefined
  const title = meta('og:title') ?? meta('twitter:title') ?? (doc.title.trim() || undefined)
  const siteName = meta('og:site_name')
  const result: Partial<JobDetails> = {}
  if (siteName && !GENERIC_SITE_NAMES.test(siteName)) result.company = siteName

  if (title) {
    for (const pattern of TITLE_PATTERNS) {
      const match = title.match(pattern)
      if (match?.groups) {
        result.role = match.groups.role
        result.company ??= match.groups.company
        return result
      }
    }
    result.role = title.split(/\s[|–—]\s/)[0]
  }
  return result
}

// --- Helpers ------------------------------------------------------------------------------

function canonicalUrl(doc: Document, pageUrl: string): string {
  const href = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
  try {
    const page = new URL(pageUrl)
    const canonical = href ? new URL(href, page) : null
    // Only trust a canonical link on the same site; some job boards point it elsewhere.
    const chosen = canonical && canonical.hostname === page.hostname ? canonical : page
    chosen.hash = ''
    return chosen.toString()
  } catch {
    return pageUrl
  }
}

function domainOf(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return JOB_BOARD_HOSTS.test(host) ? undefined : host
  } catch {
    return undefined
  }
}

function humanizeSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const asText = (value: unknown) => (typeof value === 'string' ? value : undefined)

/** JSON-LD values are often HTML-escaped ("R&amp;D"). */
function decode(text: string | undefined): string | undefined {
  if (!text) return text
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

/** Drop noise job boards append to titles: "(Remote)", "- Remote, US", "Job Application for". */
function cleanRole(role: string): string {
  return role
    .replace(/^job application for\s+/i, '')
    .replace(/\s*[([]\s*(remote|hybrid|on-?site)[^)\]]*[)\]]\s*$/i, '')
    .replace(/\s+[-–—]\s+(remote|hybrid|on-?site)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}
