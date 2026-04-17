'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/wallets'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useDefiData } from '@/hooks/use-defi-data'
import { buildHoldingsData, buildPortfolioAnalytics } from '@/lib/portfolio'
import { getChainLabel } from '@/lib/validators'
import type { ApiErrorState, DefiHistoryPoint, PortfolioHistoryPoint, PortfolioSnapshot, QuoteResponse } from '@/types'

interface QuoteRequestSuccess {
  kind: 'wallet' | 'cex'
  ok: boolean
  data: QuoteResponse
}

interface QuoteRequestFailure {
  kind: 'wallet' | 'cex'
  error: unknown
}

type QuoteRequestResult = QuoteRequestSuccess | QuoteRequestFailure

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function mergePortfolioAndDefiHistory(
  portfolioHistory: PortfolioHistoryPoint[],
  defiHistory: DefiHistoryPoint[],
  includeDefi: boolean
) {
  if (!includeDefi || defiHistory.length === 0) {
    return portfolioHistory
  }

  const portfolio = [...portfolioHistory].sort((a, b) => toTimestamp(a.timestamp) - toTimestamp(b.timestamp))
  const defi = [...defiHistory].sort((a, b) => toTimestamp(a.timestamp) - toTimestamp(b.timestamp))
  const timestamps = Array.from(new Set([...portfolio.map((point) => point.timestamp), ...defi.map((point) => point.timestamp)]))
    .sort((a, b) => toTimestamp(a) - toTimestamp(b))

  let portfolioIndex = -1
  let defiIndex = -1
  let currentPortfolio: PortfolioHistoryPoint | null = null
  let currentDefi: DefiHistoryPoint | null = null

  return timestamps.map((timestamp) => {
    while (portfolioIndex + 1 < portfolio.length && toTimestamp(portfolio[portfolioIndex + 1]?.timestamp) <= toTimestamp(timestamp)) {
      portfolioIndex += 1
      currentPortfolio = portfolio[portfolioIndex] ?? null
    }

    while (defiIndex + 1 < defi.length && toTimestamp(defi[defiIndex + 1]?.timestamp) <= toTimestamp(timestamp)) {
      defiIndex += 1
      currentDefi = defi[defiIndex] ?? null
    }

    const portfolioTotal = currentPortfolio?.totalValue ?? 0
    const portfolioWalletTotal = currentPortfolio?.walletTotal ?? 0
    const portfolioCexTotal = currentPortfolio?.cexTotal ?? 0
    const defiTotal = currentDefi?.totalValue ?? 0

    return {
      timestamp,
      totalValue: portfolioTotal + defiTotal,
      walletTotal: portfolioWalletTotal + defiTotal,
      cexTotal: portfolioCexTotal,
      sourceCount: currentPortfolio?.sourceCount ?? 0,
    } satisfies PortfolioHistoryPoint
  })
}

function shouldRetainPreviousSnapshot(previous: PortfolioSnapshot | undefined, next: PortfolioSnapshot) {
  if (!previous || previous.assets.length === 0) {
    return false
  }

  if (next.status === 'error') {
    return true
  }

  if (next.status === 'partial' && next.assets.length === 0) {
    return true
  }

  if (
    next.status === 'partial' &&
    next.error?.includes('Solana Token 查询失败') &&
    next.totalValue === 0 &&
    previous.totalValue > 0
  ) {
    return true
  }

  return false
}

function withRetainedSnapshotDetail(errorState: ApiErrorState | null, retained: boolean): ApiErrorState | null {
  if (!errorState || !retained) {
    return errorState
  }

  return {
    ...errorState,
    detail: errorState.detail
      ? `${errorState.detail} 当前继续显示上次成功结果。`
      : '当前继续显示上次成功结果。',
    impact: '本轮刷新失败，但页面暂时保留上次成功结果。',
  }
}

function buildSnapshotError(snapshot: PortfolioSnapshot, label: string): ApiErrorState | null {
  const timestamp = new Date().toISOString()

  if (snapshot.status === 'error') {
    return {
      source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
      title: '查询失败',
      sourceLabel: label,
      kind: 'error',
      message: snapshot.error || '这次刷新没有拿到数据。',
      impact: '该来源本轮未更新，资产总额可能偏低。',
      timestamp,
    }
  }

  if (snapshot.status === 'partial' && snapshot.error) {
    return {
      source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
      title: '部分资产已做补齐',
      sourceLabel: label,
      kind: 'warning',
      message: snapshot.error,
      impact: '总资产已尽量对齐交易所返回的总额，但其中一部分暂时不能按真实账户或币种完全展开。',
      timestamp,
    }
  }

  const missingPriceAssets = snapshot.assets.filter((asset) => asset.priceStatus === 'missing')
  const stalePriceAssets = snapshot.assets.filter((asset) => asset.priceStatus === 'stale')
  if (missingPriceAssets.length === 0 && stalePriceAssets.length === 0) {
    return null
  }

  const preview = [...missingPriceAssets, ...stalePriceAssets]
    .slice(0, 3)
    .map((asset) => asset.symbol)
    .join('、')
  const affectedCount = missingPriceAssets.length + stalePriceAssets.length
  const remaining = affectedCount - Math.min(3, affectedCount)

  if (missingPriceAssets.length > 0 && stalePriceAssets.length > 0) {
    return {
      source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
      title: '价格部分缺失',
      sourceLabel: label,
      kind: 'warning',
      message: `有 ${missingPriceAssets.length} 个资产缺少价格，另有 ${stalePriceAssets.length} 个资产暂用上次成功价格。`,
      detail: preview
        ? `受影响资产：${preview}${remaining > 0 ? ` 等 ${affectedCount} 个` : ''}。`
        : undefined,
      impact: '缺少价格的资产不会计入总额，旧价格资产会继续计入但可能与最新市价有偏差。',
      timestamp,
    }
  }

  if (stalePriceAssets.length > 0) {
    return {
      source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
      title: '部分资产使用旧价格',
      sourceLabel: label,
      kind: 'warning',
      message: `有 ${stalePriceAssets.length} 个资产暂时沿用上次成功价格。`,
      detail: preview
        ? `受影响资产：${preview}${remaining > 0 ? ` 等 ${affectedCount} 个` : ''}。`
        : undefined,
      impact: '这些资产仍会计入总资产，但和最新市价可能有偏差。',
      timestamp,
    }
  }

  return {
    source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
    title: '部分资产缺少价格',
    sourceLabel: label,
    kind: 'warning',
    message: `有 ${missingPriceAssets.length} 个资产暂时没有价格。`,
    detail: preview
      ? `受影响资产：${preview}${remaining > 0 ? ` 等 ${affectedCount} 个` : ''}。`
      : undefined,
    impact: '这些资产会继续显示余额，但不会计入总资产估值。',
    timestamp,
  }
}

async function requestQuote(
  kind: 'wallet' | 'cex',
  url: string,
  payload: Record<string, unknown>
): Promise<QuoteRequestResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data: QuoteResponse = await response.json()
    return { kind, ok: response.ok, data }
  } catch (error) {
    return { kind, error }
  }
}

export function usePortfolioData() {
  const wallets = useWalletStore((s) => s.wallets)
  const {
    totalValue: defiTotalValue,
    history: defiHistory,
    errors: defiErrors,
    lastRefresh: defiLastRefresh,
    isEnabled: isDefiEnabled,
    isFetching: isDefiFetching,
    isInitialLoading: isDefiInitialLoading,
    isUsingCachedData: isDefiUsingCachedData,
  } = useDefiData()
  const walletsHydrated = useWalletStore((s) => s.hydrated)
  const accounts = useCexStore((s) => s.accounts)
  const accountsHydrated = useCexStore((s) => s.hydrated)
  const refreshInterval = useSettingsStore((s) => s.refreshInterval)
  const hideSmallAssets = useSettingsStore((s) => s.hideSmallAssets)
  const settingsHydrated = useSettingsStore((s) => s.hydrated)
  const {
    hydrated: portfolioHydrated,
    snapshots,
    history,
    errors,
    lastRefresh,
    setSnapshot,
    setLastRefresh,
    clearErrors,
    addError,
    pruneSnapshots,
    appendHistoryPoint,
  } = usePortfolioStore()

  const enabledWallets = useMemo(() => wallets.filter((wallet) => wallet.enabled), [wallets])
  const enabledAccounts = useMemo(() => accounts.filter((account) => account.enabled), [accounts])
  const activeSourceIds = useMemo(
    () => [...enabledWallets.map((wallet) => wallet.id), ...enabledAccounts.map((account) => account.id)],
    [enabledWallets, enabledAccounts]
  )
  const activeSourceKey = useMemo(() => activeSourceIds.join('|'), [activeSourceIds])
  const hasSources = activeSourceIds.length > 0
  const walletNameMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet.name || shortenAddress(wallet.address)])),
    [wallets]
  )
  const cexLabelMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.label || account.exchange.toUpperCase()])),
    [accounts]
  )
  const [hasFetchedThisSession, setHasFetchedThisSession] = useState(false)

  const walletChainLabelMap = useMemo(
    () =>
      new Map(
        wallets.map((wallet) => [
          wallet.id,
          wallet.chainType === 'evm' ? null : getChainLabel(wallet.chainType),
        ])
      ),
    [wallets]
  )
  const isRestoring = !portfolioHydrated || !walletsHydrated || !accountsHydrated || !settingsHydrated
  const snapshotCount = Object.keys(snapshots).length
  const hasCachedSnapshots = snapshotCount > 0

  const fetchPortfolio = useCallback(async () => {
    clearErrors()
    pruneSnapshots(activeSourceIds)
    const results: QuoteResponse[] = []
    const nextSnapshots = new Map<string, PortfolioSnapshot>()
    const requests: Promise<QuoteRequestResult>[] = []

    if (enabledWallets.length > 0) {
      requests.push(
        requestQuote('wallet', '/api/wallets/quote', {
          wallets: enabledWallets.map((wallet) => ({
            id: wallet.id,
            chainType: wallet.chainType,
            address: wallet.address,
            evmChains: wallet.evmChains,
          })),
        })
      )
    }

    if (enabledAccounts.length > 0) {
      requests.push(
        requestQuote('cex', '/api/cex/quote', {
          accounts: enabledAccounts.map((account) => ({
            id: account.id,
            exchange: account.exchange,
            label: account.label,
            apiKey: account.apiKey,
            apiSecret: account.apiSecret,
            passphrase: account.passphrase,
            enabled: account.enabled,
          })),
        })
      )
    }

    const responses = await Promise.all(requests)

    responses.forEach((response) => {
      if ('error' in response) {
        addError({
          source: response.kind === 'wallet' ? '钱包查询' : '交易所查询',
          title: '接口连接失败',
          kind: 'error',
          message: `${response.kind === 'wallet' ? '钱包' : '交易所'}报价接口没有成功返回。`,
          detail: response.error instanceof Error ? response.error.message : '请求过程中出现未知错误。',
          impact: `这一轮没有拿到任何${response.kind === 'wallet' ? '钱包' : '交易所'}数据。`,
          timestamp: new Date().toISOString(),
        })
        return
      }

      results.push(response.data)

      response.data.results.forEach((snapshot) => {
        const previousSnapshot = snapshots[snapshot.source]
        const retained = shouldRetainPreviousSnapshot(previousSnapshot, snapshot)
        const effectiveSnapshot = retained && previousSnapshot ? previousSnapshot : snapshot

        nextSnapshots.set(snapshot.source, effectiveSnapshot)
        if (!retained) {
          setSnapshot(snapshot.source, snapshot)
        }

        const label =
          response.kind === 'wallet'
            ? walletNameMap.get(snapshot.source) ?? snapshot.source
            : cexLabelMap.get(snapshot.source) ?? snapshot.source
        const nextError = withRetainedSnapshotDetail(buildSnapshotError(snapshot, label), retained)
        if (nextError) {
          addError(nextError)
        }
      })

      if (!response.ok && response.data.results.length === 0) {
        addError({
          source: response.kind === 'wallet' ? '钱包查询' : '交易所查询',
          title: '接口请求失败',
          kind: 'error',
          message: `${response.kind === 'wallet' ? '钱包' : '交易所'}报价接口返回异常响应。`,
          impact: `这一轮没有拿到任何${response.kind === 'wallet' ? '钱包' : '交易所'}数据。`,
          timestamp: new Date().toISOString(),
        })
      }
    })

    const effectiveSnapshots = activeSourceIds
      .map((id) => nextSnapshots.get(id) ?? snapshots[id])
      .filter((snapshot): snapshot is PortfolioSnapshot => Boolean(snapshot))

    if (effectiveSnapshots.length > 0) {
      const totalValue = effectiveSnapshots.reduce((sum, snapshot) => sum + snapshot.totalValue, 0)
      const walletTotal = effectiveSnapshots
        .filter((snapshot) => snapshot.sourceType === 'wallet')
        .reduce((sum, snapshot) => sum + snapshot.totalValue, 0)
      const cexTotal = effectiveSnapshots
        .filter((snapshot) => snapshot.sourceType === 'cex')
        .reduce((sum, snapshot) => sum + snapshot.totalValue, 0)

      appendHistoryPoint({
        timestamp: new Date().toISOString(),
        totalValue,
        walletTotal,
        cexTotal,
        sourceCount: effectiveSnapshots.length,
      })
    }

    setLastRefresh(new Date().toISOString())
    setHasFetchedThisSession(true)
    return results
  }, [
    snapshots,
    activeSourceIds,
    addError,
    appendHistoryPoint,
    cexLabelMap,
    clearErrors,
    enabledAccounts,
    enabledWallets,
    pruneSnapshots,
    setLastRefresh,
    setSnapshot,
    walletNameMap,
  ])

  const shouldAutoRefresh = !isRestoring && hasSources && (hasFetchedThisSession || !hasCachedSnapshots)

  const { refetch, isFetching } = useQuery({
    queryKey: ['portfolio', activeSourceKey],
    queryFn: fetchPortfolio,
    enabled: shouldAutoRefresh,
    retry: 0,
    refetchInterval: shouldAutoRefresh ? refreshInterval * 1000 : false,
  })

  useEffect(() => {
    if (isRestoring) {
      return
    }

    pruneSnapshots(activeSourceIds)
    if (!hasSources) {
      clearErrors()
      setLastRefresh(null)
    }
  }, [activeSourceIds, clearErrors, hasSources, isRestoring, pruneSnapshots, setLastRefresh])

  useEffect(() => {
    if (isRestoring || !hasSources) {
      return
    }

    const hasAnySnapshot = snapshotCount > 0
    const missingActiveSnapshot = activeSourceIds.some((id) => !(id in snapshots))

    if (!hasAnySnapshot || missingActiveSnapshot) {
      void refetch()
    }
  }, [activeSourceIds, hasSources, isRestoring, refetch, snapshotCount, snapshots])

  const basePortfolio = useMemo(
    () =>
      buildHoldingsData({
        snapshots,
        hideSmallAssets,
        walletNameMap,
        cexLabelMap,
        walletChainLabelMap,
      }),
    [cexLabelMap, hideSmallAssets, snapshots, walletChainLabelMap, walletNameMap]
  )

  const mergedHistory = useMemo(
    () => mergePortfolioAndDefiHistory(history, defiHistory, isDefiEnabled),
    [defiHistory, history, isDefiEnabled]
  )

  const totalValue = basePortfolio.totalValue + (isDefiEnabled ? defiTotalValue : 0)
  const walletTotal = basePortfolio.walletTotal + (isDefiEnabled ? defiTotalValue : 0)
  const cexTotal = basePortfolio.cexTotal
  const assetData = useMemo(
    () => {
      if (!isDefiEnabled || defiTotalValue <= 0) {
        return basePortfolio.assetData
      }

      return [{ name: 'DeFi 仓位', value: defiTotalValue }, ...basePortfolio.assetData]
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    },
    [basePortfolio.assetData, defiTotalValue, isDefiEnabled]
  )
  const change24hValue = useMemo(() => {
    const visibleHistory = mergedHistory.slice(-24)
    if (visibleHistory.length < 2) {
      return basePortfolio.change24hValue
    }

    const firstPoint = visibleHistory[0]
    const lastPoint = visibleHistory[visibleHistory.length - 1]
    return lastPoint.totalValue - firstPoint.totalValue
  }, [basePortfolio.change24hValue, mergedHistory])
  const change24hPercent = useMemo(() => {
    const visibleHistory = mergedHistory.slice(-24)
    if (visibleHistory.length < 2) {
      return totalValue > 0 ? (change24hValue / totalValue) * 100 : 0
    }

    const firstPoint = visibleHistory[0]
    const lastPoint = visibleHistory[visibleHistory.length - 1]
    return firstPoint.totalValue > 0 ? ((lastPoint.totalValue - firstPoint.totalValue) / firstPoint.totalValue) * 100 : 0
  }, [change24hValue, mergedHistory, totalValue])
  const holdingsData = basePortfolio.holdingsData

  const analytics = useMemo(
    () =>
      buildPortfolioAnalytics({
        holdingsData,
        walletTotal,
        cexTotal,
        history: mergedHistory,
        activeSourceCount: activeSourceIds.length,
      }),
    [activeSourceIds.length, cexTotal, holdingsData, mergedHistory, walletTotal]
  )

  const mergedErrors = useMemo(
    () => (isDefiEnabled ? [...errors, ...defiErrors] : errors),
    [defiErrors, errors, isDefiEnabled]
  )
  const mergedLastRefresh = useMemo(() => {
    if (!isDefiEnabled) {
      return lastRefresh
    }

    return toTimestamp(defiLastRefresh) > toTimestamp(lastRefresh) ? defiLastRefresh : lastRefresh
  }, [defiLastRefresh, isDefiEnabled, lastRefresh])

  const isEmpty = wallets.length === 0 && accounts.length === 0
  const hasValuedAssets = holdingsData.some((asset) => asset.value > 0) || (isDefiEnabled && defiTotalValue > 0)
  const isFetchingCombined = isFetching || (isDefiEnabled && isDefiFetching)
  const isUsingCachedData =
    (portfolioHydrated && !hasFetchedThisSession && !isFetching && Boolean(lastRefresh) && hasCachedSnapshots) ||
    (isDefiEnabled && isDefiUsingCachedData)
  const isInitialLoading =
    (!isRestoring && hasSources && !hasCachedSnapshots && isFetching) ||
    (!isRestoring && isDefiEnabled && totalValue <= 0 && isDefiInitialLoading)

  return {
    wallets,
    accounts,
    snapshots,
    history: mergedHistory,
    errors: mergedErrors,
    lastRefresh: mergedLastRefresh,
    totalValue,
    change24hValue,
    change24hPercent,
    assetData,
    walletTotal,
    cexTotal,
    holdingsData,
    analytics,
    defiTotalValue,
    isDefiEnabled,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isUsingCachedData,
    isRestoring,
    isInitialLoading,
    refetch,
    isFetching: isFetchingCombined,
  }
}
