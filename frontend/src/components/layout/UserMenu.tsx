import { LogOut, UserRound } from 'lucide-react'
import { Avatar } from 'radix-ui'
import { useNavigate } from 'react-router'

import { useSignOut } from '@/api/auth'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'
import { initials } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function UserAvatar({ className = 'size-9' }: { className?: string }) {
  const user = useAuthStore((s) => s.user)
  return (
    <Avatar.Root className={`${className} inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-accent-soft`}>
      <Avatar.Image src={user?.avatar_url ?? undefined} alt={user?.name} referrerPolicy="no-referrer" className="size-full object-cover" />
      <Avatar.Fallback className="grid size-full place-items-center text-xs font-semibold text-accent">
        {initials(user?.name ?? '')}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const signOut = useSignOut()
  const navigate = useNavigate()

  return (
    <Menu>
      <MenuTrigger className="rounded-full transition-opacity hover:opacity-85" aria-label="Account menu">
        <UserAvatar />
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <MenuSeparator />
        <MenuItem onSelect={() => navigate('/profile')}>
          <UserRound /> Profile & stats
        </MenuItem>
        <MenuItem onSelect={() => signOut.mutate()}>
          <LogOut /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
