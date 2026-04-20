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
        title="单独查看 DeFi 仓位和补齐进度。"
        description="聚焦 EVM 和 Solana 钱包里的协议仓位，快速判断当前 DeFi 净值、刷新进度和异常情况。"
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
          description="开启后会查询 EVM 和 Solana 钱包里的协议仓位，并按较低频率自动刷新。"
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
          title="还没有可查询 DeFi 的钱包"
          description="先添加 EVM 或 Solana 钱包地址，这里才会开始统计协议仓位和奖励。"
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
              <span className="font-medium tracking-[-0.02em]">当前说明</span>
            </div>
            <ul className="mt-3 space-y-2 leading-7">
              <li>当前版本里，DeFi 净值会同时显示在这个页面，也会直接计入总资产和总览分布。</li>
              <li>默认优先使用 Zapper；如果主数据源没识别到仓位或查询失败，EVM 链路会继续尝试 Moralis，必要时再用 DeBank 公共页面补齐。</li>
              <li>如果遇到限速或短时异常，系统会按钱包轮流刷新，而不是反复卡在同一个钱包上。</li>
              <li>即使这一轮没拿全，系统也会在后续逐步补齐全部钱包的 DeFi 数据。</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
