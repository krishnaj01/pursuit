import { useEffect, useRef, useState } from 'react'

/** Reveal once the element is ~20% on screen. */
function useRevealOnScroll<T extends Element>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setRevealed(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, revealed }
}

/** Login-page showcase: the pipeline in an app window, rising into view and fading out below. */
export function ProductShowcase() {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>()

  return (
    <section aria-labelledby="showcase-title" className="relative w-full">
      <div className="mb-10 flex flex-col items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">A look inside</span>
        <h2 id="showcase-title" className="text-3xl font-semibold text-balance sm:text-4xl">
          Your whole search, at a glance
        </h2>
        <p className="max-w-md text-balance text-muted">
          Every application in one place, sorted by what needs you next — stages, logos and follow-ups included.
        </p>
      </div>

      <div ref={ref} className="showcase-stage relative">
        {/* Soft accent glow behind the window */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[8%] top-[8%] -z-10 h-2/3 rounded-full bg-accent/25 blur-3xl dark:bg-accent/20"
        />
        <div
          data-revealed={revealed}
          className="showcase-frame showcase-fade overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {/* Minimal app-window chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="ml-3 rounded-md bg-surface-sunken px-3 py-0.5 font-mono text-[11px] text-subtle">
              Pursuit · Pipeline
            </span>
          </div>
          <img
            src="/showcase/pipeline-light.webp"
            alt="The Pursuit pipeline: applications sorted by their next reminder, with stages, logos and follow-ups"
            width={1440}
            height={900}
            loading="lazy"
            decoding="async"
            className="block w-full dark:hidden"
          />
          <img
            src="/showcase/pipeline-dark.webp"
            alt=""
            aria-hidden
            width={1440}
            height={900}
            loading="lazy"
            decoding="async"
            className="hidden w-full dark:block"
          />
        </div>
      </div>
    </section>
  )
}
