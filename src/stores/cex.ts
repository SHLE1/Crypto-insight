import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CexAccountInput } from '@/types'

interface CexStore {
  accounts: CexAccountInput[]
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  addAccount: (account: CexAccountInput) => void
  setAccounts: (accounts: CexAccountInput[]) => void
  removeAccount: (id: string) => void
  toggleAccount: (id: string) => void
  updateAccount: (id: string, updates: Partial<CexAccountInput>) => void
}

export const useCexStore = create<CexStore>()(
  persist(
    (set) => ({
      accounts: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      setAccounts: (accounts) => set({ accounts }),
      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
      toggleAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        })),
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
    }),
    {
      name: 'crypto-insight-cex',
      version: 4,
      partialize: (state) => ({
        accounts: state.accounts,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<CexStore> | undefined
        const accounts = Array.isArray(state?.accounts)
          ? state.accounts.map((account) => ({
              ...account,
              enabled: account.enabled ?? true,
            }))
          : []

        return {
          accounts,
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
