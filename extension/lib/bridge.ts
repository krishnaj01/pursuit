/** Message names shared with the Pursuit website (frontend/src/lib/extensionBridge.ts). */
export const BRIDGE = {
  ping: 'pursuit-extension:ping',
  pong: 'pursuit-extension:pong',
  token: 'pursuit-extension:token',
  connected: 'pursuit-extension:connected',
} as const

export const PAGE_SOURCE = 'pursuit-web'
export const EXTENSION_SOURCE = 'pursuit-extension'
