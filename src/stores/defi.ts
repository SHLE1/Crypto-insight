import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiErrorState, DefiCache, DefiHistoryPoint, DefiSnapshot } from '@/types'

const MAX_HISTORY_POINTS = 120

interface DefiStore extends DefiCache {
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  setSnapshot: (id: string, snapshot: DefiSnapshot) => void
  removeSnapshot: (id: string) => void
  pruneSnapshots: (activeIds: string[]) => void
  setErrors: (errors: ApiErrorState[]) => void
  addError: (error: ApiErrorState) => void
  clearErrors: () => void
  setLastRefresh: (time: string | null) => void
  appendHistoryPoint: (point: DefiHistoryPoint) => void
  clearAll: () => void
}

export const useDefiStore = create<DefiStore>()(
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

          return { snapshots: Object.fromEntries(nextSnapshotEntries) }
        }),
      setErrors: (errors) => set({ errors }),
      addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
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
            lastPoint.depositedValue === point.depositedValue &&
            lastPoint.borrowedValue === point.borrowedValue &&
            lastPoint.rewardsValue === point.rewardsValue &&
            lastPoint.sourceCount === point.sourceCount
          ) {
            return state
          }

          return { history: [...state.history, point].slice(-MAX_HISTORY_POINTS) }
        }),
      clearAll: () => set({ snapshots: {}, lastRefresh: null, errors: [], history: [] }),
    }),
    {
      name: 'crypto-insight-defi',
      version: 1,
      partialize: (state) => ({
        snapshots: state.snapshots,
        lastRefresh: state.lastRefresh,
        history: state.history,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<DefiStore> | undefined

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
