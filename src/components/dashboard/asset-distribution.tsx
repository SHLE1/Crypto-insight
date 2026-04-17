'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/validators'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

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
      <CardHeader className="border-b border-border/50">
        <p className="section-label">Allocation</p>
        <CardTitle className="mt-2 text-base">资产分布</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 pt-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div className="surface-subtle rounded-[1.5rem] px-2 py-4">
          <ResponsiveContainer width="100%" height={248}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="transparent"
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '1rem',
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  boxShadow: 'var(--shadow-lg)',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => {
            const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0

            return (
              <div key={item.name} className="surface-subtle rounded-[1.2rem] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate text-sm font-medium tracking-[-0.03em]">{item.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">占总资产 {share.toFixed(1)}%</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tracking-[-0.03em]">{formatCurrency(item.value)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
