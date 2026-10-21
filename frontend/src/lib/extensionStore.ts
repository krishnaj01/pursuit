/**
 * Where to get the Pursuit browser extension.
 * TODO: replace with the real Chrome Web Store listing URL once the extension is published
 * (the dashboard shows it after approval, e.g. https://chromewebstore.google.com/detail/<name>/<id>).
 */
export const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/kgochhfmkjcghaoniaganmkmeodgphik'

export type BrowserFamily = 'chrome' | 'edge' | 'brave' | 'opera' | 'firefox' | 'safari' | 'other'

/** Which install steps to show first. Arc and other Chromium browsers report as Chrome. */
export function detectBrowserFamily(): BrowserFamily {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'edge'
  if (/OPR\//.test(ua)) return 'opera'
  if ((navigator as Navigator & { brave?: unknown }).brave) return 'brave'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua)) return 'safari'
  return 'other'
}
