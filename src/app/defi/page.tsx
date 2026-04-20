'use client'

import Link from 'next/link'
import { ArrowsClockwise, Coins, SlidersHorizontal, Wallet } from '@phosphor-icons/react'
import { DefiSummary } from '@/components/dashboard/defi-summary'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDefiData } from '@/hooks/use-defi-data'

export default function DefiPage() {
  const {
    errors,
    lastRefresh,
    totalValue,
    totalDepositedValue,
    totalBorrowedValue,
    totalRewardsValue,
    protocolData,
    chainData,
    positionCount,
    walletCount,
    completedCount,
    expectedCount,
    pendingChains,
    isEnabled,
    hasDefiSources,
    hasPositions,
    isFetching,
    isInitialLoading,
    isUsingCachedData,
    isSweepRefreshing,
    refetch,
  } = useDefiData()

  return (
    <div className="space-y-6">
      <PageHeader
        badge="DeFi"
        title="DeFi 仓位"
        description="汇总 EVM 和 Solana 钱包的协议仓位，跟踪净值构成与当前刷新状态。"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || (!hasDefiSources && isEnabled)} className="gap-2">
            <ArrowsClockwise size={14} weight="regular" className={isFetching ? 'animate-spin' : ''} />
            全量刷新 DeFi
          </Button>
        }
      />

      {!isEnabled ? (
        <EmptyState
          title="DeFi 统计已关闭"
          description="开启后将查询 EVM 和 Solana 钱包的协议仓位，以较低频率自动刷新。"
          action={
            <Link href="/settings">
              <Button className="gap-2">
                <SlidersHorizontal size={16} weight="regular" />
                去设置页开启
              </Button>
            </Link>
          }
        />
      ) : !hasDefiSources ? (
        <EmptyState
          title="暂无可查询 DeFi 的钱包"
          description="添加 EVM 或 Solana 钱包地址后，协议仓位与奖励数据将在此自动展示。"
          action={
            <Link href="/wallets/add">
              <Button className="gap-2">
                <Wallet size={16} weight="regular" />
                添加钱包
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <DefiSummary
            isEnabled={isEnabled}
            hasDefiSources={hasDefiSources}
            hasPositions={hasPositions}
            isFetching={isFetching}
            isInitialLoading={isInitialLoading}
            isUsingCachedData={isUsingCachedData}
            isSweepRefreshing={isSweepRefreshing}
            lastRefresh={lastRefresh}
            totalValue={totalValue}
            totalDepositedValue={totalDepositedValue}
            totalBorrowedValue={totalBorrowedValue}
            totalRewardsValue={totalRewardsValue}
            positionCount={positionCount}
            walletCount={walletCount}
            completedCount={completedCount}
            expectedCount={expectedCount}
            pendingChains={pendingChains}
            protocolData={protocolData}
            chainData={chainData}
            errors={errors}
            refetch={() => refetch()}
          />

          <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Coins size={16} weight="regular" />
              <span className="font-medium tracking-[-0.02em]">数据说明</span>
            </div>
            <ul className="mt-3 space-y-2 leading-7">
              <li>DeFi 净值同步计入总资产，并在总览分布中单独展示。</li>
              <li>优先使用 Zapper；若识别失败，EVM 链路将依次尝试 Moralis 与 DeBank 公共页面补全数据。</li>
              <li>遇到限速或短暂异常时，系统将按钱包轮转刷新，避免阻塞在单一钱包上。</li>
              <li>若本轮未能覆盖全部钱包，系统将在后续轮次逐步补全。</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
