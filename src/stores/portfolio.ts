import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PortfolioCache, PortfolioSnapshot, ApiErrorState, PortfolioHistoryPoint } from '@/types'

const MAX_HISTORY_POINTS = 120

interface PortfolioStore extends PortfolioCache {
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  setSnapshot: (id: string, snapshot: PortfolioSnapshot) => void
  removeSnapshot: (id: string) => void
  pruneSnapshots: (activeIds: string[]) => void
  replacePortfolio: (cache: PortfolioCache) => void
  setErrors: (errors: ApiErrorState[]) => void
  addError: (error: ApiErrorState) => void
  clearErrors: () => void
  setLastRefresh: (time: string | null) => void
  appendHistoryPoint: (point: PortfolioHistoryPoint) => void
  clearAll: () => void
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      snapshots: {},
      lastRefresh: null,
      errors: [],
      history: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
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
      replacePortfolio: (cache) => set((state) => ({ ...state, ...cache })),
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
      appendHistoryPoint: (point) =>
        set((state) => {
          const lastPoint = state.history[state.history.length - 1]
          if (
            lastPoint &&
            lastPoint.totalValue === point.totalValue &&
            lastPoint.walletTotal === point.walletTotal &&
            lastPoint.cexTotal === point.cexTotal &&
            lastPoint.sourceCount === point.sourceCount
          ) {
            return state
          }

          const history = [...state.history, point].slice(-MAX_HISTORY_POINTS)
          return { history }
        }),
      clearAll: () => set({ snapshots: {}, lastRefresh: null, errors: [], history: [] }),
    }),
    {
      name: 'crypto-insight-portfolio',
      version: 1,
      partialize: (state) => ({
        snapshots: state.snapshots,
        lastRefresh: state.lastRefresh,
        history: state.history,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<PortfolioStore> | undefined

        return {
          snapshots: state?.snapshots ?? {},
          lastRefresh: state?.lastRefresh ?? null,
          errors: [],
          history: Array.isArray(state?.history) ? state.history.slice(-MAX_HISTORY_POINTS) : [],
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
