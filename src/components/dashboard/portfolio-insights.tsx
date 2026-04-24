'use client'

import type { ComponentType } from 'react'
import { ArrowUpRight, Pulse, ShieldWarning, SquaresFour } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/validators'
import type { PortfolioAnalytics } from '@/types'

interface PortfolioInsightsProps {
  analytics: PortfolioAnalytics
}

function InsightBlock({
  icon: Icon,
  title,
  value,
  detail,
  tone = 'default',
}: {
  icon: ComponentType<{ size?: number; weight?: 'regular' | 'duotone' | 'fill'; className?: string }>
  title: string
  value: string
  detail: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}) {
  const toneClassName =
    tone === 'positive'
      ? 'text-foreground font-medium'
      : tone === 'negative'
        ? 'text-muted-foreground'
        : tone === 'warning'
          ? 'text-foreground font-medium'
          : 'text-foreground'

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground">
        <Icon size={14} weight="regular" />
        <span>{title}</span>
      </div>
      <p className={`mt-3 text-lg font-semibold tracking-[-0.03em] ${toneClassName}`}>{value}</p>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}

export function PortfolioInsights({ analytics }: PortfolioInsightsProps) {
  const coveragePercent =
    analytics.assetCount > 0 ? (analytics.pricedAssetCount / analytics.assetCount) * 100 : 0
  const topHoldingLabel = analytics.topHolding
    ? `${analytics.topHolding.symbol} · ${analytics.topHolding.share.toFixed(1)}%`
    : '暂无主导仓位'
  const bestTone =
    analytics.bestPerformer && (analytics.bestPerformer.change24h ?? 0) > 0 ? 'positive' : 'default'
  const worstTone =
    analytics.worstPerformer && (analytics.worstPerformer.change24h ?? 0) < 0 ? 'negative' : 'default'
  const rangePercent =
    analytics.historyHigh && analytics.historyLow && analytics.historyLow > 0
      ? ((analytics.historyHigh - analytics.historyLow) / analytics.historyLow) * 100
      : null

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="muted-kicker">组合摘要</p>
          <CardTitle className="text-base">组合摘要</CardTitle>
          <p className="text-xs leading-6 text-muted-foreground">把集中度、价格覆盖和涨跌分化放在一屏里快速看清。</p>
        </div>
        <Badge variant="secondary">{analytics.activeSourceCount} 个已启用来源</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightBlock
          icon={SquaresFour}
          title="仓位集中度"
          value={`前 3 大占 ${analytics.topThreeShare.toFixed(1)}%`}
          detail={`最大仓位：${topHoldingLabel}`}
          tone={analytics.topThreeShare >= 65 ? 'warning' : 'default'}
        />
        <InsightBlock
          icon={ShieldWarning}
          title="价格覆盖"
          value={`${analytics.pricedAssetCount} / ${analytics.assetCount} 个可估值`}
          detail={`覆盖率 ${coveragePercent.toFixed(1)}% · 缺价 ${analytics.missingPriceCount} 个 · 旧价 ${analytics.stalePriceCount} 个`}
          tone={analytics.missingPriceCount > 0 ? 'warning' : 'default'}
        />
        <InsightBlock
          icon={ArrowUpRight}
          title="强弱分化"
          value={
            analytics.bestPerformer
              ? `${analytics.bestPerformer.symbol} ${formatPercent(analytics.bestPerformer.change24h)}`
              : '--'
          }
          detail={
            analytics.worstPerformer
              ? `最弱：${analytics.worstPerformer.symbol} ${formatPercent(analytics.worstPerformer.change24h)}`
              : '暂无足够的涨跌数据。'
          }
          tone={bestTone}
        />
        <InsightBlock
          icon={Pulse}
          title="波动区间"
          value={
            rangePercent !== null
              ? `${rangePercent.toFixed(1)}%`
              : formatCurrency(analytics.averagePositionValue)
          }
          detail={
            analytics.historyHigh !== null && analytics.historyLow !== null
              ? `区间高点 ${formatCurrency(analytics.historyHigh)} · 低点 ${formatCurrency(analytics.historyLow)}`
              : `平均单项资产 ${formatCurrency(analytics.averagePositionValue)}`
          }
          tone={worstTone}
        />
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 md:col-span-2 xl:col-span-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs tracking-[0.08em] text-muted-foreground">资产来源</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                链上 {analytics.walletShare.toFixed(1)}% · 交易所 {analytics.cexShare.toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>历史记录 {analytics.historyPoints} 条</span>
              <span>平均单项资产 {formatCurrency(analytics.averagePositionValue)}</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/20">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--chart-1)_0%,var(--chart-1)_var(--wallet-share),var(--chart-2)_var(--wallet-share),var(--chart-2)_100%)]"
              style={{ ['--wallet-share' as string]: `${analytics.walletShare}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>链上钱包</span>
            <span>交易所账户</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
