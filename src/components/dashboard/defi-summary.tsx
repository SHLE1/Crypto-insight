'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDefiChainLabel } from '@/lib/defi/chains'
import { formatCurrency } from '@/lib/validators'
import { cn } from '@/lib/utils'
import {
  ArrowsClockwise,
  Coins,
  ShieldWarning,
  SlidersHorizontal,
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
  const primaryError = errors[errors.length - 1]
  const hasRecoverableWarning = Boolean(
    primaryError && (
      primaryError.message.includes('额度或速率受限') ||
      primaryError.message.includes('服务暂时不可用') ||
      primaryError.message.includes('请求失败（HTTP 5')
    )
  )

  if (!isEnabled) {
    return (
      <div className="border-y border-dashed border-border/40 py-8 px-4 sm:px-6 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </h3>
          <Badge variant="outline" className="text-[10px]">已关闭</Badge>
        </div>
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          <p>DeFi 统计当前已关闭。开启后会查询 EVM 和 Solana 钱包里的协议仓位，并按较低频率自动刷新。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <SlidersHorizontal size={14} weight="regular" />
                去设置页开启
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!hasDefiSources) {
    return (
      <div className="border-y border-dashed border-border/40 py-8 px-4 sm:px-6 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </h3>
          <Badge variant="outline" className="text-[10px]">待添加来源</Badge>
        </div>
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          <p>暂无可查询 DeFi 的钱包，请先添加 EVM 或 Solana 钱包地址。</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/wallets/add">
              <Button variant="outline" size="sm" className="h-8">添加钱包</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isInitialLoading) {
    return (
      <div className="mt-4 animate-pulse">
        <div className="flex flex-row items-center justify-between mb-6 px-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </h3>
          <Badge variant="secondary" className="text-[10px]">载入中</Badge>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded bg-muted/20" />
            ))}
          </div>
          <div className="h-32 rounded bg-muted/10 mx-2" />
        </div>
      </div>
    )
  }

  if (!hasPositions) {
    return (
      <div className={cn("py-8 mt-4 border-t border-border/40", primaryError ? 'border-border/60' : '')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground/80">
            <Coins size={16} weight="regular" />
            DeFi 仓位
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Badge className="px-2" variant={primaryError ? (hasRecoverableWarning ? 'outline' : 'secondary') : 'outline'}>
              {primaryError ? (hasRecoverableWarning ? '正在补齐' : '查询失败') : '暂无仓位'}
            </Badge>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2 h-8 w-full sm:w-auto">
              <ArrowsClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
              全量刷新
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="rounded-lg border border-border/30 bg-muted/10 p-5">
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
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <ShieldWarning size={16} weight="fill" className="text-foreground" />
                {primaryError.message}
              </p>
              {primaryError.detail ? <p className="mt-2 text-xs leading-6">{primaryError.detail}</p> : null}
            </div>
          ) : (
            <p>
              {isSweepRefreshing
                ? `系统还在补齐 DeFi 数据。当前已检查 ${walletCount} 个钱包，但暂时还没拿到可计价仓位。`
                : `已扫描 ${walletCount} 个钱包，暂未发现可计价的 DeFi 仓位。`}
            </p>
          )}
          <p className="text-xs pt-4">当前版本会把 DeFi 净值直接计入顶部总资产，因此可能和钱包余额有重复计算。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 border-t border-border/40 pt-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8 px-2 sm:px-0">
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground/90">
            <Coins size={18} weight="regular" />
            DeFi 仓位
          </h3>
          <p className="text-xs text-muted-foreground">
            当前覆盖 {walletCount} 个钱包 · {positionCount} 个仓位
          </p>
        </div>
        <div className="flex w-full items-center justify-between sm:w-auto gap-3">
          <Badge className="px-2" variant={isSweepRefreshing ? 'outline' : isUsingCachedData ? 'outline' : 'secondary'}>
            {isSweepRefreshing ? '刷新中' : isUsingCachedData ? '显示缓存' : '已更新'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2 h-8">
            <ArrowsClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
            全量刷新
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6 pt-0 px-0 sm:pb-6">
        <div className="flex flex-wrap gap-x-10 gap-y-5 border-b border-border/40 pb-5 mb-2">
          <div>
            <p className="muted-kicker">DeFi 净值</p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p className="muted-kicker">总存入</p>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(totalDepositedValue)}</p>
          </div>
          <div>
            <p className="muted-kicker">总借出</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${totalBorrowedValue > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{formatCurrency(totalBorrowedValue)}</p>
          </div>
          <div>
            <p className="muted-kicker">待领取奖励</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${totalRewardsValue > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{formatCurrency(totalRewardsValue)}</p>
          </div>
        </div>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] px-4 sm:px-0">
          <div className="border-y sm:border sm:rounded-xl border-border/40 p-4 sm:p-6 mb-8">
            <div className="mb-6 flex flex-row items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">协议分布</h4>
            </div>
            <div className="flex flex-col border-t border-border/40 divide-y divide-border/20">
              {protocolData.slice(0, 5).map((protocol) => (
                <div key={`${protocol.chainKey}:${protocol.protocolId}`} className="flex items-center justify-between py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-sm font-semibold tracking-tight">{protocol.protocolName}</p>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span>{formatDefiChainLabel(protocol.chainKey)}</span>
                      {protocol.category && (
                        <>
                          <span className="opacity-50">·</span>
                          <span>{protocol.category}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(protocol.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-y sm:border sm:rounded-xl border-border/40 p-4 sm:p-6 mb-8">
            <div className="mb-6 flex flex-row items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">链分布</h4>
            </div>
            <div className="flex flex-col border-t border-border/40 divide-y divide-border/20">
              {chainData.length > 0 ? (
                chainData.slice(0, 6).map((chain) => (
                  <div key={chain.name} className="flex items-center justify-between py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold tracking-tight">{formatDefiChainLabel(chain.name)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(chain.value)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无链分布数据</p>
              )}
            </div>
            <div className="mt-8 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground space-y-2">
              <p>当前优先使用 Zapper 作为数据源，若异常将回退至 Moralis 和 DeBank 公共接口。</p>
              <p>净值默认合并计入顶部总资产，请注意避免与原始代币产生视觉重复计价。</p>
              <p className="pt-2">最后更新: {lastRefresh ? new Date(lastRefresh).toLocaleString('zh-CN') : '暂无'}</p>
            </div>
          </div>
        </div>

        {primaryError ? (
          <div className={cn(
            'rounded-lg p-4 text-sm mx-4 sm:mx-0',
            hasRecoverableWarning
              ? 'border border-border/60 bg-muted/30 text-muted-foreground'
              : 'border border-border/60 bg-muted/30 text-muted-foreground'
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
      </div>
    </div>
  )
}
