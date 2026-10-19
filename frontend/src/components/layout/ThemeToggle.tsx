import { Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup } from 'radix-ui'

import { type ThemePreference, useThemeStore } from '@/stores/themeStore'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'dark', label: 'Dark theme', icon: Moon },
]

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore()
  return (
    <ToggleGroup.Root
      type="single"
      value={preference}
      onValueChange={(value) => value && setPreference(value as ThemePreference)}
      className="flex items-center rounded-full border border-border bg-surface-sunken p-0.5"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          aria-label={label}
          title={label}
          className="grid size-7 place-items-center rounded-full text-subtle transition-all duration-200 hover:text-fg data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-sm"
        >
          <Icon className="size-3.5" />
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
