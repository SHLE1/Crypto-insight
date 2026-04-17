import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WalletInput } from '@/types'

interface WalletStore {
  wallets: WalletInput[]
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  addWallet: (wallet: WalletInput) => void
  setWallets: (wallets: WalletInput[]) => void
  removeWallet: (id: string) => void
  toggleWallet: (id: string) => void
  updateWallet: (id: string, updates: Partial<WalletInput>) => void
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      wallets: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addWallet: (wallet) =>
        set((state) => ({ wallets: [...state.wallets, wallet] })),
      setWallets: (wallets) => set({ wallets }),
      removeWallet: (id) =>
        set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) })),
      toggleWallet: (id) =>
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),
      updateWallet: (id, updates) =>
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),
    }),
    {
      name: 'crypto-insight-wallets',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<WalletStore> | undefined
        const wallets = Array.isArray(state?.wallets)
          ? state.wallets.map((wallet) => ({
              ...wallet,
              enabled: wallet.enabled ?? true,
              evmChains:
                wallet.chainType === 'evm'
                  ? wallet.evmChains && wallet.evmChains.length > 0
                    ? wallet.evmChains
                    : undefined
                  : undefined,
            }))
          : []

        return {
          wallets,
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
