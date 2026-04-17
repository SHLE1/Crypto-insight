'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/settings'

export function ThemeToggle() {
  const theme = useSettingsStore((state) => state.theme)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
