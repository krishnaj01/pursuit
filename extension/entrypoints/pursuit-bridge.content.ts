import { BRIDGE, EXTENSION_SOURCE, PAGE_SOURCE } from '@/lib/bridge'
import { tokenItem } from '@/lib/storage'

// Runs on Pursuit pages only. Answers the website's "is the extension installed?" ping and
// receives the token from the Connect page. Registered at runtime by lib/registration.ts.
export default defineContentScript({
  matches: [],
  registration: 'runtime',
  main() {
    const reply = (message: Record<string, unknown>) =>
      window.postMessage({ source: EXTENSION_SOURCE, ...message }, window.location.origin)

    window.addEventListener('message', (event) => {
      // Only accept messages from this same page (not iframes or other origins).
      if (event.source !== window || event.origin !== window.location.origin) return
      const data = event.data as { source?: string; type?: string; token?: unknown } | undefined
      if (data?.source !== PAGE_SOURCE) return

      if (data.type === BRIDGE.ping) {
        reply({ type: BRIDGE.pong, version: browser.runtime.getManifest().version })
      } else if (data.type === BRIDGE.token && typeof data.token === 'string' && data.token.startsWith('pst_')) {
        void tokenItem.setValue(data.token).then(() => reply({ type: BRIDGE.connected, ok: true }))
      }
    })
  },
})
