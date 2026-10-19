import { KanbanSquare, PlusCircle, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Log application', icon: PlusCircle },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/profile', label: 'Profile', icon: UserRound },
]
