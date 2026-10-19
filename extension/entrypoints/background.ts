import { NotConnectedError } from '@/lib/api'
import { syncContentScripts } from '@/lib/registration'
import { findDuplicates, saveApplication, todayISO } from '@/lib/save'
import { autoPromptItem } from '@/lib/storage'
import type { Application, JobDetails } from '@/lib/types'
import { DEFAULT_REMINDER_DAYS, PURSUIT_URL } from '@/lib/config'

export type LogFromPageResult =
  | { status: 'logged'; application: Application }
  | { status: 'duplicate'; application: Application }
  | { status: 'not-connected' }
  | { status: 'error'; message: string }

export interface LogFromPageMessage {
  type: 'log-from-page'
  details: JobDetails
  force?: boolean
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    await syncContentScripts()
    // First install: take the user straight to the one-time Connect step. Opened only after
    // the bridge script is registered, so the page can talk to the extension.
    if (reason === 'install') await browser.tabs.create({ url: `${PURSUIT_URL}/extension/connect` })
  })
  browser.runtime.onStartup.addListener(() => void syncContentScripts())
  browser.permissions.onAdded.addListener(() => void syncContentScripts())
  browser.permissions.onRemoved.addListener(() => void syncContentScripts())
  autoPromptItem.watch(() => void syncContentScripts())

  // The in-page prompt on job sites can't call the API itself (it runs inside the job
  // site's page), so it asks the background worker to save on its behalf.
  browser.runtime.onMessage.addListener((message: LogFromPageMessage, _sender, sendResponse) => {
    if (message?.type !== 'log-from-page') return
    void logFromPage(message).then(sendResponse)
    return true // keep the channel open for the async response
  })

  browser.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message?.type === 'open-pursuit') void browser.tabs.create({ url: `${PURSUIT_URL}/pipeline` })
  })
})

async function logFromPage({ details, force }: LogFromPageMessage): Promise<LogFromPageResult> {
  if (!details.company || !details.role) {
    return { status: 'error', message: "Couldn't read the company and role — use the toolbar button instead" }
  }
  try {
    if (!force) {
      const [existing] = await findDuplicates(details)
      if (existing) return { status: 'duplicate', application: existing }
    }
    const application = await saveApplication({
      company_name: details.company,
      company_domain: details.companyDomain ?? null,
      role: details.role,
      applied_on: todayISO(),
      reminder_days: DEFAULT_REMINDER_DAYS,
      job_url: details.jobUrl,
    })
    return { status: 'logged', application }
  } catch (error) {
    if (error instanceof NotConnectedError) return { status: 'not-connected' }
    return { status: 'error', message: error instanceof Error ? error.message : 'Something went wrong' }
  }
}
