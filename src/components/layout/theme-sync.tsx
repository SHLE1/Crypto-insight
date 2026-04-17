'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSettingsStore } from '@/stores/settings'

export function ThemeSync() {
  const theme = useSettingsStore((state) => state.theme)
  const hydrated = useSettingsStore((state) => state.hydrated)
  const { setTheme } = useTheme()

  useEffect(() => {
    if (!hydrated) return
    setTheme(theme)
  }, [hydrated, setTheme, theme])

  return null
}
