'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/validators'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'color-mix(in oklch, var(--foreground) 28%, transparent)',
]

interface AssetDistributionProps {
  data: { name: string; value: number }[]
  totalValue: number
}

export function AssetDistribution({ data, totalValue }: AssetDistributionProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <p className="muted-kicker">结构</p>
            <CardTitle className="text-base">资产占比</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <div className="space-y-2">
          <p className="muted-kicker">结构</p>
          <CardTitle className="text-base">资产占比</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'color-mix(in oklch, var(--popover) 96%, white 4%)',
                boxShadow: '0 16px 40px -28px color-mix(in oklch, var(--foreground) 24%, transparent)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {data.map((item, index) => {
            const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0

            return (
              <div key={item.name} className="rounded-md border border-border/60 bg-muted/20 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate text-sm font-medium">{item.name}</span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">占总资产的 {share.toFixed(1)}%</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(item.value)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
