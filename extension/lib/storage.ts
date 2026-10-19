import { storage } from '#imports'

/** Personal access token from the Pursuit "Connect extension" page. */
export const tokenItem = storage.defineItem<string | null>('local:token', { fallback: null })

/** Whether the user turned on the auto-prompt on job sites. */
export const autoPromptItem = storage.defineItem<boolean>('local:autoPrompt', { fallback: false })
