import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '@/types'

interface SettingsStore extends Settings {
  updateSettings: (updates: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      quoteCurrency: 'USD',
      refreshInterval: 60,
      theme: 'dark',
      defiEnabled: false,
      hideSmallAssets: false,
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    { name: 'crypto-insight-settings' }
  )
)
