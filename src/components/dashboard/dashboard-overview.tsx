'use client'

import * as React from "react"
import { ArrowClockwise } from "@phosphor-icons/react"
import { TrendingUp, TrendingDown, Wallet, Activity, Database, AlertCircle } from "lucide-react"

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

function SectionCards({
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
          <CardTitle className="text-sm font-medium">总资产价值</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-foreground font-medium">
              {isPositive ? '+' : '-'}{formatPercent(Math.abs(change24hPercent))}
            </span>
            <span>较昨日</span>
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
          <CardTitle className="text-sm font-medium">来源连接数</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{walletCount + accountCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {walletCount} 个钱包, {accountCount} 个交易所账户
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
          <CardTitle className="text-sm font-medium">资产种类</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assetCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            价格覆盖率 {coveragePercent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-2">
          <CardTitle className="text-sm font-medium">系统状态</CardTitle>
          <AlertCircle className={`h-4 w-4 ${hasErrors ? 'text-foreground' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${hasErrors ? 'text-foreground' : ''}`}>
            {hasErrors ? '需要留意' : '运行正常'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {hasErrors ? '部分接口请求异常，请查看下方' : '全部数据源已同步并估值'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ChartAreaInteractive({ history }: { history: PortfolioHistoryPoint[] }) {
  const visibleHistory = history.slice(-30)

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 gap-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>总资产走势</CardTitle>
          <CardDescription>
            显示近 30 次同步刷新的净值变化记录
          </CardDescription>
        </div>
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>资产明细分布</CardTitle>
        <CardDescription>当前有价值的资产种类与市值。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">资产</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">价值</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {assetData.length > 0 ? (
                assetData.map((item, index) => (
                  <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className="h-2 w-2 rounded-full hidden sm:block"
                          style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                        />
                        {item.name}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right tabular-nums">
                      {formatCurrency(item.value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-muted-foreground">暂无持有资产</td>
                </tr>
              )}
            </tbody>
          </table>
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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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

      <SectionCards 
        totalValue={totalValue}
        change24hValue={change24hValue}
        change24hPercent={change24hPercent}
        walletCount={walletCount}
        accountCount={accountCount}
        assetCount={analytics.assetCount}
        coveragePercent={coveragePercent}
        hasErrors={hasErrors}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-4">
          <ChartAreaInteractive history={history} />
        </div>
        <div className="col-span-4 lg:col-span-3">
          <DataTable assetData={assetData} />
        </div>
      </div>
      
      {hasErrors && (
        <Card className="border-border/50 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5" />
              数据同步异常
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {errors.map((err, i) => (
              <div key={i} className="flex flex-col gap-1">
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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 animate-pulse">
      <div className="flex justify-between items-center mb-2">
        <div className="h-6 w-32 bg-muted rounded"></div>
        <div className="h-8 w-24 bg-muted rounded"></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 bg-muted/50"></Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 h-[350px] bg-muted/50"></Card>
        <Card className="col-span-3 h-[350px] bg-muted/50"></Card>
      </div>
    </div>
  )
}
