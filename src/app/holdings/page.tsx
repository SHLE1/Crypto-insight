'use client'

import Link from 'next/link'
import { RefreshCw, PieChart, Coins, Navigation, Activity } from 'lucide-react'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { usePortfolioData } from '@/hooks/use-portfolio-data'
import { formatCurrency } from '@/lib/validators'

export default function HoldingsPage() {
  const {
    holdingsData,
    totalValue,
    analytics,
    defiTotalValue,
    isDefiEnabled,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isRestoring,
    isInitialLoading,
    isFetching,
    lastRefresh,
    refetch,
  } = usePortfolioData()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">资产明细</h2>
          <p className="text-sm text-muted-foreground">
            支持按代币、钱包和链三个维度查看，可筛选异常项与价格缺失记录。
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching || isEmpty} className="gap-2">
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新明细
        </Button>
      </div>

      {isRestoring || isInitialLoading ? (
        <HoldingsLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="暂无持仓明细"
          description="先添加钱包地址或交易所账户，持仓明细将在此自动展示。"
          action={
            <div className="flex gap-2">
              <Link href="/wallets/add">
                <Button>添加钱包</Button>
              </Link>
              <Link href="/cex">
                <Button variant="outline">绑定交易所</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {!isFetching && !hasValuedAssets && hasSources ? (
             <div className="border-y border-dashed border-border/40 bg-zinc-50/30 dark:bg-zinc-950/20 py-6">
               <p className="text-sm text-muted-foreground text-center">
                 暂无可估值的资产。可能原因：地址余额为零、交易所 API 权限不足， 或第三方报价暂时不可用。
               </p>
             </div>
          ) : null}

          <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/40 border-y border-border/40 bg-zinc-50/30 dark:bg-zinc-950/20">
            <div className="flex flex-col justify-center px-4 py-8 sm:px-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <PieChart className="size-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">总估值</span>
              </div>
              <div className="text-3xl lg:text-4xl font-semibold tracking-tighter text-foreground">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {isDefiEnabled && defiTotalValue > 0 ? `${holdingsData.length} 个代币条目 + DeFi ${formatCurrency(defiTotalValue)}` : `${holdingsData.length} 个代币条目`}
              </p>
            </div>

            <div className="flex flex-col justify-center px-4 py-8 sm:px-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Activity className="size-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">价格覆盖</span>
              </div>
              <div className="text-3xl lg:text-4xl font-semibold tracking-tighter text-foreground">
                {analytics.pricedAssetCount} <span className="text-muted-foreground text-sm font-normal">/ {analytics.assetCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                缺价 {analytics.missingPriceCount} 项 · 旧价 {analytics.stalePriceCount} 项
              </p>
            </div>

            <div className="flex flex-col justify-center px-4 py-8 sm:px-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Coins className="size-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">最大仓位</span>
              </div>
              <div className="text-3xl lg:text-4xl font-semibold tracking-tighter text-foreground truncate">
                {analytics.topHolding ? analytics.topHolding.symbol : '--'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.topHolding ? `${analytics.topHolding.share.toFixed(1)}% · ${formatCurrency(analytics.topHolding.value)}` : '暂无'}
              </p>
            </div>

            <div className="flex flex-col justify-center px-4 py-8 sm:px-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Navigation className="size-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">数据源集中度</span>
              </div>
              <div className="text-3xl lg:text-4xl font-semibold tracking-tighter text-foreground">
                {analytics.topThreeShare.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                 {analytics.activeSourceCount} 个启用数据源
              </p>
            </div>
          </div>

          <div className="mt-8">
             <HoldingsOverview data={holdingsData} analytics={analytics} totalValue={totalValue} />
          </div>

          {isDefiEnabled && defiTotalValue > 0 ? (
            <div className="mt-8 border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                当前总资产已包含 <span className="font-medium text-foreground">{formatCurrency(defiTotalValue)}</span> 的 DeFi 净值。明细表仅展示钱包代币与交易所资产，DeFi 仓位详情请前往 DeFi 页查看。
              </p>
              <Link href="/defi" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-1">
                  查看 DeFi 仓位 <Navigation className="size-3" />
                </Button>
              </Link>
            </div>
          ) : null}

          {lastRefresh ? <p className="text-xs text-muted-foreground text-right mt-2">上次更新：{new Date(lastRefresh).toLocaleString('zh-CN')}</p> : null}
        </>
      )}
    </div>
  )
}

function HoldingsLoadingState() {
  return (
    <div className="flex flex-1 flex-col gap-4 animate-pulse pt-4">
      <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/40 border-y border-border/40 bg-zinc-50/50 dark:bg-zinc-950/20">
        {[...Array(4)].map((_, i) => (
           <div key={i} className="h:[160px] lg:h-[180px] p-6 lg:p-8 flex flex-col justify-center">
             <div className="h-4 w-24 bg-muted/40 rounded mb-4"></div>
             <div className="h-8 w-32 bg-muted/60 rounded mb-2"></div>
             <div className="h-3 w-40 bg-muted/40 rounded"></div>
           </div>
        ))}
      </div>
      <div className="h-[400px] mt-8 bg-muted/20 border-y border-border/40 w-full animate-[shimmer_1.5s_infinite]"></div>
    </div>
  )
}
