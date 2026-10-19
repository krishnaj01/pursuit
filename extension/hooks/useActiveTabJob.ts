import { useEffect, useState } from 'react'

import type { JobDetails } from '@/lib/types'

/** Read job details from the current tab: inject the extractor (activeTab grants access
 *  for this click only), then call it. Falls back to just the URL on pages we can't read. */
export function useActiveTabJob() {
  const [details, setDetails] = useState<JobDetails | null>(null)

  useEffect(() => {
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      const url = tab?.url ?? ''
      if (!tab?.id || !/^https?:/.test(url)) {
        setDetails({ jobUrl: '', source: 'none' })
        return
      }
      try {
        await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ['/extract.js'] })
        const [result] = await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => (globalThis as typeof globalThis & { __pursuitExtract?: () => unknown }).__pursuitExtract?.(),
        })
        setDetails((result?.result as JobDetails | undefined) ?? { jobUrl: url, source: 'none' })
      } catch {
        // e.g. the Chrome Web Store or other pages extensions may not script.
        setDetails({ jobUrl: url, source: 'none' })
      }
    })()
  }, [])

  return details
}
