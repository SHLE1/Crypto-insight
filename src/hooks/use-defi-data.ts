'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallets'
import { useSettingsStore } from '@/stores/settings'
import { useDefiStore } from '@/stores/defi'
import type { ApiErrorState, DefiQuoteResponse, DefiSnapshot } from '@/types'

const DEFI_REFRESH_INTERVAL_MS = 30 * 60 * 1000

function buildDefiError(snapshot: DefiSnapshot, label: string): ApiErrorState | null {
  if (!snapshot.error) {
    return null
  }

  return {
    source: 'DeFi 仓位',
    title: snapshot.status === 'error' ? 'DeFi 查询失败' : 'DeFi 数据部分可用',
    sourceLabel: label,
    kind: snapshot.status === 'error' ? 'error' : 'warning',
    message: snapshot.error,
    impact:
      snapshot.status === 'error'
        ? '该钱包本轮没有拿到 DeFi 仓位结果。'
        : '该钱包本轮只拿到部分 DeFi 结果，当前会继续显示可用数据。',
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
  const activeSourceKey = useMemo(() => activeWalletIds.join('|'), [activeWalletIds])
  const walletNameMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name || wallet.address.slice(0, 6)])),
    [wallets]
  )
  const [hasFetchedThisSession, setHasFetchedThisSession] = useState(false)

  const isRestoring = !hydrated || !walletsHydrated || !settingsHydrated
  const hasDefiSources = enabledWallets.length > 0
  const hasCachedSnapshots = Object.keys(snapshots).length > 0

  const fetchDefi = useCallback(async () => {
    clearErrors()
    pruneSnapshots(activeWalletIds)

    const response = await fetch('/api/defi/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallets: enabledWallets.map((wallet) => ({
          id: wallet.id,
          chainType: wallet.chainType,
          address: wallet.address,
          evmChains: wallet.evmChains,
        })),
      }),
    })

    const data = (await response.json()) as DefiQuoteResponse & { message?: string }

    if (!response.ok) {
      addError({
        source: 'DeFi 仓位',
        title: '接口请求失败',
        kind: 'error',
        message: data.message || 'DeFi 报价接口返回异常响应。',
        impact: '这一轮没有拿到任何 DeFi 数据。',
        timestamp: new Date().toISOString(),
      })
      return data
    }

    data.results.forEach((snapshot) => {
      const previousSnapshot = snapshots[snapshot.source]
      const retained = shouldUseCachedSnapshot(previousSnapshot, snapshot)
      const effectiveSnapshot = retained && previousSnapshot ? previousSnapshot : snapshot

      if (!retained) {
        setSnapshot(snapshot.source, snapshot)
      }

      const errorState = buildDefiError(snapshot, walletNameMap.get(snapshot.source) ?? snapshot.source)
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

      if (retained && effectiveSnapshot) {
        setSnapshot(snapshot.source, effectiveSnapshot)
      }
    })

    const effectiveSnapshots = activeWalletIds
      .map((id) => snapshots[id] ?? data.results.find((snapshot) => snapshot.source === id))
      .filter((snapshot): snapshot is DefiSnapshot => Boolean(snapshot))

    if (effectiveSnapshots.length > 0) {
      appendHistoryPoint({
        timestamp: new Date().toISOString(),
        totalValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalValue, 0),
        depositedValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalDepositedValue, 0),
        borrowedValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalBorrowedValue, 0),
        rewardsValue: effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalRewardsValue, 0),
        sourceCount: effectiveSnapshots.length,
      })
    }

    setLastRefresh(new Date().toISOString())
    setHasFetchedThisSession(true)
    return data
  }, [
    activeWalletIds,
    addError,
    appendHistoryPoint,
    clearErrors,
    enabledWallets,
    pruneSnapshots,
    setLastRefresh,
    setSnapshot,
    snapshots,
    walletNameMap,
  ])

  const shouldAutoRefresh = !isRestoring && defiEnabled && hasDefiSources && (hasFetchedThisSession || !hasCachedSnapshots)

  const { refetch, isFetching } = useQuery({
    queryKey: ['defi', activeSourceKey],
    queryFn: fetchDefi,
    enabled: shouldAutoRefresh,
    retry: 0,
    refetchInterval: shouldAutoRefresh ? DEFI_REFRESH_INTERVAL_MS : false,
  })

  useEffect(() => {
    if (isRestoring) {
      return
    }

    pruneSnapshots(activeWalletIds)
    if (!defiEnabled || !hasDefiSources) {
      clearErrors()
      setLastRefresh(null)
    }
  }, [activeWalletIds, clearErrors, defiEnabled, hasDefiSources, isRestoring, pruneSnapshots, setLastRefresh])

  useEffect(() => {
    if (isRestoring || !defiEnabled || !hasDefiSources) {
      return
    }

    const hasAnySnapshot = Object.keys(snapshots).length > 0
    const missingSnapshot = activeWalletIds.some((id) => !(id in snapshots))

    if (!hasAnySnapshot || missingSnapshot) {
      void refetch()
    }
  }, [activeWalletIds, defiEnabled, hasDefiSources, isRestoring, refetch, snapshots])

  const effectiveSnapshots = useMemo(
    () => activeWalletIds.map((id) => snapshots[id]).filter((snapshot): snapshot is DefiSnapshot => Boolean(snapshot)),
    [activeWalletIds, snapshots]
  )

  const totalValue = useMemo(
    () => effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalValue, 0),
    [effectiveSnapshots]
  )
  const totalDepositedValue = useMemo(
    () => effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalDepositedValue, 0),
    [effectiveSnapshots]
  )
  const totalBorrowedValue = useMemo(
    () => effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalBorrowedValue, 0),
    [effectiveSnapshots]
  )
  const totalRewardsValue = useMemo(
    () => effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalRewardsValue, 0),
    [effectiveSnapshots]
  )

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

    effectiveSnapshots.forEach((snapshot) => {
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
  }, [effectiveSnapshots])

  const chainData = useMemo(() => {
    const aggregated = new Map<string, number>()

    effectiveSnapshots.forEach((snapshot) => {
      snapshot.protocols.forEach((protocol) => {
        aggregated.set(protocol.chainKey, (aggregated.get(protocol.chainKey) ?? 0) + protocol.totalValue)
      })
    })

    return Array.from(aggregated.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [effectiveSnapshots])

  const positionCount = useMemo(
    () => effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.positions.length, 0),
    [effectiveSnapshots]
  )
  const hasPositions = positionCount > 0
  const isUsingCachedData = hydrated && !hasFetchedThisSession && !isFetching && Boolean(lastRefresh) && hasCachedSnapshots
  const isInitialLoading = !isRestoring && defiEnabled && hasDefiSources && !hasCachedSnapshots && isFetching

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
    walletCount: effectiveSnapshots.length,
    isEnabled: defiEnabled,
    hasDefiSources,
    hasPositions,
    isFetching,
    isInitialLoading,
    isUsingCachedData,
    refetch,
  }
}
