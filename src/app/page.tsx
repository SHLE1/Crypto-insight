'use client'

import Link from 'next/link'
import { Buildings, Wallet } from '@phosphor-icons/react'
import {
  DashboardOverview,
  DashboardOverviewLoadingState,
} from '@/components/dashboard/dashboard-overview'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePortfolioData } from '@/hooks/use-portfolio-data'

export default function DashboardPage() {
  const {
    wallets,
    accounts,
    history,
    errors,
    lastRefresh,
    totalValue,
    change24hValue,
    change24hPercent,
    assetData,
    walletTotal,
    cexTotal,
    analytics,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isUsingCachedData,
    isRestoring,
    isInitialLoading,
    refetch,
    isFetching,
  } = usePortfolioData()

  return (
    <div className="space-y-6">
      {isRestoring || isInitialLoading ? (
        <DashboardOverviewLoadingState />
      ) : isEmpty ? (
        <EmptyState
          title="还没有资产来源"
          description="添加钱包地址或交易所账户后，这里会自动显示总资产、分布和趋势。"
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
            <Card className="border-dashed">
              <CardContent className="py-6 text-sm leading-7 text-muted-foreground">
                现在还拿不到可计价的资产。常见原因包括：地址里没有资产、交易所 API 权限不足、DeFi 数据还在补齐，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          ) : null}

          <DashboardOverview
            history={history}
            errors={errors}
            lastRefresh={lastRefresh}
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            assetData={assetData}
            walletTotal={walletTotal}
            cexTotal={cexTotal}
            analytics={analytics}
            isUsingCachedData={isUsingCachedData}
            isFetching={isFetching}
            walletCount={wallets.filter((wallet) => wallet.enabled).length}
            accountCount={accounts.filter((account) => account.enabled).length}
            onRefresh={() => refetch()}
          />
        </>
      )}
    </div>
  )
}

