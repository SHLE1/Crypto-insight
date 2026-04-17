'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">资产明细</h1>
            <Badge variant="secondary">{holdingsData.length} 项</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            这里集中查看按代币、按钱包、按链聚合后的完整持仓。
          </p>
          {lastRefresh ? (
            <p className="text-xs text-muted-foreground">
              最近刷新：{new Date(lastRefresh).toLocaleString('zh-CN')}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || isEmpty}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新明细
        </Button>
      </div>

      {isRestoring || isInitialLoading ? (
        <HoldingsLoadingState />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="mb-2 text-xl font-medium">还没有可查看的资产明细</p>
          <p className="mb-6 text-muted-foreground">
            先添加钱包地址或绑定交易所账户，明细页会自动展示你的持仓结构。
          </p>
          <div className="flex gap-3">
            <Link href="/wallets/add">
              <Button>添加钱包</Button>
            </Link>
            <Link href="/cex">
              <Button variant="outline">绑定交易所</Button>
            </Link>
          </div>
        </div>
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
            <HoldingSummaryCard
              label="总估值"
              value={formatCurrency(totalValue)}
              detail={`${holdingsData.length} 项代币`}
            />
            <HoldingSummaryCard
              label="价格覆盖"
              value={`${analytics.pricedAssetCount} / ${analytics.assetCount}`}
              detail={`缺价 ${analytics.missingPriceCount} 项 · 旧价 ${analytics.stalePriceCount} 项`}
            />
            <HoldingSummaryCard
              label="最大仓位"
              value={analytics.topHolding ? analytics.topHolding.symbol : '--'}
              detail={
                analytics.topHolding
                  ? `${analytics.topHolding.share.toFixed(1)}% · ${formatCurrency(analytics.topHolding.value)}`
                  : '暂无'
              }
            />
            <HoldingSummaryCard
              label="集中度"
              value={`前 3 大 ${analytics.topThreeShare.toFixed(1)}%`}
              detail={`${analytics.activeSourceCount} 个启用来源`}
            />
          </div>

          <HoldingsOverview data={holdingsData} analytics={analytics} totalValue={totalValue} />
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
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function HoldingsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="h-[620px] animate-pulse rounded-2xl bg-muted/50" />
    </div>
  )
}
