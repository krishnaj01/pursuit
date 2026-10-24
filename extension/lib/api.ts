import { API_BASE } from './config'
import { tokenItem } from './storage'
import type { Application, NewApplication } from './types'

export class NotConnectedError extends Error {}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await tokenItem.getValue()
  if (!token) throw new NotConnectedError('Connect the extension to Pursuit first')
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (response.status === 401) {
    // Token revoked from the Pursuit profile page (or the account was deleted).
    await tokenItem.setValue(null)
    throw new NotConnectedError('This extension was disconnected, connect it again')
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: unknown } | null
    const detail = body?.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && typeof detail[0]?.msg === 'string'
          ? detail[0].msg.replace(/^Value error, /, '')
          : `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}

export const api = {
  me: () => request<{ name: string; email: string }>('/auth/me'),
  lookup: (params: { job_url?: string; company?: string; role?: string }) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => !!v) as [string, string][])
    return request<Application[]>(`/applications/lookup?${query}`)
  },
  resolveLogo: (params: { company?: string; domain?: string }) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => !!v) as [string, string][])
    return request<{ domain: string | null; logo_url: string | null }>(`/logos/resolve?${query}`)
  },
  createApplication: (payload: NewApplication) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(payload) }),
}

/** Absolute URL for a logo path returned by the API (e.g. /api/v1/logos/image/stripe.com). */
export function logoSrc(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return path.startsWith('/') ? `${new URL(API_BASE).origin}${path}` : path
}
