'use client'

import Link from 'next/link'
import { Building2, RefreshCw, Wallet } from 'lucide-react'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { NetWorthTrend } from '@/components/dashboard/net-worth-trend'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import { PortfolioInsights } from '@/components/dashboard/portfolio-insights'
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
    <div className="analytics-shell">
      <PageHeader
        eyebrow="Overview"
        title="冷静、精确地看清你的整套加密资产。"
        description="把链上钱包、交易所账户、价格覆盖和集中度放到同一张分析台上，先看结构，再做判断。"
        meta={
          <>
            <span className="data-pill">{wallets.length} 个钱包</span>
            <span className="data-pill">{accounts.length} 个交易所账户</span>
            {lastRefresh ? (
              <span className="data-pill">最近刷新 {new Date(lastRefresh).toLocaleString('zh-CN')}</span>
            ) : null}
            {isUsingCachedData ? <span className="data-pill">当前展示本地缓存</span> : null}
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isEmpty}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        }
        stats={
          hasSources && !isEmpty
            ? [
                {
                  label: '活跃来源',
                  value: `${analytics.activeSourceCount}`,
                  detail: '已启用的钱包与交易所来源',
                },
                {
                  label: '价格覆盖',
                  value: `${analytics.pricedAssetCount} / ${analytics.assetCount}`,
                  detail: analytics.assetCount > 0 ? `覆盖率 ${((analytics.pricedAssetCount / analytics.assetCount) * 100).toFixed(1)}%` : '暂无资产',
                  tone: analytics.missingPriceCount > 0 ? 'warning' : 'default',
                },
                {
                  label: '前 3 大仓位',
                  value: `${analytics.topThreeShare.toFixed(1)}%`,
                  detail: analytics.topHolding ? `最大仓位 ${analytics.topHolding.symbol}` : '暂无主导仓位',
                  tone: analytics.topThreeShare >= 65 ? 'warning' : 'default',
                },
                {
                  label: '24h 变化',
                  value: `${change24hPercent >= 0 ? '+' : ''}${change24hPercent.toFixed(2)}%`,
                  detail: `${change24hValue >= 0 ? '+' : '-'}$${Math.abs(change24hValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
                  tone: change24hPercent >= 0 ? 'positive' : 'danger',
                },
              ]
            : undefined
        }
      />

      {isRestoring || isInitialLoading ? (
        <DashboardLoadingState />
      ) : isEmpty ? (
        <EmptyState
          mark="CI"
          title="先接入你的第一个资产来源。"
          description="添加钱包地址或绑定交易所账户后，这里会自动生成净值、结构分布与异常提示。"
          actions={
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
          <TotalAssets
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            lastRefresh={lastRefresh}
            isStale={isUsingCachedData}
          />
          <NetWorthTrend data={history} />
          {!isFetching && !hasValuedAssets && hasSources ? (
            <Card className="col-span-full border-dashed border-border/70 bg-card/70">
              <CardContent className="px-6 py-6 text-sm leading-7 text-muted-foreground">
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
          <DefiPlaceholder />
        </div>
      )}
    </div>
  )
}

function DashboardLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="col-span-full h-56 animate-pulse rounded-[2rem] bg-muted/35" />
      <div className="col-span-full h-[26rem] animate-pulse rounded-[2rem] bg-muted/28" />
      <div className="col-span-full h-72 animate-pulse rounded-[2rem] bg-muted/28" />
      <div className="h-72 animate-pulse rounded-[2rem] bg-muted/28" />
      <div className="h-72 animate-pulse rounded-[2rem] bg-muted/28" />
    </div>
  )
}
