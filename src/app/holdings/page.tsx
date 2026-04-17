'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePortfolioData } from '@/hooks/use-portfolio-data'
import { formatCurrency } from '@/lib/validators'

export default function HoldingsPage() {
  const {
    holdingsData,
    totalValue,
    analytics,
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
    <div className="space-y-6">
      <PageHeader
        badge="Holdings"
        title="资产明细"
        description="按代币、钱包和链三个维度查看完整持仓结构。"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || isEmpty} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            刷新明细
          </Button>
        }
      />

      {isRestoring || isInitialLoading ? (
        <HoldingsLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="还没有可查看的资产明细"
          description="先添加钱包地址或绑定交易所账户，明细页会自动展示你的持仓结构。"
          action={
            <>
              <Link href="/wallets/add">
                <Button>添加钱包</Button>
              </Link>
              <Link href="/cex">
                <Button variant="outline">绑定交易所</Button>
              </Link>
            </>
          }
        />
      ) : (
        <>
          {!isFetching && !hasValuedAssets && hasSources ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <HoldingSummaryCard label="总估值" value={formatCurrency(totalValue)} detail={`${holdingsData.length} 项代币`} />
            <HoldingSummaryCard
              label="价格覆盖"
              value={`${analytics.pricedAssetCount} / ${analytics.assetCount}`}
              detail={`缺价 ${analytics.missingPriceCount} 项 · 旧价 ${analytics.stalePriceCount} 项`}
            />
            <HoldingSummaryCard
              label="最大仓位"
              value={analytics.topHolding ? analytics.topHolding.symbol : '--'}
              detail={analytics.topHolding ? `${analytics.topHolding.share.toFixed(1)}% · ${formatCurrency(analytics.topHolding.value)}` : '暂无'}
            />
            <HoldingSummaryCard
              label="集中度"
              value={`前 3 大 ${analytics.topThreeShare.toFixed(1)}%`}
              detail={`${analytics.activeSourceCount} 个启用来源`}
            />
          </div>

          <HoldingsOverview data={holdingsData} analytics={analytics} totalValue={totalValue} />

          {lastRefresh ? <p className="text-xs text-muted-foreground">最近刷新：{new Date(lastRefresh).toLocaleString('zh-CN')}</p> : null}
        </>
      )}
    </div>
  )
}

function HoldingSummaryCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="metric-tile">
      <p className="muted-kicker">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function HoldingsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
      <div className="h-[620px] animate-pulse rounded-xl bg-muted/50" />
    </div>
  )
}
