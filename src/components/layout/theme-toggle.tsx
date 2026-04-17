'use client'

import { MoonStar, SunMedium } from 'lucide-react'
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
      size="icon"
      aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
      title={isDark ? '切换到浅色主题' : '切换到深色主题'}
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      className="hidden md:inline-flex"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  )
}
