import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WalletInput } from '@/types'

interface WalletStore {
  wallets: WalletInput[]
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
    { name: 'crypto-insight-wallets' }
  )
)
