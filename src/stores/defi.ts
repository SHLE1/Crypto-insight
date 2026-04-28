import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDefiChainKeyFromEvmChainKey } from '@/lib/defi/chains'
import type { ApiErrorState, DefiCache, DefiHistoryPoint, DefiSnapshot, ManualDefiSource } from '@/types'

const MAX_HISTORY_POINTS = 120

interface DefiStore extends DefiCache {
  hydrated: boolean
  setHydrated: (hydrated: boolean) => void
  addManualSource: (source: ManualDefiSource) => void
  removeManualSource: (id: string) => void
  toggleManualSource: (id: string) => void
  setLocalOnlySnapshot: (id: string, enabled?: boolean) => void
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
      manualSources: [],
      localOnlySnapshotKeys: [],
      lastRefresh: null,
      errors: [],
      history: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addManualSource: (source) =>
        set((state) => {
          const existing = state.manualSources.find((item) => item.id === source.id)

          return {
            manualSources: [
              ...state.manualSources.filter((item) => item.id !== source.id),
              existing
                ? {
                    ...source,
                    label: existing.label ?? source.label,
                    enabled: existing.enabled,
                    origin: existing.origin === 'manual' ? 'manual' : source.origin ?? existing.origin,
                  }
                : source,
            ],
          }
        }),
      removeManualSource: (id) =>
        set((state) => ({
          manualSources: state.manualSources.filter((source) => source.id !== id),
        })),
      toggleManualSource: (id) =>
        set((state) => ({
          manualSources: state.manualSources.map((source) =>
            source.id === id ? { ...source, enabled: !source.enabled } : source
          ),
        })),
      setLocalOnlySnapshot: (id, enabled = true) =>
        set((state) => ({
          localOnlySnapshotKeys: enabled
            ? Array.from(new Set([...state.localOnlySnapshotKeys, id]))
            : state.localOnlySnapshotKeys.filter((item) => item !== id),
        })),
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
          const nextSnapshotEntries = snapshotEntries.filter(([, snapshot]) => activeIdSet.has(snapshot.walletId))

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
      clearAll: () => set({ snapshots: {}, manualSources: [], localOnlySnapshotKeys: [], lastRefresh: null, errors: [], history: [] }),
    }),
    {
      name: 'crypto-insight-defi',
      version: 2,
      partialize: (state) => ({
        snapshots: state.snapshots,
        manualSources: state.manualSources,
        localOnlySnapshotKeys: state.localOnlySnapshotKeys,
        lastRefresh: state.lastRefresh,
        history: state.history,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<DefiStore> | undefined

        return {
          snapshots: state?.snapshots ?? {},
          manualSources: Array.isArray(state?.manualSources)
            ? state.manualSources.map((source) => ({
                ...source,
                chainKey: getDefiChainKeyFromEvmChainKey(source.chainKey),
                origin: source.origin ?? 'manual',
              }))
            : [],
          localOnlySnapshotKeys: Array.isArray(state?.localOnlySnapshotKeys) ? state.localOnlySnapshotKeys : [],
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
