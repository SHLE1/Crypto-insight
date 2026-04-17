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
  if (typeof label !== 'string' && typeof label !== 'number') {
    return ''
  }

  return new Date(label).toLocaleString('zh-CN')
}

export function NetWorthTrend({ data }: NetWorthTrendProps) {
  const visibleData = data.slice(-24)

  if (visibleData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">资产变化看板</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">完成几次刷新后，这里会显示总资产变化趋势。</p>
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
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border/50">
        <div>
          <CardTitle className="text-sm font-medium">资产变化看板</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            最近 {visibleData.length} 次刷新记录
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{formatCurrency(lastPoint.totalValue)}</p>
          <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}
            {formatCurrency(netChange)}
            {' · '}
            {formatPercent(netChangePercent)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-[11px] text-muted-foreground">区间高点</p>
            <p className="mt-1 text-sm font-medium">{formatCurrency(rangeHigh)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-[11px] text-muted-foreground">区间低点</p>
            <p className="mt-1 text-sm font-medium">{formatCurrency(rangeLow)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-[11px] text-muted-foreground">振幅</p>
            <p className={`mt-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
              {formatPercent(rangePercent)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={visibleData} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="hsl(220, 70%, 55%)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTickLabel}
              minTickGap={36}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="hsl(220, 70%, 55%)"
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
