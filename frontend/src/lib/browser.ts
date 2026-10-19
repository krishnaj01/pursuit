/** Best-effort browser name for labelling connected extensions ("Chrome on macOS"). */
export function describeBrowser(): string {
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Brave/.test(ua) || (navigator as Navigator & { brave?: unknown }).brave
        ? 'Brave'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : 'Browser'
  const os = /Mac OS X/.test(ua)
    ? 'macOS'
    : /Windows/.test(ua)
      ? 'Windows'
      : /CrOS/.test(ua)
        ? 'ChromeOS'
        : /Linux/.test(ua)
          ? 'Linux'
          : ''
  return os ? `${browser} on ${os}` : browser
}
