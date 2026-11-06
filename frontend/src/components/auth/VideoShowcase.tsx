import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const PILL_BUTTON = 'flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/15'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Login-page promo video. Nothing is downloaded until it scrolls into view (preload="none");
 *  then it plays muted while on screen and pauses when scrolled away. With reduced motion it
 *  waits for a click instead of autoplaying. */
export function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pausedByUser = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!pausedByUser.current && !prefersReducedMotion()) void video.play().catch(() => {})
        } else if (!video.paused) {
          video.pause()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      pausedByUser.current = false
      void video.play().catch(() => {})
    } else {
      pausedByUser.current = true
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    // Turning the sound on is a clear sign they want to watch.
    if (!video.muted && video.paused) togglePlay()
  }

  return (
    <section aria-labelledby="video-title" className="w-full">
      <div className="mb-10 flex flex-col items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.16em] text-accent uppercase">Watch</span>
        <h2 id="video-title" className="text-3xl font-semibold text-balance sm:text-4xl">
          Pursuit in 30 seconds
        </h2>
        <p className="max-w-md text-balance text-muted">
          From “Applied. Now what?” to every job with its next follow-up, plus the extension that logs them for you.
        </p>
      </div>

      <div className="relative">
        {/* Soft accent glow behind the video */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[10%] top-[10%] -z-10 h-3/4 rounded-full bg-accent/25 blur-3xl dark:bg-accent/20"
        />
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          <video
            ref={videoRef}
            className="block aspect-video w-full cursor-pointer bg-surface-raised"
            poster="/showcase/pursuit-promo-poster.webp"
            preload="none"
            muted
            loop
            playsInline
            onClick={togglePlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-label="Pursuit product video: logging applications, the browser extension and follow-up reminders"
          >
            <source src="/showcase/pursuit-promo.mp4" type="video/mp4" />
          </video>

          {/* Big play button until it starts (reduced motion, or autoplay blocked) */}
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play video"
              className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-transform hover:scale-105 sm:size-20"
            >
              <Play className="size-7 translate-x-0.5 fill-current sm:size-8" />
            </button>
          )}

          {/* Larger screens: play/pause and sound in a pill over the bottom-left corner. */}
          <div
            className={cn(
              'absolute bottom-4 left-4 hidden items-center gap-1 rounded-full border border-white/15 bg-black/55 p-1 text-white shadow-md backdrop-blur transition-opacity sm:flex',
              playing && 'opacity-80 group-hover:opacity-100 focus-within:opacity-100',
            )}
          >
            <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause video' : 'Play video'} className={PILL_BUTTON}>
              {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Mute'} className={cn(PILL_BUTTON, 'w-auto gap-1.5 px-2.5 text-xs font-medium')}>
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {muted ? 'Sound off' : 'Sound on'}
            </button>
          </div>

          {/* Phones: just a sound toggle in the corner, out of the captions' way. Tapping the
              video plays and pauses it. */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Turn sound on' : 'Mute'}
            className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-md backdrop-blur sm:hidden"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>
    </section>
  )
}
