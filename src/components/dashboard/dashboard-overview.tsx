'use client'

import * as React from "react"
import { ArrowClockwise } from "@phosphor-icons/react"
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react"

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
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/validators"
import type { PortfolioHistoryPoint, PortfolioAnalytics, ApiErrorState } from "@/types"

function MetricsBand({
  totalValue,
  change24hValue,
  change24hPercent,
  walletCount,
  accountCount,
  assetCount,
  coveragePercent,
  hasErrors
}: {
  totalValue: number
  change24hValue: number
  change24hPercent: number
  walletCount: number
  accountCount: number
  assetCount: number
  coveragePercent: number
  hasErrors: boolean
}) {
  const isPositive = change24hPercent >= 0

  return (
    <div className="overflow-hidden rounded-xl border border-border/40">
      <div className="grid grid-cols-2 md:grid-cols-4">
        <div className="border-b border-r border-border/40 px-5 py-5 md:border-b-0">
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
        <div className="border-b border-border/40 px-5 py-5 md:border-b-0 md:border-r">
          <p className="muted-kicker">数据来源</p>
          <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{walletCount + accountCount}</p>
          <p className="mt-2 text-xs text-muted-foreground">{walletCount} 个钱包 · {accountCount} 个交易所</p>
        </div>
        <div className="border-r border-border/40 px-5 py-5">
          <p className="muted-kicker">资产种类</p>
          <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{assetCount}</p>
          <p className="mt-2 text-xs text-muted-foreground">覆盖率 {coveragePercent.toFixed(1)}%</p>
        </div>
        <div className="px-5 py-5">
          <p className="muted-kicker">系统状态</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${hasErrors ? 'text-foreground' : ''}`}>
            {hasErrors ? '需留意' : '正常'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {hasErrors ? '部分接口请求异常' : '全部来源已同步'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ChartAreaInteractive({ history }: { history: PortfolioHistoryPoint[] }) {
  const visibleHistory = history.slice(-30)

  return (
    <Card>
      <CardHeader className="border-b border-border/40">
        <CardTitle>总资产走势</CardTitle>
        <CardDescription>显示近 30 次同步刷新的净值变化记录</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] w-full">
          {visibleHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibleHistory} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    return new Date(value).toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })
                  }}
                  style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value) => [formatCurrency(value as number), "总价值"]}
                  labelFormatter={(label) => new Date(label).toLocaleString("zh-CN")}
                />
                <Area
                  type="monotone"
                  dataKey="totalValue"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#fillValue)"
                  strokeWidth={2}
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
                      style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
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
        change24hValue={change24hValue}
        change24hPercent={change24hPercent}
        walletCount={walletCount}
        accountCount={accountCount}
        assetCount={analytics.assetCount}
        coveragePercent={coveragePercent}
        hasErrors={hasErrors}
      />

      <ChartAreaInteractive history={history} />

      <DataTable assetData={assetData} />

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
      <div className="overflow-hidden rounded-xl border border-border/40">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-border/40 px-5 py-5 border-b border-r last:border-r-0 md:border-b-0">
              <div className="h-3 w-16 bg-muted rounded mb-3"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
              <div className="h-3 w-20 bg-muted rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
      <Card className="h-[310px] bg-muted/50 border-border/40"></Card>
      <Card className="h-40 bg-muted/50 border-border/40"></Card>
    </div>
  )
}
