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
      <CardHeader className="border-b border-border/80">
        <div>
          <p className="muted-kicker">Trend</p>
          <CardTitle className="mt-2 text-base">资产变化看板</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">最近 {visibleData.length} 次刷新记录</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
            高点 <span className="font-medium text-foreground/90">{formatCurrency(rangeHigh)}</span>
          </span>
          <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
            低点 <span className="font-medium text-foreground/90">{formatCurrency(rangeLow)}</span>
          </span>
          <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1">
            振幅 <span className="font-medium text-foreground/90">{formatPercent(rangePercent)}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">{formatCurrency(lastPoint.totalValue)}</p>
            <p className={`mt-1 text-xs ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}
              {formatCurrency(netChange)} · {formatPercent(netChangePercent)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={visibleData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--popover)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
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
