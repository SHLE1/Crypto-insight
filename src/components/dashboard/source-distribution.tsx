'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/validators'

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
      <CardHeader className="border-b border-border/50">
        <p className="section-label">Sources</p>
        <CardTitle className="mt-2 text-base">来源分布</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="surface-subtle rounded-[1.3rem] p-4">
          <div className="h-3 overflow-hidden rounded-full bg-muted/90">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--chart-1)_0%,var(--chart-1)_var(--wallet-share),var(--chart-2)_var(--wallet-share),var(--chart-2)_100%)]"
              style={{ ['--wallet-share' as string]: `${(walletTotal / total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>链上</span>
            <span>交易所</span>
          </div>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => {
            const share = total > 0 ? (item.value / total) * 100 : 0

            return (
              <div key={item.name} className="surface-subtle rounded-[1.2rem] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: index === 0 ? 'var(--chart-1)' : 'var(--chart-2)' }}
                    />
                    <p className="text-sm font-medium tracking-[-0.03em]">{item.name}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">{share.toFixed(1)}%</Badge>
                </div>
                <p className="mt-2 text-sm font-medium tracking-[-0.03em]">{formatCurrency(item.value)}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
