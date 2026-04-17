import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '@/types'

interface SettingsStore extends Settings {
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
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
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'crypto-insight-settings',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SettingsStore> | undefined

        return {
          quoteCurrency: state?.quoteCurrency ?? 'USD',
          refreshInterval: state?.refreshInterval ?? 60,
          theme: state?.theme ?? 'dark',
          defiEnabled: state?.defiEnabled ?? false,
          hideSmallAssets: state?.hideSmallAssets ?? false,
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
