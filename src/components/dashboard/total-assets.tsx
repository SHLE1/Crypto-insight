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
    <Card className="col-span-full overflow-hidden md:col-span-2 xl:col-span-1">
      <CardContent className="relative px-6 py-7 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-0 subtle-grid opacity-45" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--primary)_32%,transparent),transparent)]" />

        <div className="relative flex h-full flex-col justify-between gap-8">
          <div>
            <p className="section-label">Net worth</p>
            <p className="mt-4 text-[clamp(2.6rem,2.2rem+1.8vw,4.8rem)] font-semibold tracking-[-0.08em] text-foreground">
              {formatCurrency(totalValue)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={isPositive ? 'metric-chip metric-chip--positive' : 'metric-chip metric-chip--negative'}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatPercent(change24hPercent)}
              </span>
              <span className="text-sm text-muted-foreground">
                {isPositive ? '+' : '-'}{formatCurrency(Math.abs(change24hValue))} · 24h
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-subtle rounded-[1.2rem] px-4 py-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">状态</p>
              <p className="mt-2 text-sm font-medium tracking-[-0.03em] text-foreground">
                {isStale ? '展示本地缓存' : '已同步最新结果'}
              </p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {isStale ? '请手动刷新以重新拉取链上与交易所数据。' : '当前界面正在使用最近一次成功刷新的数据。'}
              </p>
            </div>

            <div className="surface-subtle rounded-[1.2rem] px-4 py-4">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">刷新时间</p>
              {lastRefresh ? (
                <>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium tracking-[-0.03em] text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(lastRefresh).toLocaleString('zh-CN')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">以本地时区展示最近一次更新时间。</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">等待第一次成功刷新。</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
