import { APP_NAME } from '@/lib/constants'

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid size-8 place-items-center rounded-[10px] bg-fg text-bg shadow-md">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 19 19 5M9 5h10v10" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-bg bg-highlight" />
      </div>
      <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  )
}
