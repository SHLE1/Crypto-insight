'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useWalletStore } from '@/stores/wallets'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import type { QuoteResponse } from '@/types'

export default function DashboardPage() {
  const wallets = useWalletStore((s) => s.wallets)
  const accounts = useCexStore((s) => s.accounts)
  const { snapshots, errors, lastRefresh, setSnapshot, setLastRefresh, clearErrors, addError } =
    usePortfolioStore()

  const enabledWallets = wallets.filter((w) => w.enabled)
  const enabledAccounts = accounts.filter((a) => a.enabled)

  const fetchPortfolio = useCallback(async () => {
    clearErrors()
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
            })),
          }),
        })
        const data: QuoteResponse = await res.json()
        results.push(data)
        data.results.forEach((r) => setSnapshot(r.source, r))
        if (data.status === 'error') {
          addError({ source: '钱包查询', message: '全部失败', timestamp: new Date().toISOString() })
        }
      } catch {
        addError({ source: '钱包查询', message: '网络错误', timestamp: new Date().toISOString() })
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
            })),
          }),
        })
        const data: QuoteResponse = await res.json()
        results.push(data)
        data.results.forEach((r) => setSnapshot(r.source, r))
        if (data.status === 'error') {
          addError({ source: '交易所查询', message: '全部失败', timestamp: new Date().toISOString() })
        }
      } catch {
        addError({ source: '交易所查询', message: '网络错误', timestamp: new Date().toISOString() })
      }
    }

    setLastRefresh(new Date().toISOString())
    return results
  }, [enabledWallets, enabledAccounts, clearErrors, setSnapshot, addError, setLastRefresh])

  const { refetch, isFetching } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    enabled: false,
  })

  useEffect(() => {
    if (enabledWallets.length > 0 || enabledAccounts.length > 0) {
      refetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { totalValue, change24hValue, change24hPercent, assetData, walletTotal, cexTotal } =
    useMemo(() => {
      let total = 0
      let weightedChange = 0
      const assetMap = new Map<string, number>()
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
        })
      })

      const changePercent = total > 0 ? (weightedChange / total) * 100 : 0
      const assetEntries = Array.from(assetMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      return {
        totalValue: total,
        change24hValue: weightedChange,
        change24hPercent: changePercent,
        assetData: assetEntries,
        walletTotal: wTotal,
        cexTotal: cTotal,
      }
    }, [snapshots])

  const isEmpty = wallets.length === 0 && accounts.length === 0

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
