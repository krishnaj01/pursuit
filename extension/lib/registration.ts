import { browser } from '#imports'

import { JOB_SITE_PATTERNS, PURSUIT_ORIGIN_PATTERN } from './config'
import { autoPromptItem } from './storage'

// Content scripts are registered at runtime rather than in the manifest, so the job-site
// script only runs after the user grants those (optional) site permissions.
const BRIDGE_ID = 'pursuit-bridge'
const JOB_SITES_ID = 'job-sites'

async function registered(): Promise<Set<string>> {
  const scripts = await browser.scripting.getRegisteredContentScripts()
  return new Set(scripts.map((s) => s.id))
}

export async function hasJobSitePermission(): Promise<boolean> {
  return browser.permissions.contains({ origins: JOB_SITE_PATTERNS })
}

/** Make the registered content scripts match the current settings and permissions. */
export async function syncContentScripts(): Promise<void> {
  const ids = await registered()
  if (!ids.has(BRIDGE_ID)) {
    await browser.scripting.registerContentScripts([
      { id: BRIDGE_ID, js: ['content-scripts/pursuit-bridge.js'], matches: [PURSUIT_ORIGIN_PATTERN], runAt: 'document_start' },
    ])
  }

  const wanted = (await autoPromptItem.getValue()) && (await hasJobSitePermission())
  if (wanted && !ids.has(JOB_SITES_ID)) {
    await browser.scripting.registerContentScripts([
      { id: JOB_SITES_ID, js: ['content-scripts/job-sites.js'], matches: JOB_SITE_PATTERNS, runAt: 'document_idle' },
    ])
  } else if (!wanted && ids.has(JOB_SITES_ID)) {
    await browser.scripting.unregisterContentScripts({ ids: [JOB_SITES_ID] })
  }
}
