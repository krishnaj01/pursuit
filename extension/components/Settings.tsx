import { useEffect, useState } from 'react'

import { JOB_SITE_PATTERNS } from '@/lib/config'
import { hasJobSitePermission } from '@/lib/registration'
import { autoPromptItem, tokenItem } from '@/lib/storage'

export function Settings({ onDisconnect }: { onDisconnect: () => void }) {
  const [autoPrompt, setAutoPrompt] = useState(false)

  useEffect(() => {
    void Promise.all([autoPromptItem.getValue(), hasJobSitePermission()]).then(([enabled, granted]) =>
      setAutoPrompt(enabled && granted),
    )
  }, [])

  const toggle = async () => {
    if (autoPrompt) {
      await autoPromptItem.setValue(false)
      await browser.permissions.remove({ origins: JOB_SITE_PATTERNS })
      setAutoPrompt(false)
      return
    }
    // Must be called straight from the click so Chrome shows its permission prompt.
    const granted = await browser.permissions.request({ origins: JOB_SITE_PATTERNS })
    await autoPromptItem.setValue(granted)
    setAutoPrompt(granted)
  }

  const disconnect = async () => {
    await tokenItem.setValue(null)
    onDisconnect()
  }

  return (
    <footer className="flex flex-col gap-2 border-t border-border bg-surface-raised px-4 py-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={autoPrompt}
          onChange={() => void toggle()}
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span>
          <span className="block text-xs font-medium">Auto-prompt on job sites</span>
          <span className="block text-[11px] leading-snug text-muted">
            Offer to log right after you submit on Greenhouse, Lever, Ashby or Workday.
          </span>
        </span>
      </label>
      <button type="button" onClick={() => void disconnect()} className="self-start text-[11px] text-subtle hover:text-danger">
        Disconnect this browser
      </button>
    </footer>
  )
}
