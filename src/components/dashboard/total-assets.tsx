'use client'

import { ArrowDown, ArrowUp, ClockClockwise } from '@phosphor-icons/react'
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
    <Card className="col-span-full xl:col-span-2">
      <CardContent className="px-5 py-5 md:px-6 md:py-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="muted-kicker">净资产</p>
              <p className="max-w-[12ch] text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-[3.5rem]">
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={isPositive
                  ? 'inline-flex items-center gap-1.5 rounded-md border border-emerald-500/12 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400'
                  : 'inline-flex items-center gap-1.5 rounded-md border border-red-500/12 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400'}
              >
                {isPositive ? <ArrowUp size={14} weight="bold" /> : <ArrowDown size={14} weight="bold" />}
                {formatPercent(change24hPercent)}
              </span>
              <span className="text-sm text-muted-foreground">
                {isPositive ? '+' : '-'}{formatCurrency(Math.abs(change24hValue))} · 24h
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="metric-tile">
              <p className="muted-kicker">数据状态</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isStale ? '正在显示本地缓存' : '已同步最新结果'}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {isStale ? '当前页面显示的是最近一次可用快照。' : '这一轮刷新已经完成主要来源的同步。'}
              </p>
            </div>
            <div className="metric-tile">
              <p className="muted-kicker">最近刷新</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <ClockClockwise size={14} weight="regular" className="text-muted-foreground" />
                {lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '暂无'}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">添加或修改来源后，建议手动刷新一次。</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
