'use client'

import * as React from "react"
import Link from "next/link"
import { ArrowClockwise } from "@phosphor-icons/react"
import { TrendingUp, TrendingDown, AlertCircle, Navigation, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/validators"
import { formatDefiChainLabel } from "@/lib/defi/chains"
import type { PortfolioHistoryPoint, PortfolioAnalytics, ApiErrorState } from "@/types"

// ─── Chart palette ────────────────────────────────────────────────────────────
// Use var(--chart-N) directly — the CSS variables are full oklch values,
// wrapping them in hsl() is invalid and makes SVG fill default to black
// and CSS backgroundColor default to transparent.
const C = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const C_MUTED = 'oklch(0.7 0 0 / 0.35)'

// ─── Shared tooltip helpers ───────────────────────────────────────────────────
const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--background)',
  borderColor: 'var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  padding: '8px 12px',
}
const TOOLTIP_WRAPPER: React.CSSProperties = {
  zIndex: 50,
  outline: 'none',
}

/** Custom tooltip rendered via `content` prop — no CSS-var issues, full control */
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color?: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={TOOLTIP_STYLE} className="border">
      <div className="flex items-center gap-2 mb-1">
        {item.payload.color && (
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.payload.color }} />
        )}
        <span className="font-semibold text-foreground">{item.name}</span>
      </div>
      <span className="tabular-nums text-muted-foreground">{formatCurrency(item.value)}</span>
    </div>
  )
}

/** Stable activeShape — subtle 4px outer ring, no dramatic expansion */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieActiveShape = (props: any) => (
  <Sector
    {...props}
    outerRadius={props.outerRadius + 5}
    innerRadius={props.innerRadius}
    strokeWidth={0}
  />
)
function AssetDonutChart({
  assetData,
  totalValue,
}: {
  assetData: Array<{ name: string; value: number }>
  totalValue: number
}) {
  const MAX = 5
  const top = assetData.slice(0, MAX)
  const restValue = assetData.slice(MAX).reduce((s, i) => s + i.value, 0)
  const chartData = [
    ...top.map((item, i) => ({ ...item, color: C[i] })),
    ...(restValue > 0 ? [{ name: '其他', value: restValue, color: C_MUTED }] : []),
  ]
  const hasData = chartData.some(d => d.value > 0)

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>资产分布</CardTitle>
        <CardDescription>前 {Math.min(MAX, assetData.length)} 大持仓占比</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {hasData ? (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Donut */}
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    activeShape={PieActiveShape}
                  >
                    {chartData.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    wrapperStyle={TOOLTIP_WRAPPER}
                    content={<PieTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-0 w-full">
              {chartData.map((item, i) => {
                const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{share.toFixed(1)}%</span>
                    <span className="text-xs font-semibold tabular-nums w-[72px] text-right">{formatCurrency(item.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">暂无资产数据</div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Source Split ─────────────────────────────────────────────────────────────
function SourceAndPerformanceChart({
  totalValue,
  sourceSplit,
}: {
  totalValue: number
  sourceSplit: Array<{ id: string; label: string; sourceType: 'wallet' | 'cex'; value: number }>
}) {
  // Map each source to a color and augment with share
  const pieData = sourceSplit.length > 0
    ? sourceSplit.map((s, i) => ({
        ...s,
        name: s.label,
        color: C[i % C.length],
      }))
    : [{ id: '_empty', name: '暂无数据', label: '暂无数据', sourceType: 'wallet' as const, value: 1, color: C_MUTED }]

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>资产来源</CardTitle>
        <CardDescription>各钱包 / 交易所持仓占比</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col gap-5">
        {/* Source donut */}
        <div className="flex items-center gap-4">
          <div className="h-[120px] w-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                  activeShape={PieActiveShape}
                >
                  {pieData.map((item, i) => (
                    <Cell key={i} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  wrapperStyle={TOOLTIP_WRAPPER}
                  content={<PieTooltip />}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend — one row per source */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {sourceSplit.map((item, i) => {
              const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0
              return (
                <div key={item.id} className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: C[i % C.length] }} />
                  <span className="text-xs font-medium flex-1 truncate" title={item.label}>{item.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-1">{share.toFixed(1)}%</span>
                </div>
              )
            })}
            {sourceSplit.length === 0 && (
              <span className="text-xs text-muted-foreground">暂无来源数据</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Top Holdings Bar (pure CSS — no recharts layout quirks) ──────────────────
function TopHoldingsBar({
  assetData,
  totalValue,
}: {
  assetData: Array<{ name: string; value: number }>
  totalValue: number
}) {
  const top7 = assetData.slice(0, 7).map((item, i) => ({
    name: item.name,
    value: item.value,
    share: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    color: C[i % C.length],
  }))

  if (top7.length === 0) return null

  // normalise bar widths relative to the largest slice so the chart fills the track
  const maxShare = Math.max(...top7.map(d => d.share), 0.001)

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>持仓规模排行</CardTitle>
        <CardDescription>前 {top7.length} 大持仓按市值排序</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 px-5">
        <div className="flex flex-col gap-3">
          {top7.map((item, i) => (
            <div key={i} className="flex items-center gap-3 min-w-0">
              {/* Name — fixed width, right-aligned, truncate long names */}
              <span
                className="text-xs text-muted-foreground text-right truncate shrink-0"
                style={{ width: 88 }}
                title={item.name}
              >
                {item.name}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-[18px] rounded-sm overflow-hidden bg-muted/30 min-w-0">
                <div
                  className="h-full rounded-sm transition-[width] duration-500"
                  style={{
                    width: `${(item.share / maxShare) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              {/* Percentage + value */}
              <div className="shrink-0 flex items-center gap-3" style={{ minWidth: 120 }}>
                <span className="text-xs font-semibold tabular-nums w-10 text-right">{item.share.toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── MetricsBand ──────────────────────────────────────────────────────────────
function MetricsBand({
  totalValue,
  change24hPercent,
  walletCount,
  accountCount,
  assetCount,
  coveragePercent,
  hasErrors
}: {
  totalValue: number
  change24hPercent: number
  walletCount: number
  accountCount: number
  assetCount: number
  coveragePercent: number
  hasErrors: boolean
}) {
  const isPositive = change24hPercent >= 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl border border-border/60 px-5 py-5">
        <p className="muted-kicker">净资产</p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(totalValue)}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isPositive ? '+' : '-'}{formatPercent(Math.abs(change24hPercent))}
          </span>
          <span className="text-xs text-muted-foreground">较昨日</span>
        </div>
      </div>
      <div className="rounded-xl border border-border/60 px-5 py-5">
        <p className="muted-kicker">数据来源</p>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{walletCount + accountCount}</p>
        <p className="mt-2 text-xs text-muted-foreground">{walletCount} 个钱包 · {accountCount} 个交易所</p>
      </div>
      <div className="rounded-xl border border-border/60 px-5 py-5">
        <p className="muted-kicker">资产种类</p>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{assetCount}</p>
        <p className="mt-2 text-xs text-muted-foreground">覆盖率 {coveragePercent.toFixed(1)}%</p>
      </div>
      <div className="rounded-xl border border-border/60 px-5 py-5">
        <p className="muted-kicker">系统状态</p>
        <p className={`mt-2 text-2xl font-bold tracking-tight ${hasErrors ? 'text-foreground' : ''}`}>
          {hasErrors ? '需留意' : '正常'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {hasErrors ? '部分接口请求异常' : '全部来源已同步'}
        </p>
      </div>
    </div>
  )
}

function ChartAreaInteractive({ history }: { history: PortfolioHistoryPoint[] }) {
  const visibleHistory = history.slice(-30)

  const spansMultipleDays = visibleHistory.length > 1 && (() => {
    const first = new Date(visibleHistory[0].timestamp)
    const last = new Date(visibleHistory[visibleHistory.length - 1].timestamp)
    return first.toDateString() !== last.toDateString()
  })()

  const formatTick = (value: string) => {
    const d = new Date(value)
    if (spansMultipleDays) {
      return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
        d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>总资产走势</CardTitle>
        <CardDescription>每个数据点对应一次实际刷新，不填充空白时间段</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] w-full">
          {visibleHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibleHistory} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={48}
                  tickFormatter={formatTick}
                  style={{ fontSize: '12px', fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  style={{ fontSize: '12px', fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                  wrapperStyle={TOOLTIP_WRAPPER}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [formatCurrency(value as number), "总价值"]}
                  labelFormatter={(label) => new Date(label).toLocaleString("zh-CN")}
                />
                <Area
                  type="monotone"
                  dataKey="totalValue"
                  stroke="var(--chart-1)"
                  fill="url(#fillValue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--background)', stroke: 'var(--chart-1)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              累计多次刷新后在此展示走势图表
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DataTable({ assetData }: { assetData: Array<{ name: string; value: number }> }) {
  const total = assetData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>资产分布</CardTitle>
        <CardDescription>当前可估值的持仓种类与市值</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {assetData.length > 0 ? (
          <div className="divide-y divide-border/30">
            {assetData.map((item, index) => {
              const share = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={index} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
                    />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <span className="text-xs tabular-nums text-muted-foreground hidden sm:inline w-10 text-right">{share.toFixed(1)}%</span>
                    <span className="text-sm font-medium tabular-nums w-24 text-right">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">暂无持有资产</div>
        )}
      </CardContent>
    </Card>
  )
}

function DefiProtocolPanel({
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
    <Card>
      <CardHeader className="border-b border-border/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>DeFi 协议</CardTitle>
            <CardDescription>
              {positionCount > 0 ? `${positionCount} 个仓位，按协议和链汇总` : '协议仓位正在等待可用数据'}
            </CardDescription>
          </div>
          <Link href="/defi">
            <Button variant="outline" size="sm" className="gap-1">
              查看详情 <Navigation className="size-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-px border-b border-border/40 bg-border/40 md:grid-cols-4">
          {[
            ['净值', formatCurrency(totalValue)],
            ['总存入', formatCurrency(depositedValue)],
            ['总借出', formatCurrency(borrowedValue)],
            ['待领取奖励', formatCurrency(rewardsValue)],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-5 py-4">
              <p className="muted-kicker">{label}</p>
              <p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-0 divide-y divide-border/40 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="p-5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">协议分布</h4>
            <div className="mt-3 divide-y divide-border/30">
              {protocolData.slice(0, 4).map((protocol) => (
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
              {protocolData.length === 0 ? <p className="py-4 text-sm text-muted-foreground">暂无协议仓位</p> : null}
            </div>
          </div>
          <div className="p-5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">链分布</h4>
            <div className="mt-3 divide-y divide-border/30">
              {chainData.slice(0, 4).map((chain) => (
                <div key={chain.name} className="flex items-center justify-between gap-4 py-2.5">
                  <p className="text-sm font-medium">{formatDefiChainLabel(chain.name)}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(chain.value)}</p>
                </div>
              ))}
              {chainData.length === 0 ? <p className="py-4 text-sm text-muted-foreground">暂无链分布数据</p> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardOverview({
  history,
  errors,
  lastRefresh,
  totalValue,
  change24hPercent,
  assetData,
  analytics,
  sourceSplit,
  isUsingCachedData,
  isFetching,
  walletCount,
  accountCount,
  defiTotalValue,
  defiTotalDepositedValue,
  defiTotalBorrowedValue,
  defiTotalRewardsValue,
  defiProtocolData,
  defiChainData,
  defiPositionCount,
  onRefresh,
}: {
  history: PortfolioHistoryPoint[]
  errors: ApiErrorState[]
  lastRefresh: string | null
  totalValue: number
  change24hPercent: number
  assetData: Array<{ name: string; value: number }>
  analytics: PortfolioAnalytics
  sourceSplit: Array<{ id: string; label: string; sourceType: 'wallet' | 'cex'; value: number }>
  isUsingCachedData: boolean
  isFetching: boolean
  walletCount: number
  accountCount: number
  defiTotalValue: number
  defiTotalDepositedValue: number
  defiTotalBorrowedValue: number
  defiTotalRewardsValue: number
  defiProtocolData: Array<{
    protocolId: string
    protocolName: string
    chainKey: string
    category?: string
    value: number
    positionCount: number
  }>
  defiChainData: Array<{ name: string; value: number }>
  defiPositionCount: number
  onRefresh: () => void
}) {
  const coveragePercent = analytics.assetCount > 0 ? (analytics.pricedAssetCount / analytics.assetCount) * 100 : 0
  const hasErrors = errors.length > 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isUsingCachedData ? "secondary" : "outline"} className="cursor-default">
            {isUsingCachedData ? "显示缓存" : "最新数据"}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {lastRefresh ? `上次更新: ${new Date(lastRefresh).toLocaleString('zh-CN')}` : "尚未刷新"}
          </span>
        </div>
        <Button size="sm" onClick={onRefresh} disabled={isFetching} className="gap-2">
          <ArrowClockwise className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新同步
        </Button>
      </div>

      <MetricsBand
        totalValue={totalValue}
        change24hPercent={change24hPercent}
        walletCount={walletCount}
        accountCount={accountCount}
        assetCount={analytics.assetCount}
        coveragePercent={coveragePercent}
        hasErrors={hasErrors}
      />

      <ChartAreaInteractive history={history} />

      {/* ── 新增：资产分析图表区 ── */}
      {assetData.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <AssetDonutChart assetData={assetData} totalValue={totalValue} />
            <SourceAndPerformanceChart totalValue={totalValue} sourceSplit={sourceSplit} />
          </div>
          <TopHoldingsBar assetData={assetData} totalValue={totalValue} />
        </>
      )}

      <DataTable assetData={assetData} />

      <DefiProtocolPanel
        totalValue={defiTotalValue}
        depositedValue={defiTotalDepositedValue}
        borrowedValue={defiTotalBorrowedValue}
        rewardsValue={defiTotalRewardsValue}
        positionCount={defiPositionCount}
        protocolData={defiProtocolData}
        chainData={defiChainData}
      />

      {hasErrors && (
        <Card className="border-border/50 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              数据同步异常
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {errors.map((err, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{err.title || err.source}</span>
                <span className="text-xs text-muted-foreground">{err.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function DashboardOverviewLoadingState() {
  return (
    <div className="flex flex-1 flex-col gap-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 w-32 bg-muted rounded-lg"></div>
        <div className="h-8 w-24 bg-muted rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 px-5 py-5">
            <div className="h-3 w-16 bg-muted rounded mb-3"></div>
            <div className="h-8 w-24 bg-muted rounded"></div>
            <div className="h-3 w-20 bg-muted rounded mt-2"></div>
          </div>
        ))}
      </div>
      <Card className="h-[310px] bg-muted/50 border-border/40"></Card>
      <Card className="h-40 bg-muted/50 border-border/40"></Card>
    </div>
  )
}
