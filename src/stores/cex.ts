import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CexAccountInput } from '@/types'

interface CexStore {
  accounts: CexAccountInput[]
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
    { name: 'crypto-insight-cex' }
  )
)
