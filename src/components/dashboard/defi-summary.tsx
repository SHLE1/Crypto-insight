'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDefiChainLabel } from '@/lib/defi/chains'
import { formatCurrency } from '@/lib/validators'
import { cn } from '@/lib/utils'
import {
  ArrowsClockwise,
  Coins,
  Database,
  ShieldWarning,
  SlidersHorizontal,
  Waves,
} from '@phosphor-icons/react'
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
    <div className="rounded-md border border-border/60 bg-muted/20 p-3.5">
      <p className="text-xs tracking-[0.08em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-2 text-base font-semibold tracking-[-0.03em]',
          tone === 'positive' && 'text-emerald-700 dark:text-emerald-400',
          tone === 'negative' && 'text-red-600 dark:text-red-400'
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
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="outline">已关闭</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>DeFi 统计当前已关闭。开启后会查询 EVM 和 Solana 钱包里的协议仓位，并按较低频率自动刷新。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal size={14} weight="regular" />
                去设置页开启
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
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="outline">待添加来源</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>现在还没有可查询 DeFi 的钱包。请先添加 EVM 或 Solana 钱包地址。</p>
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
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </CardTitle>
          <Badge variant="secondary">载入中</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="panel-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-md bg-muted/40" />
            ))}
          </div>
          <div className="h-32 animate-pulse rounded-md bg-muted/30" />
        </CardContent>
      </Card>
    )
  }

  if (!hasPositions) {
    return (
      <Card className={primaryError ? 'border-destructive/25' : undefined}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={primaryError ? (hasRecoverableWarning ? 'outline' : 'destructive') : 'outline'}>
              {primaryError ? (hasRecoverableWarning ? '正在补齐' : '查询失败') : '还没有仓位'}
            </Badge>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
              <ArrowsClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
              全量刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">补齐进度</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  已完成 {completedCount} / {expectedCount} 条查询链路
                </p>
              </div>
              <Badge variant={isSweepRefreshing ? 'outline' : 'secondary'}>
                {isSweepRefreshing ? '继续补齐中' : '本轮已完成'}
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
            <div className="rounded-md border border-destructive/12 bg-destructive/6 p-4">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ShieldWarning size={16} weight="fill" className="text-destructive" />
                {primaryError.message}
              </p>
              {primaryError.detail ? <p className="mt-2 text-xs leading-6">{primaryError.detail}</p> : null}
            </div>
          ) : (
            <p>
              {isSweepRefreshing
                ? `系统还在补齐 DeFi 数据。当前已检查 ${walletCount} 个钱包，但暂时还没拿到可计价仓位。`
                : `已检查 ${walletCount} 个钱包，暂时还没有发现可计价的 DeFi 仓位。`}
            </p>
          )}
          <p className="text-xs">当前版本会把 DeFi 净值直接计入顶部总资产，因此可能和钱包余额有重复计算。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </CardTitle>
          <p className="text-xs leading-6 text-muted-foreground">
            当前覆盖 {walletCount} 个钱包 · {positionCount} 个仓位
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSweepRefreshing ? 'outline' : isUsingCachedData ? 'outline' : 'secondary'}>
            {isSweepRefreshing ? '刷新中' : isUsingCachedData ? '显示缓存' : '已更新'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
            <ArrowsClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
            全量刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="panel-grid">
          <MetricTile label="DeFi 净值" value={formatCurrency(totalValue)} tone="positive" />
          <MetricTile label="总存入" value={formatCurrency(totalDepositedValue)} />
          <MetricTile label="总借出" value={formatCurrency(totalBorrowedValue)} tone={totalBorrowedValue > 0 ? 'negative' : 'default'} />
          <MetricTile label="待领取奖励" value={formatCurrency(totalRewardsValue)} tone={totalRewardsValue > 0 ? 'positive' : 'default'} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-md border border-border/60 bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground">
              <Database size={14} weight="regular" />
              协议分布
            </div>
            <div className="space-y-2">
              {protocolData.slice(0, 5).map((protocol) => (
                <div key={`${protocol.chainKey}:${protocol.protocolId}`} className="rounded-[1rem] border border-border/60 bg-background/82 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{protocol.protocolName}</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {formatDefiChainLabel(protocol.chainKey)}
                        {protocol.category ? ` · ${protocol.category}` : ''}
                        {protocol.positionCount > 0 ? ` · ${protocol.positionCount} 个仓位` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(protocol.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground">
              <Waves size={14} weight="regular" />
              链分布
            </div>
            <div className="space-y-2">
              {chainData.length > 0 ? (
                chainData.slice(0, 6).map((chain) => (
                  <div key={chain.name} className="flex items-center justify-between rounded-[1rem] border border-border/60 bg-background/82 px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{formatDefiChainLabel(chain.name)}</Badge>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatCurrency(chain.value)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂无链分布数据</p>
              )}
            </div>
            <div className="mt-4 rounded-[1rem] border border-border/60 bg-muted/30 p-3 text-xs leading-6 text-muted-foreground">
              <p>当前版本会把 DeFi 净值直接计入顶部总资产和来源分布，因此可能和钱包余额有重复计算。</p>
              <p>最近刷新：{lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '暂无'}。</p>
              <p>为了兼顾免费额度和成功率，DeFi 会按钱包轮流刷新；遇到限速或 5xx 时，会先继续刷下一个来源，再在后续逐步补齐。</p>
              <p>点击“全量刷新”后，系统会按当前钱包列表完整跑一轮，而不只是刷新当前轮到的单个钱包。</p>
              <p>当前优先使用 Zapper；如果主数据源没有识别到仓位或查询失败，EVM 链路会继续回退到 Moralis，必要时再用 DeBank 公共页面补齐。</p>
            </div>
          </div>
        </div>

        {primaryError ? (
          <div className={cn(
            'rounded-md p-4 text-sm',
            hasRecoverableWarning
              ? 'border border-border/60 bg-muted/30 text-muted-foreground'
              : 'border border-amber-500/18 bg-amber-500/6 text-muted-foreground'
          )}>
            <p className="font-medium text-foreground">
              {hasRecoverableWarning ? '部分链路暂时受限，系统会继续补齐' : '这一轮 DeFi 数据有提醒'}
            </p>
            <p className="mt-1 leading-6">{primaryError.message}</p>
            <p className="mt-1 text-xs leading-6">
              {hasRecoverableWarning
                ? '系统不会一直卡在同一个钱包上；后续会先刷新下一个来源，再在下一轮回来重试。'
                : primaryError.impact ?? '请稍后重试，或检查当前钱包里是否有可识别的 DeFi 仓位。'}
            </p>
            {primaryError.detail ? <p className="mt-1 text-xs leading-6">{primaryError.detail}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
