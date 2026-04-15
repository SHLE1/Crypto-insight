import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PortfolioCache, PortfolioSnapshot, ApiErrorState } from '@/types'

interface PortfolioStore extends PortfolioCache {
  setSnapshot: (id: string, snapshot: PortfolioSnapshot) => void
  setErrors: (errors: ApiErrorState[]) => void
  addError: (error: ApiErrorState) => void
  clearErrors: () => void
  setLastRefresh: (time: string) => void
  clearAll: () => void
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      snapshots: {},
      lastRefresh: null,
      errors: [],
      setSnapshot: (id, snapshot) =>
        set((state) => ({
          snapshots: { ...state.snapshots, [id]: snapshot },
        })),
      setErrors: (errors) => set({ errors }),
      addError: (error) =>
        set((state) => ({ errors: [...state.errors, error] })),
      clearErrors: () => set({ errors: [] }),
      setLastRefresh: (time) => set({ lastRefresh: time }),
      clearAll: () => set({ snapshots: {}, lastRefresh: null, errors: [] }),
    }),
    { name: 'crypto-insight-portfolio' }
  )
)
