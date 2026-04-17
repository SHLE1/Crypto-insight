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
          <CardTitle className="text-sm font-medium">资产分布</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/80">
        <CardTitle className="text-sm font-medium">资产分布</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={86}
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
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--popover)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {data.map((item, index) => {
            const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0

            return (
              <div key={item.name} className="rounded-xl border border-border/80 bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate text-sm font-medium">{item.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">占总资产 {share.toFixed(1)}%</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium">{formatCurrency(item.value)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
