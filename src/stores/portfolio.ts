import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PortfolioCache, PortfolioSnapshot, ApiErrorState } from '@/types'

interface PortfolioStore extends PortfolioCache {
  setSnapshot: (id: string, snapshot: PortfolioSnapshot) => void
  removeSnapshot: (id: string) => void
  pruneSnapshots: (activeIds: string[]) => void
  replacePortfolio: (cache: PortfolioCache) => void
  setErrors: (errors: ApiErrorState[]) => void
  addError: (error: ApiErrorState) => void
  clearErrors: () => void
  setLastRefresh: (time: string | null) => void
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
      removeSnapshot: (id) =>
        set((state) => {
          if (!(id in state.snapshots)) {
            return state
          }

          const nextSnapshots = { ...state.snapshots }
          delete nextSnapshots[id]
          return { snapshots: nextSnapshots }
        }),
      pruneSnapshots: (activeIds) =>
        set((state) => {
          const activeIdSet = new Set(activeIds)
          const snapshotEntries = Object.entries(state.snapshots)
          const nextSnapshotEntries = snapshotEntries.filter(([id]) => activeIdSet.has(id))

          if (nextSnapshotEntries.length === snapshotEntries.length) {
            return state
          }

          const nextSnapshots = Object.fromEntries(nextSnapshotEntries)
          return { snapshots: nextSnapshots }
        }),
      replacePortfolio: (cache) => set(cache),
      setErrors: (errors) => set({ errors }),
      addError: (error) =>
        set((state) => ({ errors: [...state.errors, error] })),
      clearErrors: () =>
        set((state) => {
          if (state.errors.length === 0) {
            return state
          }

          return { errors: [] }
        }),
      setLastRefresh: (time) =>
        set((state) => {
          if (state.lastRefresh === time) {
            return state
          }

          return { lastRefresh: time }
        }),
      clearAll: () => set({ snapshots: {}, lastRefresh: null, errors: [] }),
    }),
    { name: 'crypto-insight-portfolio' }
  )
)
