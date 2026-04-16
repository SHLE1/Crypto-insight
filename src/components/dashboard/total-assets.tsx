'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/validators'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TotalAssetsProps {
  totalValue: number
  change24hValue: number
  change24hPercent: number
  lastRefresh: string | null
  isStale?: boolean
}

export function TotalAssets({
  totalValue,
  change24hValue,
  change24hPercent,
  lastRefresh,
  isStale = false,
}: TotalAssetsProps) {
  const isPositive = change24hPercent >= 0

  return (
    <Card className="col-span-full">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-1">总资产</p>
        <p className="text-4xl font-bold tracking-tight">
          {formatCurrency(totalValue)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={isPositive ? 'text-green-500' : 'text-red-500'}
          >
            {formatCurrency(Math.abs(change24hValue))}{' '}
            ({formatPercent(change24hPercent)})
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>
        {lastRefresh && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">
              最近刷新: {new Date(lastRefresh).toLocaleString('zh-CN')}
            </p>
            {isStale ? (
              <p className="text-xs text-amber-500">
                当前显示的是本地缓存资产；如需最新结果，请手动点击“刷新”。
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
