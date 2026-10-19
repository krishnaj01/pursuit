import styles from './style.css?inline'

import type { LogFromPageMessage, LogFromPageResult } from '@/entrypoints/background'
import { PURSUIT_URL } from '@/lib/config'
import { looksSubmitted } from '@/lib/detect'
import { extractJobDetails } from '@/lib/extract'
import type { JobDetails } from '@/lib/types'

const REMEMBERED_KEY = 'pursuit:last-job'
const PROMPTED_KEY = 'pursuit:prompted'

// Watches supported job sites (only after the user enables auto-prompt). Registered at
// runtime by lib/registration.ts, so `matches` is intentionally empty here.
export default defineContentScript({
  matches: [],
  registration: 'runtime',
  // Styles are injected into the card's shadow root by hand (see showPrompt), so no
  // web-accessible stylesheet is needed.
  cssInjectionMode: 'manual',
  async main(ctx) {
    // Remember the posting while the user reads/fills it in: confirmation pages often
    // no longer show the company or role. sessionStorage is per tab and per site.
    const remember = () => {
      const details = extractJobDetails(document, location.href)
      if (details.company && details.role) sessionStorage.setItem(REMEMBERED_KEY, JSON.stringify(details))
    }

    const jobForPrompt = (): JobDetails | null => {
      const remembered = sessionStorage.getItem(REMEMBERED_KEY)
      const fromPage = extractJobDetails(document, location.href)
      const details = remembered ? (JSON.parse(remembered) as JobDetails) : fromPage
      return details.company && details.role ? details : null
    }

    let shown = false
    const check = async () => {
      if (shown) return
      if (!looksSubmitted(location.href, document.body?.innerText ?? '')) {
        remember()
        return
      }
      const job = jobForPrompt()
      if (!job || sessionStorage.getItem(PROMPTED_KEY) === job.jobUrl) return
      shown = true
      sessionStorage.setItem(PROMPTED_KEY, job.jobUrl)
      await showPrompt(ctx, job)
    }

    await check()
    // Many job sites are single-page apps: watch for the confirmation appearing.
    let pending: ReturnType<typeof setTimeout> | undefined
    const observer = new MutationObserver(() => {
      clearTimeout(pending)
      pending = setTimeout(() => void check(), 500)
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    ctx.onInvalidated(() => observer.disconnect())
  },
})

async function showPrompt(ctx: InstanceType<typeof ContentScriptContext>, job: JobDetails) {
  const ui = await createShadowRootUi(ctx, {
    name: 'pursuit-prompt',
    position: 'inline',
    anchor: 'body',
    onMount(container) {
      const style = document.createElement('style')
      style.textContent = styles
      container.append(style)
      const card = document.createElement('div')
      card.className = 'card'
      card.setAttribute('role', 'dialog')
      card.setAttribute('aria-label', 'Log this application to Pursuit')
      container.append(card)
      render(card, 'ask')

      function render(el: HTMLElement, state: 'ask' | 'saving' | 'logged' | 'duplicate' | 'not-connected' | 'error', message = '') {
        el.replaceChildren()
        const head = document.createElement('div')
        head.className = 'head'
        head.innerHTML = '<span class="mark">↗</span><span>Pursuit</span>'
        const close = button('×', 'close', () => ui.remove())
        close.setAttribute('aria-label', 'Dismiss')
        head.append(close)

        const jobEl = document.createElement('div')
        jobEl.className = 'job'
        const role = document.createElement('div')
        role.className = 'role'
        role.textContent = job.role ?? ''
        const company = document.createElement('div')
        company.className = 'company'
        company.textContent = job.company ?? ''
        jobEl.append(role, company)

        const actions = document.createElement('div')
        actions.className = 'actions'
        const note = document.createElement('div')
        note.className = 'note'

        if (state === 'ask' || state === 'saving') {
          note.textContent = 'Application submitted? Log it with a follow-up reminder in 7 days.'
          const log = button(state === 'saving' ? 'Saving…' : 'Log to Pursuit', 'primary', () => save(false))
          log.disabled = state === 'saving'
          actions.append(log, button('Not now', 'secondary', () => ui.remove()))
        } else if (state === 'logged') {
          note.innerHTML = '<span class="ok">✓ Logged to Pursuit</span>'
          actions.append(link('Open pipeline', `${PURSUIT_URL}/pipeline`))
        } else if (state === 'duplicate') {
          note.textContent = message
          actions.append(link('Open pipeline', `${PURSUIT_URL}/pipeline`), button('Log anyway', 'secondary', () => save(true)))
        } else if (state === 'not-connected') {
          note.textContent = 'Connect the extension to your Pursuit account first.'
          actions.append(link('Connect', `${PURSUIT_URL}/extension/connect`))
        } else {
          note.innerHTML = ''
          const err = document.createElement('span')
          err.className = 'error'
          err.textContent = message
          note.append(err)
          actions.append(button('Try again', 'secondary', () => save(false)))
        }
        el.append(head, jobEl, note, document.createElement('br'), actions)
      }

      async function save(force: boolean) {
        render(card, 'saving')
        const message: LogFromPageMessage = { type: 'log-from-page', details: job, force }
        const result = (await browser.runtime.sendMessage(message)) as LogFromPageResult
        if (result.status === 'logged') render(card, 'logged')
        else if (result.status === 'duplicate')
          render(card, 'duplicate', `Already in Pursuit — logged ${new Date(result.application.created_at).toLocaleDateString()}.`)
        else if (result.status === 'not-connected') render(card, 'not-connected')
        else render(card, 'error', result.message)
      }
    },
  })
  ui.mount()
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = className
  el.textContent = label
  el.addEventListener('click', onClick)
  return el
}

function link(label: string, href: string): HTMLAnchorElement {
  const el = document.createElement('a')
  el.className = 'primary'
  el.href = href
  el.target = '_blank'
  el.rel = 'noopener noreferrer'
  el.textContent = label
  return el
}
