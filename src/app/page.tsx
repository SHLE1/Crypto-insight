'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, Wallet, Building2 } from 'lucide-react'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { NetWorthTrend } from '@/components/dashboard/net-worth-trend'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import { PortfolioInsights } from '@/components/dashboard/portfolio-insights'
import { usePortfolioData } from '@/hooks/use-portfolio-data'

export default function DashboardPage() {
  const {
    wallets,
    accounts,
    snapshots,
    history,
    errors,
    lastRefresh,
    totalValue,
    change24hValue,
    change24hPercent,
    assetData,
    walletTotal,
    cexTotal,
    analytics,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isUsingCachedData,
    isRestoring,
    isInitialLoading,
    refetch,
    isFetching,
  } = usePortfolioData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">总览</h1>
          {hasSources && !isEmpty && (
            <p className="mt-0.5 text-sm text-muted-foreground">你的加密资产一览</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching || isEmpty}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {isRestoring || isInitialLoading ? (
        <DashboardLoadingState />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="text-3xl font-bold text-primary">C</span>
          </div>
          <p className="text-xl font-semibold tracking-tight">欢迎使用 Crypto Insight</p>
          <p className="mt-2 max-w-sm text-muted-foreground">
            添加钱包地址或绑定交易所账户，开始追踪你的加密资产
          </p>
          <div className="mt-8 flex gap-3">
            <a href="/wallets/add">
              <Button className="gap-2">
                <Wallet className="h-4 w-4" />
                添加钱包
              </Button>
            </a>
            <a href="/cex">
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                绑定交易所
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TotalAssets
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            lastRefresh={lastRefresh}
            isStale={isUsingCachedData}
          />
          <NetWorthTrend data={history} />
          {!isFetching && !hasValuedAssets && hasSources && (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          )}
          <PortfolioInsights analytics={analytics} />
          <AssetDistribution data={assetData} totalValue={totalValue} />
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

function DashboardLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="col-span-full h-44 animate-pulse rounded-2xl bg-muted/40" />
      <div className="col-span-full h-96 animate-pulse rounded-2xl bg-muted/30" />
      <div className="col-span-full h-64 animate-pulse rounded-2xl bg-muted/30" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted/30" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted/30" />
    </div>
  )
}
