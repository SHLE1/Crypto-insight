'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'
import { useWalletStore } from '@/stores/wallets'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import type { ApiErrorState, PortfolioSnapshot, QuoteResponse } from '@/types'
import { EVM_CHAINS } from '@/lib/evm-chains'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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

  const missingPriceAssets = snapshot.assets.filter((asset) => asset.price === null)
  if (missingPriceAssets.length === 0) {
    return null
  }

  const preview = missingPriceAssets
    .slice(0, 3)
    .map((asset) => asset.symbol)
    .join('、')
  const remaining = missingPriceAssets.length - Math.min(3, missingPriceAssets.length)

  return {
    source: snapshot.sourceType === 'wallet' ? '钱包查询' : '交易所查询',
    title: '部分资产缺少价格',
    sourceLabel: label,
    kind: 'warning',
    message: `有 ${missingPriceAssets.length} 个资产暂时没有价格。`,
    detail: preview
      ? `受影响资产：${preview}${remaining > 0 ? ` 等 ${missingPriceAssets.length} 个` : ''}。`
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
  const { snapshots, errors, lastRefresh, setSnapshot, setLastRefresh, clearErrors, addError, pruneSnapshots } =
    usePortfolioStore()

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

  const fetchPortfolio = useCallback(async () => {
    clearErrors()
    pruneSnapshots(activeSourceIds)
    const results: QuoteResponse[] = []

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
          setSnapshot(r.source, r)
          const nextError = buildSnapshotError(r, walletNameMap.get(r.source) ?? r.source)
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
          setSnapshot(r.source, r)
          const nextError = buildSnapshotError(r, cexLabelMap.get(r.source) ?? r.source)
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

    setLastRefresh(new Date().toISOString())
    return results
  }, [
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
  ])

  const { refetch, isFetching } = useQuery({
    queryKey: ['portfolio', activeSourceKey],
    queryFn: fetchPortfolio,
    enabled: hasSources,
    retry: 0,
    refetchInterval: hasSources ? refreshInterval * 1000 : false,
  })

  useEffect(() => {
    pruneSnapshots(activeSourceIds)
    if (!hasSources) {
      clearErrors()
      setLastRefresh(null)
    }
  }, [activeSourceIds, clearErrors, hasSources, pruneSnapshots, setLastRefresh])

  const { totalValue, change24hValue, change24hPercent, assetData, walletTotal, cexTotal, holdingsData } =
    useMemo(() => {
      let total = 0
      let weightedChange = 0
      const assetMap = new Map<string, number>()
      const holdingsMap = new Map<
        string,
        {
          symbol: string
          name: string
          balance: number
          price: number | null
          value: number
          change24h: number | null
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
          assetMap.set(a.symbol, (assetMap.get(a.symbol) ?? 0) + (a.value ?? 0))
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
                  balance: c.balance,
                  chainKey: c.chainKey,
                }))
            }
            return [{
              sourceId: snap.source,
              sourceType: snap.sourceType,
              sourceLabel,
              balance: a.balance,
            }]
          }

          const existing = holdingsMap.get(a.symbol)
          if (existing) {
            existing.balance += a.balance
            existing.value += a.value ?? 0
            existing.price = a.price ?? existing.price
            existing.change24h = a.change24h ?? existing.change24h
            existing.sources.push(...buildSourceDetails())
          } else {
            holdingsMap.set(a.symbol, {
              symbol: a.symbol,
              name: a.name,
              balance: a.balance,
              price: a.price,
              value: a.value ?? 0,
              change24h: a.change24h,
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
          symbol: stripLdPrefix(holding.symbol),
          name: holding.name,
          balance: holding.balance,
          price: holding.price,
          value: holding.value,
          change24h: holding.change24h,
          sourceCount: new Set(holding.sources.map((s) => s.sourceId)).size,
          sources: holding.sources.map((s) => ({
            ...s,
            chainLabel: s.chainKey ? (EVM_CHAINS[s.chainKey]?.name ?? s.chainKey) : undefined,
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
    }, [hideSmallAssets, snapshots, walletNameMap, cexLabelMap])

  const isEmpty = wallets.length === 0 && accounts.length === 0
  const hasValuedAssets = holdingsData.some((asset) => asset.value > 0)

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
          />
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
