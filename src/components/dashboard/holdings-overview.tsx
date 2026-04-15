'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/validators'

interface HoldingRow {
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  sourceCount: number
}

interface HoldingsOverviewProps {
  data: HoldingRow[]
}

export function HoldingsOverview({ data }: HoldingsOverviewProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">资产明细</CardTitle>
        <Badge variant="secondary">{data.length} 项</Badge>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有可展示的资产明细</p>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] gap-4 text-xs text-muted-foreground md:grid">
              <span>资产</span>
              <span className="text-right">持仓</span>
              <span className="text-right">单价</span>
              <span className="text-right">市值</span>
              <span className="text-right">24h</span>
            </div>
            {data.map((asset) => (
              <div
                key={asset.symbol}
                className="grid gap-2 rounded-lg border border-border/70 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{asset.symbol}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {asset.sourceCount} 来源
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                </div>
                <div className="flex items-center justify-between text-sm md:block md:text-right">
                  <span className="text-muted-foreground md:hidden">持仓</span>
                  <span>{asset.balance.toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm md:block md:text-right">
                  <span className="text-muted-foreground md:hidden">单价</span>
                  <span>{formatCurrency(asset.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm md:block md:text-right">
                  <span className="text-muted-foreground md:hidden">市值</span>
                  <span className="font-medium">{formatCurrency(asset.value)}</span>
                </div>
                <div className="flex items-center justify-between text-sm md:block md:text-right">
                  <span className="text-muted-foreground md:hidden">24h</span>
                  <span className={asset.change24h !== null && asset.change24h < 0 ? 'text-red-500' : 'text-green-500'}>
                    {formatPercent(asset.change24h)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
