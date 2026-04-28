'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDefiChainLabel, getDefiChains } from '@/lib/defi/chains'
import { useWalletStore } from '@/stores/wallets'
import { useSettingsStore } from '@/stores/settings'
import { useDefiStore } from '@/stores/defi'
import type { ApiErrorState, DefiQuoteResponse, DefiSnapshot } from '@/types'

const DEFI_SWEEP_INTERVAL_MS = 20 * 1000
const DEFI_STEADY_INTERVAL_MS = 30 * 60 * 1000

interface DefiApiResponse extends DefiQuoteResponse {
  message?: string
  cursor?: number
  nextCursor?: number | null
  hasMore?: boolean
  processedWalletIds?: string[]
  summary?: {
    successCount: number
    partialCount: number
    errorCount: number
  }
}

interface FetchDefiOptions {
  mode?: 'single' | 'full'
}

function buildDefiError(snapshot: DefiSnapshot, label: string): ApiErrorState | null {
  if (!snapshot.error) {
    return null
  }

  const isRecoverableThrottle =
    snapshot.error.includes('额度或速率受限') ||
    snapshot.error.includes('服务暂时不可用') ||
    snapshot.error.includes('请求失败（HTTP 5')

  return {
    source: 'DeFi 仓位',
    title: snapshot.status === 'error' ? 'DeFi 查询失败' : 'DeFi 数据部分可用',
    sourceLabel: `${label} · ${snapshot.chainKey}`,
    kind: snapshot.status === 'error' ? 'error' : 'warning',
    message: snapshot.error,
    impact:
      snapshot.status === 'error'
        ? isRecoverableThrottle
          ? '该链本轮已跳过，后续轮转刷新会继续尝试，不会一直卡在同一个钱包。'
          : '该链本轮没有拿到 DeFi 仓位结果。'
        : '该链本轮只拿到部分 DeFi 结果，当前会继续显示可用数据。',
    timestamp: new Date().toISOString(),
  }
}

function shouldUseCachedSnapshot(previous: DefiSnapshot | undefined, next: DefiSnapshot) {
  if (!previous) {
    return false
  }

  if (next.status === 'error') {
    return true
  }

  return next.status === 'partial' && next.totalValue === 0 && previous.totalValue > 0
}

export function useDefiData() {
  const wallets = useWalletStore((s) => s.wallets)
  const walletsHydrated = useWalletStore((s) => s.hydrated)
  const defiEnabled = useSettingsStore((s) => s.defiEnabled)
  const settingsHydrated = useSettingsStore((s) => s.hydrated)
  const {
    hydrated,
    snapshots,
    manualSources,
    errors,
    history,
    lastRefresh,
    setSnapshot,
    pruneSnapshots,
    clearErrors,
    addError,
    setLastRefresh,
    appendHistoryPoint,
  } = useDefiStore()

  const enabledWallets = useMemo(
    () => wallets.filter((wallet) => wallet.enabled && (wallet.chainType === 'evm' || wallet.chainType === 'solana')),
    [wallets]
  )
  const activeWalletIds = useMemo(() => enabledWallets.map((wallet) => wallet.id), [enabledWallets])
  const enabledManualSources = useMemo(() => manualSources.filter((source) => source.enabled), [manualSources])
  const activeSourceKey = useMemo(
    () => `${activeWalletIds.join('|')}::${enabledManualSources.map((source) => `${source.chainKey}:${source.contractAddress}`).join('|')}`,
    [activeWalletIds, enabledManualSources]
  )
  const walletNameMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name || wallet.address.slice(0, 6)])),
    [wallets]
  )
  const expectedSnapshotKeys = useMemo(
    () =>
      enabledWallets.flatMap((wallet) =>
        Array.from(
          new Set([
            ...getDefiChains(wallet.chainType, wallet.evmChains),
            ...enabledManualSources.map((source) => source.chainKey),
          ])
        ).map((chainKey) => `${wallet.id}:${chainKey}`)
      ),
    [enabledManualSources, enabledWallets]
  )
  const expectedSnapshotKeySet = useMemo(() => new Set(expectedSnapshotKeys), [expectedSnapshotKeys])

  const [hasFetchedThisSession, setHasFetchedThisSession] = useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const cursorRef = useRef(0)
  const lastSourceKeyRef = useRef<string | null>(null)

  const isRestoring = !hydrated || !walletsHydrated || !settingsHydrated
  const hasDefiSources = enabledWallets.length > 0
  const activeSnapshots = useMemo(
    () => Object.values(snapshots).filter((snapshot) => expectedSnapshotKeySet.has(snapshot.source)),
    [expectedSnapshotKeySet, snapshots]
  )
  const hasCachedSnapshots = activeSnapshots.length > 0
  const completedSnapshotKeySet = useMemo(
    () => new Set(activeSnapshots.filter((snapshot) => snapshot.status !== 'error').map((snapshot) => snapshot.source)),
    [activeSnapshots]
  )
  const isSweepRefreshing = useMemo(
    () => expectedSnapshotKeys.some((snapshotKey) => !completedSnapshotKeySet.has(snapshotKey)),
    [completedSnapshotKeySet, expectedSnapshotKeys]
  )

  const fetchDefi = useCallback(async ({ mode = 'single' }: FetchDefiOptions = {}) => {
    if (lastSourceKeyRef.current !== activeSourceKey) {
      lastSourceKeyRef.current = activeSourceKey
      cursorRef.current = 0
      clearErrors()
    }

    const cursor = cursorRef.current
    pruneSnapshots(activeWalletIds)

    const response = await fetch('/api/defi/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        cursor,
        wallets: enabledWallets.map((wallet) => ({
          id: wallet.id,
          chainType: wallet.chainType,
          address: wallet.address,
          evmChains: wallet.evmChains,
        })),
        manualSources: enabledManualSources,
      }),
    })

    const data = (await response.json()) as DefiApiResponse
    const fallbackNextCursor = activeWalletIds.length > 0 ? (cursor + 1) % activeWalletIds.length : 0

    if (!response.ok) {
      addError({
        source: 'DeFi 仓位',
        title: '接口请求失败',
        kind: 'error',
        message: data.message || 'DeFi 报价接口返回异常响应。',
        impact: '这一轮会继续跳到下一个钱包，避免一直重复刷新同一个来源。',
        timestamp: new Date().toISOString(),
      })
      cursorRef.current = fallbackNextCursor
      setHasFetchedThisSession(true)
      return data
    }

    const mergedSnapshots = new Map<string, DefiSnapshot>(activeSnapshots.map((snapshot) => [snapshot.source, snapshot]))

    data.results.forEach((snapshot) => {
      const previousSnapshot = mergedSnapshots.get(snapshot.source)
      const retained = shouldUseCachedSnapshot(previousSnapshot, snapshot)
      const effectiveSnapshot = retained && previousSnapshot ? previousSnapshot : snapshot

      mergedSnapshots.set(snapshot.source, effectiveSnapshot)
      setSnapshot(snapshot.source, effectiveSnapshot)

      const walletLabel = walletNameMap.get(snapshot.walletId) ?? snapshot.walletId
      const errorState = buildDefiError(snapshot, walletLabel)
      if (errorState) {
        addError(
          retained
            ? {
                ...errorState,
                detail: errorState.detail
                  ? `${errorState.detail} 当前继续显示上次成功结果。`
                  : '当前继续显示上次成功结果。',
              }
            : errorState
        )
      }
    })

    const effectiveSnapshots = Array.from(mergedSnapshots.values()).filter((snapshot) => expectedSnapshotKeySet.has(snapshot.source))

    if (effectiveSnapshots.length > 0) {
      appendHistoryPoint({
        timestamp: new Date().toISOString(),
        totalValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalValue, 0),
        depositedValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalDepositedValue, 0),
        borrowedValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalBorrowedValue, 0),
        rewardsValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalRewardsValue, 0),
        sourceCount: new Set(effectiveSnapshots.map((snapshot) => snapshot.walletId)).size,
      })
    }

    setLastRefresh(new Date().toISOString())
    setHasFetchedThisSession(true)
    cursorRef.current = typeof data.nextCursor === 'number' ? data.nextCursor : fallbackNextCursor
    return data
  }, [
    activeSnapshots,
    activeSourceKey,
    activeWalletIds,
    addError,
    appendHistoryPoint,
    clearErrors,
    enabledWallets,
    enabledManualSources,
    expectedSnapshotKeySet,
    pruneSnapshots,
    setLastRefresh,
    setSnapshot,
    walletNameMap,
  ])

  const shouldAutoRefresh = !isRestoring && defiEnabled && hasDefiSources

  const { refetch, isFetching } = useQuery({
    queryKey: ['defi', activeSourceKey],
    queryFn: () => fetchDefi({ mode: 'single' }),
    enabled: shouldAutoRefresh,
    retry: 0,
    refetchInterval: shouldAutoRefresh
      ? isSweepRefreshing || !hasCachedSnapshots
        ? DEFI_SWEEP_INTERVAL_MS
        : DEFI_STEADY_INTERVAL_MS
      : false,
  })

  useEffect(() => {
    if (isRestoring) {
      return
    }

    pruneSnapshots(activeWalletIds)
    cursorRef.current = 0
    lastSourceKeyRef.current = null

    if (!defiEnabled || !hasDefiSources) {
      clearErrors()
      setLastRefresh(null)
    }
  }, [activeWalletIds, clearErrors, defiEnabled, hasDefiSources, isRestoring, pruneSnapshots, setLastRefresh])

  useEffect(() => {
    if (isRestoring || !defiEnabled || !hasDefiSources) {
      return
    }

    if (!hasCachedSnapshots || isSweepRefreshing) {
      void refetch()
    }
  }, [defiEnabled, hasCachedSnapshots, hasDefiSources, isRestoring, isSweepRefreshing, refetch])

  const protocolMap = useMemo(() => {
    const aggregated = new Map<
      string,
      {
        protocolId: string
        protocolName: string
        chainKey: string
        category?: string
        value: number
        positionCount: number
      }
    >()

    activeSnapshots.forEach((snapshot) => {
      snapshot.protocols.forEach((protocol) => {
        const key = `${protocol.chainKey}:${protocol.protocolId}`
        const existing = aggregated.get(key)
        if (existing) {
          existing.value += protocol.totalValue
          existing.positionCount += protocol.positionCount
          return
        }

        aggregated.set(key, {
          protocolId: protocol.protocolId,
          protocolName: protocol.protocolName,
          chainKey: protocol.chainKey,
          category: protocol.protocolCategory,
          value: protocol.totalValue,
          positionCount: protocol.positionCount,
        })
      })
    })

    return Array.from(aggregated.values()).sort((a, b) => b.value - a.value)
  }, [activeSnapshots])

  const chainData = useMemo(() => {
    const aggregated = new Map<string, number>()

    activeSnapshots.forEach((snapshot) => {
      aggregated.set(snapshot.chainKey, (aggregated.get(snapshot.chainKey) ?? 0) + snapshot.totalValue)
    })

    return Array.from(aggregated.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [activeSnapshots])

  const totalValue = useMemo(
    () => activeSnapshots.reduce((sum, snapshot) => sum + snapshot.totalValue, 0),
    [activeSnapshots]
  )
  const totalDepositedValue = useMemo(
    () => activeSnapshots.reduce((sum, snapshot) => sum + snapshot.totalDepositedValue, 0),
    [activeSnapshots]
  )
  const totalBorrowedValue = useMemo(
    () => activeSnapshots.reduce((sum, snapshot) => sum + snapshot.totalBorrowedValue, 0),
    [activeSnapshots]
  )
  const totalRewardsValue = useMemo(
    () => activeSnapshots.reduce((sum, snapshot) => sum + snapshot.totalRewardsValue, 0),
    [activeSnapshots]
  )
  const positionCount = useMemo(
    () => activeSnapshots.reduce((sum, snapshot) => sum + snapshot.positions.length, 0),
    [activeSnapshots]
  )
  const walletCount = useMemo(
    () => new Set(activeSnapshots.map((snapshot) => snapshot.walletId)).size,
    [activeSnapshots]
  )
  const completedCount = useMemo(
    () => expectedSnapshotKeys.filter((snapshotKey) => completedSnapshotKeySet.has(snapshotKey)).length,
    [completedSnapshotKeySet, expectedSnapshotKeys]
  )
  const pendingChains = useMemo(
    () =>
      expectedSnapshotKeys
        .filter((snapshotKey) => !completedSnapshotKeySet.has(snapshotKey))
        .map((snapshotKey) => snapshotKey.split(':')[1] ?? snapshotKey)
        .map((chainKey) => formatDefiChainLabel(chainKey)),
    [completedSnapshotKeySet, expectedSnapshotKeys]
  )

  const hasPositions = positionCount > 0
  const isBusy = isFetching || isManualRefreshing
  const isUsingCachedData = hydrated && !hasFetchedThisSession && !isBusy && Boolean(lastRefresh) && hasCachedSnapshots
  const isInitialLoading = !isRestoring && defiEnabled && hasDefiSources && !hasCachedSnapshots && isBusy

  const refreshAll = useCallback(async () => {
    cursorRef.current = 0
    lastSourceKeyRef.current = activeSourceKey
    clearErrors()
    setIsManualRefreshing(true)

    try {
      return await fetchDefi({ mode: 'full' })
    } finally {
      setIsManualRefreshing(false)
    }
  }, [activeSourceKey, clearErrors, fetchDefi])

  return {
    snapshots,
    errors,
    history,
    lastRefresh,
    totalValue,
    totalDepositedValue,
    totalBorrowedValue,
    totalRewardsValue,
    protocolData: protocolMap,
    chainData,
    positionCount,
    walletCount,
    completedCount,
    expectedCount: expectedSnapshotKeys.length,
    pendingChains,
    isEnabled: defiEnabled,
    hasDefiSources,
    hasPositions,
    isFetching: isBusy,
    isInitialLoading,
    isUsingCachedData,
    isSweepRefreshing,
    refetch: refreshAll,
  }
}
