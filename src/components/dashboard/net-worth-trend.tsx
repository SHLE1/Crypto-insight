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
      <Card className="col-span-full md:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-medium">资产变化看板</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">完成几次刷新后，这里会显示总资产变化趋势。</p>
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
    <Card className="col-span-full md:col-span-2 xl:col-span-1">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-label">Trend</p>
          <CardTitle className="mt-3 text-base">净值变化曲线</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">最近 {visibleData.length} 次刷新记录</p>
        </div>
        <div className="surface-subtle rounded-[1.15rem] px-4 py-3 text-right">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">区间变化</p>
          <p className="mt-2 text-sm font-semibold tracking-[-0.03em] text-foreground">{formatCurrency(lastPoint.totalValue)}</p>
          <p className={`mt-1 text-xs ${isPositive ? 'text-[var(--data-positive)]' : 'text-[var(--data-negative)]'}`}>
            {isPositive ? '+' : ''}
            {formatCurrency(netChange)} · {formatPercent(netChangePercent)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-4 sm:px-6">
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="surface-subtle rounded-[1.15rem] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">区间高点</p>
            <p className="mt-2 text-sm font-medium tracking-[-0.03em]">{formatCurrency(rangeHigh)}</p>
          </div>
          <div className="surface-subtle rounded-[1.15rem] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">区间低点</p>
            <p className="mt-2 text-sm font-medium tracking-[-0.03em]">{formatCurrency(rangeLow)}</p>
          </div>
          <div className="surface-subtle rounded-[1.15rem] p-3.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">振幅</p>
            <p className="mt-2 text-sm font-medium tracking-[-0.03em] text-[var(--data-neutral)]">{formatPercent(rangePercent)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={286}>
          <AreaChart data={visibleData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.26} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
              width={82}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
              contentStyle={{
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                background: 'var(--popover)',
                boxShadow: 'var(--shadow-lg)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.35rem' }}
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={formatTooltipLabel}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="var(--chart-1)"
              fill="url(#netWorthFill)"
              strokeWidth={2.25}
              dot={visibleData.length === 1}
              activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
