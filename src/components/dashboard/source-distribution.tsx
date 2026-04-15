'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SourceDistributionProps {
  walletTotal: number
  cexTotal: number
}

export function SourceDistribution({ walletTotal, cexTotal }: SourceDistributionProps) {
  const data = [
    { name: '链上钱包', value: walletTotal },
    { name: '交易所', value: cexTotal },
  ]

  const total = walletTotal + cexTotal

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">来源分布</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">来源分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              <Cell fill="hsl(220, 70%, 55%)" />
              <Cell fill="hsl(160, 60%, 45%)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>链上: {((walletTotal / total) * 100).toFixed(1)}%</span>
          <span>CEX: {((cexTotal / total) * 100).toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
