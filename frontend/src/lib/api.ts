import axios, { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const API_PREFIX = '/api/v1'

export const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true })

/** Backend-hosted paths (e.g. cached logos) are stored relative to the API; resolve them. */
export function assetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return url.startsWith(API_PREFIX) ? API_BASE_URL + url.slice(API_PREFIX.length) : url
}

type FastApiError = { detail?: string | { msg: string }[] }

/** Turn FastAPI error payloads (plain or validation) into a readable message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as FastApiError | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, '')
  }
  return fallback
}
