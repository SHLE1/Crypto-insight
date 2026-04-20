'use client'

import Link from 'next/link'
import {
  ArrowClockwise,
  ArrowDown,
  ArrowUp,
  ListBullets,
} from '@phosphor-icons/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/validators'
import type {
  ApiErrorState,
  PortfolioAnalytics,
  PortfolioHistoryPoint,
} from '@/types'

const ASSET_COLORS = [
  'color-mix(in oklch, var(--chart-1) 74%, var(--background) 26%)',
  'color-mix(in oklch, var(--chart-2) 74%, var(--background) 26%)',
  'color-mix(in oklch, var(--chart-3) 74%, var(--background) 26%)',
  'color-mix(in oklch, var(--chart-4) 72%, var(--background) 28%)',
  'color-mix(in oklch, var(--chart-5) 72%, var(--background) 28%)',
  'color-mix(in oklch, var(--foreground) 18%, var(--background) 82%)',
]

const shellClassName =
  'rounded-md border border-border bg-card'
const sectionLabelClassName = 'text-[11px] font-medium tracking-[0.14em] text-muted-foreground'

function formatTickLabel(value: string | number) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTooltipLabel(label: unknown) {
  if (typeof label !== 'string' && typeof label !== 'number') {
    return ''
  }

  return new Date(label).toLocaleString('zh-CN')
}

function SummaryItem({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}) {
  const toneClassName =
    tone === 'positive'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-foreground'

  return (
    <div className="border-t border-border/50 pt-3 first:border-t-0 first:pt-0 sm:first:border-t sm:first:pt-3 xl:first:border-t-0 xl:first:pt-0">
      <p className={sectionLabelClassName}>{label}</p>
      <p className={`mt-2 text-[0.98rem] font-medium tracking-[-0.03em] ${toneClassName}`}>{value}</p>
      <p className="mt-1 text-xs leading-5.5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function DashboardHero({
  totalValue,
  change24hValue,
  change24hPercent,
  lastRefresh,
  assetCount,
  activeSourceCount,
  walletCount,
  accountCount,
  pricedAssetCount,
  missingPriceCount,
  stalePriceCount,
  isUsingCachedData,
  issueCount,
  isFetching,
  onRefresh,
}: {
  totalValue: number
  change24hValue: number
  change24hPercent: number
  lastRefresh: string | null
  assetCount: number
  activeSourceCount: number
  walletCount: number
  accountCount: number
  pricedAssetCount: number
  missingPriceCount: number
  stalePriceCount: number
  isUsingCachedData: boolean
  issueCount: number
  isFetching: boolean
  onRefresh: () => void
}) {
  const isPositive = change24hPercent >= 0
  const coveragePercent = assetCount > 0 ? (pricedAssetCount / assetCount) * 100 : 0
  const statusText = isUsingCachedData ? '显示缓存' : issueCount > 0 ? '需要留意' : '已同步'
  const lastRefreshText = lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '还没有刷新记录'

  return (
    <section className={`${shellClassName} px-5 py-5 md:px-6 md:py-6`}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className={sectionLabelClassName}>总览</p>
            <div className="space-y-1.5">
              <h1 className="max-w-[28ch] text-xl font-semibold tracking-[-0.04em] text-foreground">
                总资产和变化，都在这一屏先看清。
              </h1>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-muted-foreground">
              {statusText}
            </Badge>
            <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={isFetching}>
              <ArrowClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
              刷新
            </Button>
          </div>
        </div>

        <div className="grid gap-6 border-y border-border/55 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className={sectionLabelClassName}>总资产价值</p>
              <p className="text-[2.5rem] font-semibold tracking-[-0.06em] tabular-nums text-foreground">
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={isPositive
                  ? 'inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400'
                  : 'inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/8 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400'}
              >
                {isPositive ? <ArrowUp size={14} weight="bold" /> : <ArrowDown size={14} weight="bold" />}
                {formatPercent(change24hPercent)}
              </span>
              <p className="text-sm text-muted-foreground">
                {isPositive ? '+' : '-'}{formatCurrency(Math.abs(change24hValue))} · 最近一段可见变化
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-4">
            <div className="space-y-1.5">
              <p className={sectionLabelClassName}>快速判断</p>
              <p className="text-sm leading-7 text-muted-foreground">
                先确认总额、变化和覆盖率；如果不对，再进入资产明细定位问题。
              </p>
            </div>
            <div className="space-y-1 text-xs leading-6 text-muted-foreground">
              <p>最近刷新：{lastRefreshText}</p>
              <p>缺价 {missingPriceCount} 个 · 旧价 {stalePriceCount} 个</p>
            </div>
            <Link href="/holdings" className="inline-flex">
              <Button variant="outline" className="gap-2">
                <ListBullets size={16} weight="regular" />
                查看资产明细
              </Button>
            </Link>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem
            label="资产种类"
            value={`${assetCount}`}
            detail={`${pricedAssetCount} 个已有估值`}
          />
          <SummaryItem
            label="已启用来源"
            value={`${activeSourceCount}`}
            detail={`${walletCount} 个钱包 · ${accountCount} 个交易所账户`}
          />
          <SummaryItem
            label="价格覆盖"
            value={`${coveragePercent.toFixed(1)}%`}
            detail={`缺价 ${missingPriceCount} 个 · 旧价 ${stalePriceCount} 个`}
            tone={missingPriceCount + stalePriceCount > 0 ? 'warning' : 'default'}
          />
          <SummaryItem
            label="最近刷新"
            value={lastRefreshText}
            detail={isUsingCachedData ? '当前显示的是最近一次可用快照' : issueCount > 0 ? `${issueCount} 条提醒需要留意` : '当前主要来源已经完成同步'}
            tone={issueCount > 0 ? 'warning' : 'default'}
          />
        </dl>
      </div>
    </section>
  )
}

function DashboardComposition({
  assetData,
  totalValue,
  walletTotal,
  cexTotal,
  walletCount,
  accountCount,
}: {
  assetData: Array<{ name: string; value: number }>
  totalValue: number
  walletTotal: number
  cexTotal: number
  walletCount: number
  accountCount: number
}) {
  if (assetData.length === 0) {
    return (
      <section className={`${shellClassName} px-5 py-5 md:px-6 md:py-6`}>
        <div className="space-y-2">
          <p className={sectionLabelClassName}>结构</p>
          <h2 className="text-lg font-medium tracking-[-0.04em] text-foreground">资产占比</h2>
          <p className="text-sm leading-7 text-muted-foreground">现在还没有可显示的资产结构。</p>
        </div>
      </section>
    )
  }

  const dominantAsset = assetData[0]
  const dominantShare = totalValue > 0 ? (dominantAsset.value / totalValue) * 100 : 0
  const totalSources = walletCount + accountCount
  const walletShare = walletTotal + cexTotal > 0 ? (walletTotal / (walletTotal + cexTotal)) * 100 : 0
  const cexShare = walletTotal + cexTotal > 0 ? (cexTotal / (walletTotal + cexTotal)) * 100 : 0

  return (
    <section className={`${shellClassName} px-5 py-5 md:px-6 md:py-6`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className={sectionLabelClassName}>结构</p>
          <div>
            <h2 className="text-lg font-medium tracking-[-0.04em] text-foreground">资产占比</h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              先看哪一类资产最重，再决定要不要往下钻。
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="min-w-0">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={76}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="transparent"
                >
                  {assetData.map((_, index) => (
                    <Cell key={`asset-cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'color-mix(in oklch, var(--popover) 96%, white 4%)',
                    boxShadow: '0 16px 40px -28px color-mix(in oklch, var(--foreground) 24%, transparent)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            {assetData.map((item, index) => {
              const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0

              return (
                <div key={item.name} className="flex items-start justify-between gap-3 border-b border-border/50 py-3 last:border-b-0 last:pb-0 first:pt-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="mt-0.5 h-2 w-2 rounded-full"
                        style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                      />
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">占总资产的 {share.toFixed(1)}%</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">{formatCurrency(item.value)}</p>
                </div>
              )
            })}
          </div>
        </div>

        <dl className="grid gap-4 border-t border-border/50 pt-4 sm:grid-cols-3">
          <SummaryItem
            label="主导资产"
            value={dominantAsset.name}
            detail={`当前占总资产 ${dominantShare.toFixed(1)}%`}
          />
          <SummaryItem
            label="来源结构"
            value={`链上 ${walletShare.toFixed(1)}% · 交易所 ${cexShare.toFixed(1)}%`}
            detail="帮助你判断资产主要停留在哪里"
          />
          <SummaryItem
            label="来源数量"
            value={`${totalSources}`}
            detail={`${walletCount} 个钱包 · ${accountCount} 个交易所账户`}
          />
        </dl>
      </div>
    </section>
  )
}

function DashboardTrend({ history }: { history: PortfolioHistoryPoint[] }) {
  const visibleHistory = history.slice(-24)

  if (visibleHistory.length === 0) {
    return (
      <section className={`${shellClassName} px-5 py-5 md:px-6 md:py-6`}>
        <div className="space-y-2">
          <p className={sectionLabelClassName}>趋势</p>
          <h2 className="text-lg font-medium tracking-[-0.04em] text-foreground">总资产趋势</h2>
          <p className="text-sm leading-7 text-muted-foreground">刷新几次后，这里会开始显示总资产趋势。</p>
        </div>
      </section>
    )
  }

  const firstPoint = visibleHistory[0]
  const lastPoint = visibleHistory[visibleHistory.length - 1]
  const netChange = lastPoint.totalValue - firstPoint.totalValue
  const netChangePercent = firstPoint.totalValue > 0 ? (netChange / firstPoint.totalValue) * 100 : 0
  const rangeHigh = Math.max(...visibleHistory.map((point) => point.totalValue))
  const rangeLow = Math.min(...visibleHistory.map((point) => point.totalValue))
  const rangePercent = rangeLow > 0 ? ((rangeHigh - rangeLow) / rangeLow) * 100 : 0

  return (
    <section className={`${shellClassName} px-5 py-5 md:px-6 md:py-6`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className={sectionLabelClassName}>趋势</p>
            <div>
              <h2 className="text-lg font-medium tracking-[-0.04em] text-foreground">总资产趋势</h2>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">用最近几次刷新记录判断波动，再决定是否继续查明细。</p>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p className={sectionLabelClassName}>当前值</p>
            <p className="mt-2 text-lg font-medium tracking-[-0.04em] text-foreground">{formatCurrency(lastPoint.totalValue)}</p>
            <p className={`mt-1 text-sm ${netChange >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netChange)} · {formatPercent(netChangePercent)}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={visibleHistory} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardNetWorthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="color-mix(in oklch, var(--chart-1) 72%, var(--background) 28%)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="color-mix(in oklch, var(--chart-1) 72%, var(--background) 28%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTickLabel}
                minTickGap={36}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'color-mix(in oklch, var(--popover) 96%, white 4%)',
                  boxShadow: '0 16px 40px -28px color-mix(in oklch, var(--foreground) 24%, transparent)',
                }}
              />
              <Area
                type="monotone"
                dataKey="totalValue"
                stroke="color-mix(in oklch, var(--chart-1) 72%, var(--foreground) 28%)"
                fill="url(#dashboardNetWorthFill)"
                strokeWidth={2}
                dot={visibleHistory.length === 1}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <span>最近 {visibleHistory.length} 次刷新记录</span>
          <span>高点 {formatCurrency(rangeHigh)}</span>
          <span>低点 {formatCurrency(rangeLow)}</span>
          <span>振幅 {formatPercent(rangePercent)}</span>
        </div>
      </div>
    </section>
  )
}

export function DashboardOverview({
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
  isUsingCachedData,
  isFetching,
  walletCount,
  accountCount,
  onRefresh,
}: {
  history: PortfolioHistoryPoint[]
  errors: ApiErrorState[]
  lastRefresh: string | null
  totalValue: number
  change24hValue: number
  change24hPercent: number
  assetData: Array<{ name: string; value: number }>
  walletTotal: number
  cexTotal: number
  analytics: PortfolioAnalytics
  isUsingCachedData: boolean
  isFetching: boolean
  walletCount: number
  accountCount: number
  onRefresh: () => void
}) {
  return (
    <div className="space-y-5">
      <DashboardHero
        totalValue={totalValue}
        change24hValue={change24hValue}
        change24hPercent={change24hPercent}
        lastRefresh={lastRefresh}
        assetCount={analytics.assetCount}
        activeSourceCount={analytics.activeSourceCount}
        walletCount={walletCount}
        accountCount={accountCount}
        pricedAssetCount={analytics.pricedAssetCount}
        missingPriceCount={analytics.missingPriceCount}
        stalePriceCount={analytics.stalePriceCount}
        isUsingCachedData={isUsingCachedData}
        issueCount={errors.length}
        isFetching={isFetching}
        onRefresh={onRefresh}
      />

      <DashboardComposition
        assetData={assetData}
        totalValue={totalValue}
        walletTotal={walletTotal}
        cexTotal={cexTotal}
        walletCount={walletCount}
        accountCount={accountCount}
      />

      <DashboardTrend history={history} />

      {errors.length > 0 ? <AlertsPanel errors={errors} /> : null}
    </div>
  )
}

export function DashboardOverviewLoadingState() {
  return (
    <div className="space-y-5">
      <div className={`${shellClassName} h-[24rem] animate-pulse bg-muted/24`} />
      <div className={`${shellClassName} h-[28rem] animate-pulse bg-muted/18`} />
      <div className={`${shellClassName} h-[24rem] animate-pulse bg-muted/16`} />
    </div>
  )
}
