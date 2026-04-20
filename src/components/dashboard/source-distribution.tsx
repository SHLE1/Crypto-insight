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
          <div className="space-y-2">
            <p className="muted-kicker">来源</p>
            <CardTitle className="text-base">资产来源</CardTitle>
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
          <p className="muted-kicker">来源</p>
          <CardTitle className="text-base">资产来源</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="h-3 overflow-hidden rounded-full bg-muted/70">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--chart-1)_0%,var(--chart-1)_var(--wallet-share),var(--chart-2)_var(--wallet-share),var(--chart-2)_100%)]"
            style={{ ['--wallet-share' as string]: `${(walletTotal / total) * 100}%` }}
          />
        </div>
        <div className="space-y-3">
          {data.map((item, index) => {
            const share = total > 0 ? (item.value / total) * 100 : 0

            return (
              <div key={item.name} className="rounded-md border border-border/60 bg-muted/20 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: index === 0 ? 'var(--chart-1)' : 'var(--chart-2)' }}
                    />
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <Badge variant="secondary">{share.toFixed(1)}%</Badge>
                </div>
                <p className="mt-2 text-sm font-medium tabular-nums">{formatCurrency(item.value)}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
