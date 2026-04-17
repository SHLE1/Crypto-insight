'use client'

import Link from 'next/link'
import { Building2, RefreshCw, Wallet } from 'lucide-react'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { NetWorthTrend } from '@/components/dashboard/net-worth-trend'
import { PortfolioInsights } from '@/components/dashboard/portfolio-insights'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <PageHeader
        badge="Overview"
        title="总览"
        description="查看净值、趋势、来源和价格覆盖情况。"
        actions={
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
        }
      />

      {isRestoring || isInitialLoading ? (
        <DashboardLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="还没有可追踪的资产来源"
          description="添加钱包地址或绑定交易所账户后，这里会自动生成净值、结构分布与趋势数据。"
          action={
            <>
              <Link href="/wallets/add">
                <Button className="gap-2">
                  <Wallet className="h-4 w-4" />
                  添加钱包
                </Button>
              </Link>
              <Link href="/cex">
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  绑定交易所
                </Button>
              </Link>
            </>
          }
        />
      ) : (
        <div className="page-grid">
          <TotalAssets
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            lastRefresh={lastRefresh}
            isStale={isUsingCachedData}
          />
          <NetWorthTrend data={history} />
          {!isFetching && !hasValuedAssets && hasSources ? (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          ) : null}
          <PortfolioInsights analytics={analytics} />
          <AssetDistribution data={assetData} totalValue={totalValue} />
          <SourceDistribution walletTotal={walletTotal} cexTotal={cexTotal} />
          <WalletSummary wallets={wallets} snapshots={snapshots} />
          <CexSummary accounts={accounts} snapshots={snapshots} />
          <AlertsPanel errors={errors} />
        </div>
      )}
    </div>
  )
}

function DashboardLoadingState() {
  return (
    <div className="page-grid">
      <div className="col-span-full h-28 animate-pulse rounded-xl bg-muted/40" />
      <div className="col-span-full h-52 animate-pulse rounded-xl bg-muted/30" />
      <div className="col-span-full h-96 animate-pulse rounded-xl bg-muted/30" />
      <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
      <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
    </div>
  )
}
