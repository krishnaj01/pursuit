import { SiGithub, SiX } from '@icons-pack/react-simple-icons'
import { Globe } from 'lucide-react'

import { IconLink } from '@/components/ui/IconLink'
import { SOCIAL_LINKS } from '@/lib/socials'

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-4 border-t border-border pt-8 text-center">
      <blockquote className="max-w-md font-display text-[15px] leading-relaxed text-muted italic">
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
    </footer>
  )
}
