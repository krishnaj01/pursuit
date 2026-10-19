/**
 * Talks to the Pursuit browser extension from this website via window.postMessage.
 * The extension injects a small "bridge" content script into Pursuit pages that answers
 * these messages. Keep the message names in sync with extension/lib/bridge.ts.
 */
export const BRIDGE = {
  ping: 'pursuit-extension:ping',
  pong: 'pursuit-extension:pong',
  token: 'pursuit-extension:token',
  connected: 'pursuit-extension:connected',
} as const

const PAGE_SOURCE = 'pursuit-web'
const EXTENSION_SOURCE = 'pursuit-extension'

interface BridgeReply {
  source: typeof EXTENSION_SOURCE
  type: string
  version?: string
  ok?: boolean
}

function ask(message: Record<string, unknown>, expected: string, timeoutMs: number): Promise<BridgeReply | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => finish(null), timeoutMs)
    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return
      const data = event.data as BridgeReply | undefined
      if (data?.source === EXTENSION_SOURCE && data.type === expected) finish(data)
    }
    function finish(reply: BridgeReply | null) {
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve(reply)
    }
    window.addEventListener('message', onMessage)
    window.postMessage({ source: PAGE_SOURCE, ...message }, window.location.origin)
  })
}

/** Resolves with the extension's version if it's installed and active on this page. */
export async function detectExtension(): Promise<string | null> {
  const reply = await ask({ type: BRIDGE.ping }, BRIDGE.pong, 1000)
  return reply ? (reply.version ?? 'unknown') : null
}

/** Hands a freshly created token to the extension; true once it confirms it saved it. */
export async function sendTokenToExtension(token: string): Promise<boolean> {
  const reply = await ask({ type: BRIDGE.token, token }, BRIDGE.connected, 4000)
  return !!reply?.ok
}
