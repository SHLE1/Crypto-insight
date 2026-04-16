'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'
import { useWalletStore } from '@/stores/wallets'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { NetWorthTrend } from '@/components/dashboard/net-worth-trend'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import type { ApiErrorState, PortfolioSnapshot, PriceStatus, QuoteResponse } from '@/types'
import { EVM_CHAINS } from '@/lib/evm-chains'
import { getChainLabel } from '@/lib/validators'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getPriceStatusRank(status: PriceStatus | undefined) {
  if (status === 'missing') return 2
  if (status === 'stale') return 1
  return 0
}

function mergePriceStatus(current: PriceStatus | undefined, next: PriceStatus | undefined): PriceStatus {
  return getPriceStatusRank(next) > getPriceStatusRank(current) ? (next ?? 'live') : (current ?? 'live')
}

function getAssetChainLabel(chainKey?: string) {
  if (!chainKey) return null
  if (chainKey in EVM_CHAINS) {
    return EVM_CHAINS[chainKey]?.name ?? chainKey
  }
  if (chainKey === 'solana' || chainKey === 'btc' || chainKey === 'evm') {
    return getChainLabel(chainKey)
  }
  return chainKey
}

function getAssetDisplayName(snapshot: PortfolioSnapshot, asset: PortfolioSnapshot['assets'][number]) {
  if (snapshot.sourceType === 'cex') {
    return asset.symbol
  }

  const chainLabel = getAssetChainLabel(asset.chainKey)
  return chainLabel ? `${asset.symbol} · ${chainLabel}` : asset.symbol
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

export default function DashboardPage() {
  const wallets = useWalletStore((s) => s.wallets)
  const accounts = useCexStore((s) => s.accounts)
  const refreshInterval = useSettingsStore((s) => s.refreshInterval)
  const hideSmallAssets = useSettingsStore((s) => s.hideSmallAssets)
  const {
    hydrated,
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

  const fetchPortfolio = useCallback(async () => {
    clearErrors()
    pruneSnapshots(activeSourceIds)
    const results: QuoteResponse[] = []
    const nextSnapshots = new Map<string, PortfolioSnapshot>()

    if (enabledWallets.length > 0) {
      try {
        const res = await fetch('/api/wallets/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallets: enabledWallets.map((w) => ({
              id: w.id,
              chainType: w.chainType,
              address: w.address,
              evmChains: w.evmChains,
            })),
          }),
        })
        const data: QuoteResponse = await res.json()
        results.push(data)
        data.results.forEach((r) => {
          const previousSnapshot = snapshots[r.source]
          const retained = shouldRetainPreviousSnapshot(previousSnapshot, r)
          const effectiveSnapshot = retained && previousSnapshot ? previousSnapshot : r

          nextSnapshots.set(r.source, effectiveSnapshot)
          if (!retained) {
            setSnapshot(r.source, r)
          }

          const nextError = withRetainedSnapshotDetail(
            buildSnapshotError(r, walletNameMap.get(r.source) ?? r.source),
            retained
          )
          if (nextError) {
            addError(nextError)
          }
        })
        if (!res.ok && data.results.length === 0) {
          addError({
            source: '钱包查询',
            title: '接口请求失败',
            kind: 'error',
            message: '钱包报价接口返回异常响应。',
            detail: `状态码：${res.status}`,
            impact: '这一轮没有拿到任何钱包数据。',
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        addError({
          source: '钱包查询',
          title: '接口连接失败',
          kind: 'error',
          message: '钱包报价接口没有成功返回。',
          detail: error instanceof Error ? error.message : '请求过程中出现未知错误。',
          impact: '这一轮没有拿到任何钱包数据。',
          timestamp: new Date().toISOString(),
        })
      }
    }

    if (enabledAccounts.length > 0) {
      try {
        const res = await fetch('/api/cex/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accounts: enabledAccounts.map((a) => ({
              id: a.id,
              exchange: a.exchange,
              label: a.label,
              apiKey: a.apiKey,
              apiSecret: a.apiSecret,
              passphrase: a.passphrase,
              enabled: a.enabled,
            })),
          }),
        })
        const data: QuoteResponse = await res.json()
        results.push(data)
        data.results.forEach((r) => {
          const previousSnapshot = snapshots[r.source]
          const retained = shouldRetainPreviousSnapshot(previousSnapshot, r)
          const effectiveSnapshot = retained && previousSnapshot ? previousSnapshot : r

          nextSnapshots.set(r.source, effectiveSnapshot)
          if (!retained) {
            setSnapshot(r.source, r)
          }

          const nextError = withRetainedSnapshotDetail(
            buildSnapshotError(r, cexLabelMap.get(r.source) ?? r.source),
            retained
          )
          if (nextError) {
            addError(nextError)
          }
        })
        if (!res.ok && data.results.length === 0) {
          addError({
            source: '交易所查询',
            title: '接口请求失败',
            kind: 'error',
            message: '交易所报价接口返回异常响应。',
            detail: `状态码：${res.status}`,
            impact: '这一轮没有拿到任何交易所数据。',
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        addError({
          source: '交易所查询',
          title: '接口连接失败',
          kind: 'error',
          message: '交易所报价接口没有成功返回。',
          detail: error instanceof Error ? error.message : '请求过程中出现未知错误。',
          impact: '这一轮没有拿到任何交易所数据。',
          timestamp: new Date().toISOString(),
        })
      }
    }

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
    clearErrors,
    enabledAccounts,
    enabledWallets,
    walletNameMap,
    pruneSnapshots,
    setLastRefresh,
    setSnapshot,
    cexLabelMap,
    appendHistoryPoint,
  ])

  const shouldAutoRefresh = hydrated && hasSources && (hasFetchedThisSession || Object.keys(snapshots).length === 0)

  const { refetch, isFetching } = useQuery({
    queryKey: ['portfolio', activeSourceKey],
    queryFn: fetchPortfolio,
    enabled: shouldAutoRefresh,
    retry: 0,
    refetchInterval: shouldAutoRefresh ? refreshInterval * 1000 : false,
  })

  useEffect(() => {
    pruneSnapshots(activeSourceIds)
    if (!hasSources) {
      clearErrors()
      setLastRefresh(null)
    }
  }, [activeSourceIds, clearErrors, hasSources, pruneSnapshots, setLastRefresh])

  useEffect(() => {
    if (!hydrated || !hasSources) {
      return
    }

    const snapshotIds = Object.keys(snapshots)
    const hasAnySnapshot = snapshotIds.length > 0
    const missingActiveSnapshot = activeSourceIds.some((id) => !(id in snapshots))

    if (!hasAnySnapshot || missingActiveSnapshot) {
      void refetch()
    }
  }, [activeSourceIds, hasSources, hydrated, refetch, snapshots])

  const { totalValue, change24hValue, change24hPercent, assetData, walletTotal, cexTotal, holdingsData } =
    useMemo(() => {
      let total = 0
      let weightedChange = 0
      const assetMap = new Map<string, number>()
      const holdingsMap = new Map<
        string,
        {
          assetId: string
          symbol: string
          name: string
          balance: number
          price: number | null
          value: number
          change24h: number | null
          priceStatus: PriceStatus
          sources: Array<{ sourceId: string; sourceType: 'wallet' | 'cex'; sourceLabel: string; balance: number; chainKey?: string }>
        }
      >()
      let wTotal = 0
      let cTotal = 0

      Object.values(snapshots).forEach((snap) => {
        total += snap.totalValue
        if (snap.sourceType === 'wallet') wTotal += snap.totalValue
        else cTotal += snap.totalValue

        snap.assets.forEach((a) => {
          const assetKey = a.assetId ?? `${snap.source}:${a.symbol}`
          const displaySymbol = getAssetDisplayName(snap, a)

          assetMap.set(displaySymbol, (assetMap.get(displaySymbol) ?? 0) + (a.value ?? 0))
          if (a.value && a.change24h !== null) {
            weightedChange += a.value * (a.change24h / 100)
          }

          const sourceLabel = snap.sourceType === 'wallet'
            ? (walletNameMap.get(snap.source) ?? snap.source)
            : (cexLabelMap.get(snap.source) ?? snap.source)

          // Build per-source details from _chainBreakdowns (EVM) or direct balance
          const buildSourceDetails = () => {
            if (a._chainBreakdowns && a._chainBreakdowns.length > 0) {
              return a._chainBreakdowns
                .filter((c) => c.balance > 0)
                .map((c) => ({
                  sourceId: snap.source,
                  sourceType: snap.sourceType,
                  sourceLabel,
                  assetId: a.assetId,
                  balance: c.balance,
                  chainKey: c.chainKey,
                }))
            }
            return [{
              sourceId: snap.source,
              sourceType: snap.sourceType,
              sourceLabel,
              assetId: a.assetId,
              balance: a.balance,
            }]
          }

          const existing = holdingsMap.get(assetKey)
          if (existing) {
            existing.balance += a.balance
            existing.value += a.value ?? 0
            existing.price = a.price ?? existing.price
            existing.change24h = a.change24h ?? existing.change24h
            existing.priceStatus = mergePriceStatus(existing.priceStatus, a.priceStatus)
            existing.sources.push(...buildSourceDetails())
          } else {
            holdingsMap.set(assetKey, {
              assetId: assetKey,
              symbol: displaySymbol,
              name: a.name,
              balance: a.balance,
              price: a.price,
              value: a.value ?? 0,
              change24h: a.change24h,
              priceStatus: a.priceStatus ?? 'missing',
              sources: buildSourceDetails(),
            })
          }
        })
      })

      // Strip LD prefix from display symbol
      const stripLdPrefix = (sym: string) =>
        sym.startsWith('LD') && sym.length > 2 ? sym.slice(2) : sym

      const changePercent = total > 0 ? (weightedChange / total) * 100 : 0
      const assetEntries = Array.from(assetMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
      const holdingsEntries = Array.from(holdingsMap.values())
        .map((holding) => ({
          assetId: holding.assetId,
          symbol: stripLdPrefix(holding.symbol),
          name: holding.name,
          balance: holding.balance,
          price: holding.price,
          value: holding.value,
          change24h: holding.change24h,
          priceStatus: holding.priceStatus,
          sourceCount: new Set(holding.sources.map((s) => s.sourceId)).size,
            sources: holding.sources.map((s) => ({
              ...s,
              chainLabel:
                s.sourceType === 'cex'
                  ? 'CEX'
                  : s.chainKey
                    ? (EVM_CHAINS[s.chainKey]?.name ?? s.chainKey)
                    : (walletChainLabelMap.get(s.sourceId) ?? undefined),
            })),
        }))
        .filter((holding) => !hideSmallAssets || holding.value >= 0.1)
        .sort((a, b) => b.value - a.value)

      return {
        totalValue: total,
        change24hValue: weightedChange,
        change24hPercent: changePercent,
        assetData: assetEntries,
        holdingsData: holdingsEntries,
        walletTotal: wTotal,
        cexTotal: cTotal,
      }
    }, [cexLabelMap, hideSmallAssets, snapshots, walletChainLabelMap, walletNameMap])

  const isEmpty = wallets.length === 0 && accounts.length === 0
  const hasValuedAssets = holdingsData.some((asset) => asset.value > 0)
  const isUsingCachedData =
    hydrated && !hasFetchedThisSession && !isFetching && Boolean(lastRefresh) && Object.keys(snapshots).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">总览</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching || isEmpty}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-medium mb-2">欢迎使用 Crypto Insight</p>
          <p className="text-muted-foreground mb-6">
            添加钱包地址或绑定交易所账户，开始追踪你的加密资产
          </p>
          <div className="flex gap-3">
            <a href="/wallets/add">
              <Button>添加钱包</Button>
            </a>
            <a href="/cex">
              <Button variant="outline">绑定交易所</Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TotalAssets
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            lastRefresh={lastRefresh}
            isStale={isUsingCachedData}
          />
          <NetWorthTrend data={history} />
          <HoldingsOverview data={holdingsData} />
          {!isFetching && !hasValuedAssets && hasSources && (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          )}
          <AssetDistribution data={assetData} />
          <SourceDistribution walletTotal={walletTotal} cexTotal={cexTotal} />
          <WalletSummary wallets={wallets} snapshots={snapshots} />
          <CexSummary accounts={accounts} snapshots={snapshots} />
          <AlertsPanel errors={errors} />
          <DefiPlaceholder />
        </div>
      )}
    </div>
  )
}
