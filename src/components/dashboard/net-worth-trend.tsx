'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/validators'
import type { PortfolioHistoryPoint } from '@/types'

interface NetWorthTrendProps {
  data: PortfolioHistoryPoint[]
}

function formatTickLabel(value: string | number) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTooltipLabel(label: unknown) {
  return new Date(label as string | number).toLocaleString('zh-CN')
}

export function NetWorthTrend({ data }: NetWorthTrendProps) {
  const visibleData = data.slice(-24)

  if (visibleData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex flex-col gap-2">
            <p className="muted-kicker">趋势</p>
            <CardTitle className="text-base">总资产趋势</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="max-w-[56ch] text-sm leading-7 text-muted-foreground">
            刷新几次后，这里会显示总资产趋势，方便你判断净值变化和同步节奏。
          </p>
        </CardContent>
      </Card>
    )
  }

  const firstPoint = visibleData[0]
  const lastPoint = visibleData[visibleData.length - 1]
  const netChange = lastPoint.totalValue - firstPoint.totalValue
  const netChangePercent = firstPoint.totalValue > 0 ? (netChange / firstPoint.totalValue) * 100 : 0
  const isPositive = netChange >= 0
  const rangeHigh = Math.max(...visibleData.map((point) => point.totalValue))
  const rangeLow = Math.min(...visibleData.map((point) => point.totalValue))
  const rangePercent = rangeLow > 0 ? ((rangeHigh - rangeLow) / rangeLow) * 100 : 0

  return (
    <Card className="col-span-full">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="muted-kicker">趋势</p>
            <CardTitle className="mt-2 text-base">总资产趋势</CardTitle>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">最近 {visibleData.length} 次刷新记录</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border/60 bg-muted/35 px-3 py-1.5">
              高点 <span className="font-medium text-foreground/90">{formatCurrency(rangeHigh)}</span>
            </span>
            <span className="rounded-md border border-border/60 bg-muted/35 px-3 py-1.5">
              低点 <span className="font-medium text-foreground/90">{formatCurrency(rangeLow)}</span>
            </span>
            <span className="rounded-md border border-border/60 bg-muted/35 px-3 py-1.5">
              振幅 <span className="font-medium text-foreground/90">{formatPercent(rangePercent)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">{formatCurrency(lastPoint.totalValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPositive ? '+' : ''}
              {formatCurrency(netChange)} · {formatPercent(netChangePercent)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={visibleData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'color-mix(in oklch, var(--popover) 96%, white 4%)',
                boxShadow: '0 16px 40px -28px color-mix(in oklch, var(--foreground) 24%, transparent)',
              }}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="var(--chart-1)"
              fill="url(#netWorthFill)"
              strokeWidth={2}
              dot={visibleData.length === 1}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
