'use client'

import Link from 'next/link'
import { RefreshCw, Coins, Settings, Wallet } from 'lucide-react'
import { DefiSummary } from '@/components/dashboard/defi-summary'
import { ManualDefiSources } from '@/components/dashboard/manual-defi-sources'
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
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">DeFi 仓位</h2>
          <p className="text-sm text-muted-foreground">
            汇总 EVM 和 Solana 钱包的协议仓位，跟踪净值构成与当前刷新状态。
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching || (!hasDefiSources && isEnabled)} className="gap-2">
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          全量刷新
        </Button>
      </div>

      {!isEnabled ? (
        <EmptyState
          title="DeFi 统计已关闭"
          description="开启后将查询 EVM 和 Solana 钱包的协议仓位，以较低频率自动刷新。"
          action={
            <Link href="/settings">
              <Button className="gap-2">
                <Settings className="size-4" />
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
                <Wallet className="size-4" />
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

          <ManualDefiSources isFetching={isFetching} onRefresh={() => refetch()} />

          <div className="border-y sm:border sm:rounded-xl border-border/40 p-4 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
              <Coins className="size-4" />
              数据说明
            </h3>
            <ul className="list-disc pl-4 flex flex-col gap-1 text-xs text-muted-foreground leading-relaxed">
              <li>DeFi 净值同步计入总资产，并在总览分布中单独展示。</li>
              <li>EVM 优先使用 Zerion；若识别失败，会回退到 Zapper 与 Moralis。Solana 继续使用 Zapper。</li>
              <li>遇到限速或短暂异常时，系统将按钱包轮转刷新，避免阻塞在单一钱包上。</li>
              <li>若本轮未能覆盖全部钱包，系统将在后续轮次逐步补全。</li>
              <li>手动补充会直接读取链上代币余额；若没有可用市场价格，只显示数量，不会凭空计入估值。</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
