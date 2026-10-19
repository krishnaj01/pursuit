import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm',
  secondary: 'border border-border bg-surface text-fg hover:border-border-strong',
  ghost: 'text-muted hover:bg-surface-sunken hover:text-fg',
} as const

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      <span className="grid size-6 place-items-center rounded-md bg-fg text-[13px] font-semibold text-bg" aria-hidden>
        ↗
      </span>
      <span className="font-display text-[15px] font-semibold">Pursuit</span>
      <div className="ml-auto">{children}</div>
    </header>
  )
}
