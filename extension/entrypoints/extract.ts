import { extractJobDetails } from '@/lib/extract'

// Injected into the active tab by the popup (activeTab + scripting). It exposes the
// extractor on the extension's isolated world; the popup then calls it in a second step.
export default defineUnlistedScript(() => {
  ;(globalThis as typeof globalThis & { __pursuitExtract?: () => unknown }).__pursuitExtract = () =>
    extractJobDetails(document, location.href)
})
