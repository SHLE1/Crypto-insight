'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/validators'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

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
    <Card className="col-span-full overflow-hidden">
      <CardContent className="relative pt-8 pb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground tracking-wide">总资产</p>
          <p className="mt-2 text-5xl font-bold tracking-tighter">
            {formatCurrency(totalValue)}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {formatPercent(change24hPercent)}
            </span>
            <span className="text-sm text-muted-foreground">
              {isPositive ? '+' : ''}{formatCurrency(Math.abs(change24hValue))} · 24h
            </span>
          </div>
          {lastRefresh && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <Clock className="h-3 w-3" />
              <span>最近刷新 {new Date(lastRefresh).toLocaleString('zh-CN')}</span>
              {isStale ? (
                <span className="ml-2 text-amber-500">
                  · 当前为本地缓存，请手动刷新获取最新数据
                </span>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
