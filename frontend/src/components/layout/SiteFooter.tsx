import { SiGithub, SiX } from '@icons-pack/react-simple-icons'
import { Globe } from 'lucide-react'
import { Link } from 'react-router'

import { IconLink } from '@/components/ui/IconLink'
import { SOCIAL_LINKS } from '@/lib/socials'
import { cn } from '@/lib/utils'

import { Copyright } from './Copyright'

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-12 flex w-full flex-col items-center gap-3 border-t border-border pt-6 text-center', className)}>
      {/* One line from tablet width up; phones are too narrow, so it wraps there. */}
      <blockquote className="font-display text-[13px] leading-relaxed text-balance text-muted italic sm:text-[15px] sm:whitespace-nowrap">
        “Luck is what happens when preparation meets a well-timed follow-up.”
      </blockquote>
      <div className="flex items-center gap-1">
        <IconLink href={SOCIAL_LINKS.github} label="GitHub">
          <SiGithub />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.x} label="X">
          <SiX />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.portfolio} label="Portfolio">
          <Globe />
        </IconLink>
      </div>
      <Link to="/privacy" className="text-xs text-subtle underline-offset-4 transition-colors hover:text-fg hover:underline">
        Privacy policy
      </Link>
      <Copyright />
    </footer>
  )
}
