import { KanbanSquare, PlusCircle, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Log application', shortLabel: 'Log', icon: PlusCircle },
  { to: '/pipeline', label: 'Pipeline', shortLabel: 'Pipeline', icon: KanbanSquare },
  { to: '/profile', label: 'Profile', shortLabel: 'Profile', icon: UserRound },
]
