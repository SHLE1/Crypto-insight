'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Buildings, Wallet } from '@phosphor-icons/react'
import {
  DashboardOverview,
  DashboardOverviewLoadingState,
} from '@/components/dashboard/dashboard-overview'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { usePortfolioData } from '@/hooks/use-portfolio-data'
import { shortAddress } from '@/lib/validators'

export default function DashboardPage() {
  const {
    wallets,
    accounts,
    snapshots,
    history,
    errors,
    lastRefresh,
    totalValue,
    change24hPercent,
    assetData,
    analytics,
    defiTotalValue,
    defiTotalDepositedValue,
    defiTotalBorrowedValue,
    defiTotalRewardsValue,
    defiProtocolData,
    defiChainData,
    defiPositionCount,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isUsingCachedData,
    isRestoring,
    isInitialLoading,
    refetch,
    isFetching,
  } = usePortfolioData()

  /** Per-source breakdown for the source split pie chart */
  const sourceSplit = useMemo(() => {
    return Object.entries(snapshots)
      .filter(([, snap]) => snap.totalValue > 0 && snap.status !== 'error')
      .map(([id, snap]) => {
        const label =
          snap.sourceType === 'wallet'
            ? (wallets.find(w => w.id === id)?.name ?? shortAddress(id))
            : (accounts.find(a => a.id === id)?.label ?? id.toUpperCase())
        return { id, label, sourceType: snap.sourceType as 'wallet' | 'cex', value: snap.totalValue }
      })
      .sort((a, b) => b.value - a.value)
  }, [snapshots, wallets, accounts])

  return (
    <div className="flex flex-col gap-6">
      {isRestoring || isInitialLoading ? (
        <DashboardOverviewLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="尚未添加资产来源"
          description="添加钱包或交易所账户后，总资产、持仓分布和净值趋势将在此自动展示。"
          action={
            <>
              <Link href="/wallets/add">
                <Button className="gap-2">
                  <Wallet size={16} weight="regular" />
                  添加钱包
                </Button>
              </Link>
              <Link href="/cex">
                <Button variant="outline" className="gap-2">
                  <Buildings size={16} weight="regular" />
                  添加交易所账户
                </Button>
              </Link>
            </>
          }
        />
      ) : (
        <>
          {!isFetching && !hasValuedAssets && hasSources ? (
            <div className="rounded-xl border border-dashed border-border/50 py-8">
              <p className="text-sm text-muted-foreground text-center leading-7">
                暂无可估值的资产。可能原因：地址余额为零、交易所 API 权限不足、DeFi 数据尚在加载，或第三方报价暂时不可用。
              </p>
            </div>
          ) : null}

          <DashboardOverview
            history={history}
            errors={errors}
            lastRefresh={lastRefresh}
            totalValue={totalValue}
            change24hPercent={change24hPercent}
            assetData={assetData}
            analytics={analytics}
            sourceSplit={sourceSplit}
            isUsingCachedData={isUsingCachedData}
            isFetching={isFetching}
            walletCount={wallets.filter((wallet) => wallet.enabled).length}
            accountCount={accounts.filter((account) => account.enabled).length}
            defiTotalValue={defiTotalValue}
            defiTotalDepositedValue={defiTotalDepositedValue}
            defiTotalBorrowedValue={defiTotalBorrowedValue}
            defiTotalRewardsValue={defiTotalRewardsValue}
            defiProtocolData={defiProtocolData}
            defiChainData={defiChainData}
            defiPositionCount={defiPositionCount}
            onRefresh={() => refetch()}
          />
        </>
      )}
    </div>
  )
}
