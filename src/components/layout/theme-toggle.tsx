'use client'

import { Moon, SunDim } from '@phosphor-icons/react'
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
      {isDark ? <SunDim size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
    </Button>
  )
}
