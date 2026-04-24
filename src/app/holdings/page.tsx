'use client'

import Link from 'next/link'
import { RefreshCw, Navigation } from 'lucide-react'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { usePortfolioData } from '@/hooks/use-portfolio-data'
import { formatDefiChainLabel } from '@/lib/defi/chains'
import { formatCurrency } from '@/lib/validators'

function DefiProtocolSection({
  totalValue,
  depositedValue,
  borrowedValue,
  rewardsValue,
  positionCount,
  protocolData,
  chainData,
}: {
  totalValue: number
  depositedValue: number
  borrowedValue: number
  rewardsValue: number
  positionCount: number
  protocolData: Array<{
    protocolId: string
    protocolName: string
    chainKey: string
    category?: string
    value: number
    positionCount: number
  }>
  chainData: Array<{ name: string; value: number }>
}) {
  if (totalValue <= 0 && protocolData.length === 0) {
    return null
  }

  return (
    <div className="mt-8 border-t border-border/40 pt-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight">DeFi 协议</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {positionCount > 0 ? `${positionCount} 个仓位，净值 ${formatCurrency(totalValue)}` : '暂无可计价协议仓位'}
          </p>
        </div>
        <Link href="/defi">
          <Button variant="outline" size="sm" className="gap-1">
            查看 DeFi 仓位 <Navigation className="size-3" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px border border-border/40 bg-border/40 md:grid-cols-4">
        {[
          ['净值', formatCurrency(totalValue)],
          ['总存入', formatCurrency(depositedValue)],
          ['总借出', formatCurrency(borrowedValue)],
          ['待领取奖励', formatCurrency(rewardsValue)],
        ].map(([label, value]) => (
          <div key={label} className="bg-background px-4 py-3">
            <p className="muted-kicker">{label}</p>
            <p className="mt-2 text-base font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 border-x border-b border-border/40 p-4 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">协议分布</h4>
          <div className="mt-3 divide-y divide-border/30">
            {protocolData.slice(0, 5).map((protocol) => (
              <div key={`${protocol.chainKey}:${protocol.protocolId}`} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{protocol.protocolName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDefiChainLabel(protocol.chainKey)}
                    {protocol.category ? ` · ${protocol.category}` : ''}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(protocol.value)}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">链分布</h4>
          <div className="mt-3 divide-y divide-border/30">
            {chainData.slice(0, 5).map((chain) => (
              <div key={chain.name} className="flex items-center justify-between gap-4 py-2.5">
                <p className="text-sm font-medium">{formatDefiChainLabel(chain.name)}</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(chain.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HoldingsPage() {
  const {
    holdingsData,
    totalValue,
    analytics,
    defiTotalValue,
    defiTotalDepositedValue,
    defiTotalBorrowedValue,
    defiTotalRewardsValue,
    defiProtocolData,
    defiChainData,
    defiPositionCount,
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

          <div className="flex flex-wrap gap-x-10 gap-y-5 border-b border-border/40 pb-5">
            <div>
              <p className="muted-kicker">总估值</p>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(totalValue)}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {isDefiEnabled && defiTotalValue > 0 ? `${holdingsData.length} 个代币 + DeFi ${formatCurrency(defiTotalValue)}` : `${holdingsData.length} 个代币条目`}
              </p>
            </div>
            <div>
              <p className="muted-kicker">价格覆盖</p>
              <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                {analytics.pricedAssetCount}<span className="text-muted-foreground text-base font-normal"> / {analytics.assetCount}</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">缺价 {analytics.missingPriceCount} 项 · 旧价 {analytics.stalePriceCount} 项</p>
            </div>
            <div>
              <p className="muted-kicker">最大仓位</p>
              <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums truncate max-w-[12ch]">
                {analytics.topHolding ? analytics.topHolding.symbol : '--'}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {analytics.topHolding ? `${analytics.topHolding.share.toFixed(1)}% · ${formatCurrency(analytics.topHolding.value)}` : '暂无'}
              </p>
            </div>
            <div>
              <p className="muted-kicker">数据源集中度</p>
              <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{analytics.topThreeShare.toFixed(1)}%</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{analytics.activeSourceCount} 个启用数据源</p>
            </div>
          </div>

          <div className="mt-4">
             <HoldingsOverview data={holdingsData} analytics={analytics} totalValue={totalValue} />
          </div>

          {isDefiEnabled ? (
            <DefiProtocolSection
              totalValue={defiTotalValue}
              depositedValue={defiTotalDepositedValue}
              borrowedValue={defiTotalBorrowedValue}
              rewardsValue={defiTotalRewardsValue}
              positionCount={defiPositionCount}
              protocolData={defiProtocolData}
              chainData={defiChainData}
            />
          ) : null}

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
    <div className="flex flex-1 flex-col gap-6 animate-pulse pt-2">
      <div className="flex flex-wrap gap-x-10 gap-y-5 border-b border-border/40 pb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-16 bg-muted/60 rounded"></div>
            <div className="h-7 w-24 bg-muted/60 rounded"></div>
            <div className="h-3 w-32 bg-muted/40 rounded"></div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/20 rounded-xl border border-border/30"></div>
        ))}
      </div>
    </div>
  )
}
