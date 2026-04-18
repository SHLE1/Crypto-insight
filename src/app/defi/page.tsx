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
        title="单独观察协议仓位、借贷与奖励变化。"
        description="聚焦 EVM 与 Solana 钱包里的协议层持仓，判断 DeFi 净值、补齐进度与异常链路。"
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
          description="开启后会单独查询 EVM 与 Solana 钱包中的协议仓位，并以较低频率自动刷新。"
          action={
            <Link href="/settings">
              <Button className="gap-2">
                <SlidersHorizontal size={16} weight="regular" />
                去设置开启
              </Button>
            </Link>
          }
        />
      ) : !hasDefiSources ? (
        <EmptyState
          title="还没有可查询 DeFi 的钱包来源"
          description="先添加 EVM 或 Solana 钱包地址，DeFi 页面会自动统计协议仓位与奖励。"
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

          <div className="rounded-[1.35rem] border border-border/75 bg-muted/16 p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Coins size={16} weight="regular" />
              <span className="font-medium tracking-[-0.02em]">当前接入说明</span>
            </div>
            <ul className="mt-3 space-y-2 leading-7">
              <li>DeFi 统计当前作为独立页面展示，但当前版本也会直接计入总资产与总览分布。</li>
              <li>默认优先使用 Mobula；当 Mobula 对某条链未识别出仓位时，会尝试用 DeBank 公共页面做兜底补全。</li>
              <li>当数据源出现速率限制或短时异常时，系统会逐个钱包轮转刷新，而不是一直重复刷同一个钱包。</li>
              <li>即使本轮未拿全，也会逐渐补齐全部钱包的 DeFi 数据。</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
