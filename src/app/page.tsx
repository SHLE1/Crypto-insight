'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'
import { TotalAssets } from '@/components/dashboard/total-assets'
import { NetWorthTrend } from '@/components/dashboard/net-worth-trend'
import { AssetDistribution } from '@/components/dashboard/asset-distribution'
import { SourceDistribution } from '@/components/dashboard/source-distribution'
import { WalletSummary } from '@/components/dashboard/wallet-summary'
import { CexSummary } from '@/components/dashboard/cex-summary'
import { AlertsPanel } from '@/components/dashboard/alerts'
import { DefiPlaceholder } from '@/components/dashboard/defi-placeholder'
import { usePortfolioData } from '@/hooks/use-portfolio-data'

export default function DashboardPage() {
  const {
    wallets,
    accounts,
    snapshots,
    history,
    errors,
    lastRefresh,
    totalValue,
    change24hValue,
    change24hPercent,
    assetData,
    walletTotal,
    cexTotal,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isUsingCachedData,
    refetch,
    isFetching,
  } = usePortfolioData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">总览</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching || isEmpty}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-medium mb-2">欢迎使用 Crypto Insight</p>
          <p className="text-muted-foreground mb-6">
            添加钱包地址或绑定交易所账户，开始追踪你的加密资产
          </p>
          <div className="flex gap-3">
            <a href="/wallets/add">
              <Button>添加钱包</Button>
            </a>
            <a href="/cex">
              <Button variant="outline">绑定交易所</Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TotalAssets
            totalValue={totalValue}
            change24hValue={change24hValue}
            change24hPercent={change24hPercent}
            lastRefresh={lastRefresh}
            isStale={isUsingCachedData}
          />
          <NetWorthTrend data={history} />
          {!isFetching && !hasValuedAssets && hasSources && (
            <Card className="col-span-full border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          )}
          <AssetDistribution data={assetData} />
          <SourceDistribution walletTotal={walletTotal} cexTotal={cexTotal} />
          <WalletSummary wallets={wallets} snapshots={snapshots} />
          <CexSummary accounts={accounts} snapshots={snapshots} />
          <AlertsPanel errors={errors} />
          <DefiPlaceholder />
        </div>
      )}
    </div>
  )
}
