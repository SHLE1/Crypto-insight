'use client'

import Link from 'next/link'
import { ArrowClockwise } from '@phosphor-icons/react'
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
    <div className="space-y-6">
      <PageHeader
        badge="资产明细"
        title="持仓明细"
        description="支持按代币、钱包和链三个维度查看，可筛选异常项与价格缺失记录。"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || isEmpty} className="gap-2">
            <ArrowClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
            刷新明细
          </Button>
        }
      />

      {isRestoring || isInitialLoading ? (
        <HoldingsLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="暂无持仓明细"
          description="先添加钱包地址或交易所账户，持仓明细将在此自动展示。"
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
              <CardContent className="py-6 text-sm leading-7 text-muted-foreground">
                暂无可估值的资产。可能原因：地址余额为零、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          ) : null}

          <div className="panel-grid">
            <HoldingSummaryCard
              label="总估值"
              value={formatCurrency(totalValue)}
              detail={isDefiEnabled && defiTotalValue > 0 ? `${holdingsData.length} 个代币条目 + DeFi ${formatCurrency(defiTotalValue)}` : `${holdingsData.length} 个代币条目`}
            />
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

          {isDefiEnabled && defiTotalValue > 0 ? (
            <Card className="border-border/60 bg-muted/30">
              <CardContent className="py-4 text-sm leading-7 text-muted-foreground">
                当前总资产已包含 <span className="font-medium text-foreground">{formatCurrency(defiTotalValue)}</span> 的 DeFi 净值。明细表仅展示钱包代币与交易所资产，DeFi 仓位详情请前往 DeFi 页查看。
              </CardContent>
            </Card>
          ) : null}

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
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
      <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}

function HoldingsLoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-md bg-muted/40" />
      <div className="panel-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
      <div className="h-[620px] animate-pulse rounded-md bg-muted/50" />
    </div>
  )
}
