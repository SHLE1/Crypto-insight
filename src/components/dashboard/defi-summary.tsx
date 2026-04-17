'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDefiChainLabel } from '@/lib/defi/chains'
import { formatCurrency } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { Coins, DatabaseZap, RefreshCw, Settings2, ShieldAlert, Waves } from 'lucide-react'
import type { ApiErrorState } from '@/types'

interface DefiSummaryProps {
  isEnabled: boolean
  hasDefiSources: boolean
  hasPositions: boolean
  isFetching: boolean
  isInitialLoading: boolean
  isUsingCachedData: boolean
  isSweepRefreshing: boolean
  lastRefresh: string | null
  totalValue: number
  totalDepositedValue: number
  totalBorrowedValue: number
  totalRewardsValue: number
  positionCount: number
  walletCount: number
  completedCount: number
  expectedCount: number
  pendingChains: string[]
  protocolData: Array<{
    protocolId: string
    protocolName: string
    chainKey: string
    category?: string
    value: number
    positionCount: number
  }>
  chainData: Array<{ name: string; value: number }>
  errors: ApiErrorState[]
  refetch: () => void
}

function MetricTile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-2 text-base font-semibold tracking-tight',
          tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'negative' && 'text-red-500 dark:text-red-400'
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function DefiSummary({
  isEnabled,
  hasDefiSources,
  hasPositions,
  isFetching,
  isInitialLoading,
  isUsingCachedData,
  isSweepRefreshing,
  lastRefresh,
  totalValue,
  totalDepositedValue,
  totalBorrowedValue,
  totalRewardsValue,
  positionCount,
  walletCount,
  completedCount,
  expectedCount,
  pendingChains,
  protocolData,
  chainData,
  errors,
  refetch,
}: DefiSummaryProps) {
  const primaryError = errors[0]
  const hasRecoverableWarning = Boolean(
    primaryError && (
      primaryError.message.includes('额度或速率受限') ||
      primaryError.message.includes('服务暂时不可用') ||
      primaryError.message.includes('请求失败（HTTP 5')
    )
  )

  if (!isEnabled) {
    return (
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="outline">已关闭</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>当前已关闭 DeFi 统计。开启后会查询 EVM 与 Solana 钱包中的协议仓位，并以较低频率自动刷新。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-3.5 w-3.5" />
                去设置开启
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasDefiSources) {
    return (
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="outline">待添加来源</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>当前没有可查询 DeFi 的钱包来源。请先添加 EVM 或 Solana 钱包地址。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/wallets/add">
              <Button variant="outline" size="sm">添加钱包</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isInitialLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="secondary">载入中</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
          <div className="h-32 animate-pulse rounded-2xl bg-muted/30" />
        </CardContent>
      </Card>
    )
  }

  if (!hasPositions) {
    return (
      <Card className={primaryError ? 'border-destructive/30' : undefined}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            DeFi 仓位
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={primaryError ? (hasRecoverableWarning ? 'outline' : 'destructive') : 'outline'}>
              {primaryError ? (hasRecoverableWarning ? '轮转补齐中' : '查询异常') : '暂无仓位'}
            </Badge>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">补齐进度</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  已完成 {completedCount} / {expectedCount} 条链路
                </p>
              </div>
              <Badge variant={isSweepRefreshing ? 'outline' : 'secondary'}>
                {isSweepRefreshing ? '继续补齐中' : '已补齐'}
              </Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: expectedCount > 0 ? `${Math.min(100, (completedCount / expectedCount) * 100)}%` : '0%' }}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {pendingChains.length > 0
                ? `待补齐：${pendingChains.join('、')}`
                : '当前已完成全部已启用 DeFi 链路的查询。'}
            </p>
          </div>
          {primaryError ? (
            <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                {primaryError.message}
              </p>
              {primaryError.detail ? <p className="mt-2 text-xs leading-6">{primaryError.detail}</p> : null}
            </div>
          ) : (
            <p>
              {isSweepRefreshing
                ? `系统仍在补齐 DeFi 链路，当前已检查 ${walletCount} 个钱包，暂时还没拿到可计价仓位。`
                : `已检查 ${walletCount} 个钱包，暂未发现可计价的 DeFi 仓位。`}
            </p>
          )}
          <p className="text-xs">DeFi 统计不会并入顶部总资产，避免与钱包余额重复计算。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/80">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4" />
            DeFi 仓位
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            共覆盖 {walletCount} 个钱包 · {positionCount} 个仓位
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSweepRefreshing ? 'outline' : isUsingCachedData ? 'outline' : 'secondary'}>
            {isSweepRefreshing ? '轮转刷新中' : isUsingCachedData ? '使用缓存' : '已启用'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="DeFi 净值" value={formatCurrency(totalValue)} tone="positive" />
          <MetricTile label="总存入" value={formatCurrency(totalDepositedValue)} />
          <MetricTile label="总借出" value={formatCurrency(totalBorrowedValue)} tone={totalBorrowedValue > 0 ? 'negative' : 'default'} />
          <MetricTile label="待领取奖励" value={formatCurrency(totalRewardsValue)} tone={totalRewardsValue > 0 ? 'positive' : 'default'} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <DatabaseZap className="h-3.5 w-3.5" />
              协议分布
            </div>
            <div className="space-y-2">
              {protocolData.slice(0, 5).map((protocol) => (
                <div key={`${protocol.chainKey}:${protocol.protocolId}`} className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{protocol.protocolName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDefiChainLabel(protocol.chainKey)}
                        {protocol.category ? ` · ${protocol.category}` : ''}
                        {protocol.positionCount > 0 ? ` · ${protocol.positionCount} 个仓位` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium">{formatCurrency(protocol.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Waves className="h-3.5 w-3.5" />
              链分布
            </div>
            <div className="space-y-2">
              {chainData.length > 0 ? (
                chainData.slice(0, 6).map((chain) => (
                  <div key={chain.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatDefiChainLabel(chain.name)}</Badge>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(chain.value)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂无链分布数据</p>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
              <p>DeFi 统计暂未并入顶部总资产，避免与钱包余额重复计算。</p>
              <p>最近刷新：{lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '暂无'}。</p>
              <p>为兼顾免费额度与成功率，DeFi 会按钱包逐个轮转刷新；遇到限速或 5xx 时，会继续刷下一个来源并在后续逐步补齐。</p>
            </div>
          </div>
        </div>

        {primaryError ? (
          <div className={cn(
            'rounded-2xl p-4 text-sm',
            hasRecoverableWarning
              ? 'border border-border/70 bg-muted/20 text-muted-foreground'
              : 'border border-amber-500/20 bg-amber-500/5 text-muted-foreground'
          )}>
            <p className="font-medium text-foreground">
              {hasRecoverableWarning ? '部分链路暂时受限，系统会继续轮转补齐' : '本轮 DeFi 数据存在提醒'}
            </p>
            <p className="mt-1 leading-6">{primaryError.message}</p>
            <p className="mt-1 text-xs leading-6">
              {hasRecoverableWarning
                ? '当前不会一直重复刷新同一个钱包；后续会自动跳到下一个来源，并在下一轮再回来重试。'
                : primaryError.impact ?? '请稍后重试，或检查当前钱包是否有可识别的 DeFi 仓位。'}
            </p>
            {primaryError.detail ? <p className="mt-1 text-xs leading-6">{primaryError.detail}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
