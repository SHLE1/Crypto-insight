'use client'

import { Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/validators'

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
    <Card className="col-span-full md:col-span-2">
      <CardContent className="px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="muted-kicker">Net worth</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
              {formatCurrency(totalValue)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={isPositive
                  ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400'
                  : 'inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-sm font-medium text-red-500 dark:text-red-400'}
              >
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatPercent(change24hPercent)}
              </span>
              <span className="text-sm text-muted-foreground">
                {isPositive ? '+' : '-'}{formatCurrency(Math.abs(change24hValue))} · 24h
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[260px] lg:grid-cols-1">
            <div className="metric-tile">
              <p className="muted-kicker">数据状态</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isStale ? '使用本地缓存' : '已同步最新结果'}
              </p>
            </div>
            <div className="metric-tile">
              <p className="muted-kicker">最近刷新</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '暂无'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
