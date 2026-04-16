'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HoldingsOverview } from '@/components/dashboard/holdings-overview'
import { usePortfolioData } from '@/hooks/use-portfolio-data'

export default function HoldingsPage() {
  const {
    holdingsData,
    isEmpty,
    hasSources,
    hasValuedAssets,
    isFetching,
    lastRefresh,
    refetch,
  } = usePortfolioData()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">资产明细</h1>
            <Badge variant="secondary">{holdingsData.length} 项</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            这里集中查看按代币、按钱包、按链聚合后的完整持仓。
          </p>
          {lastRefresh ? (
            <p className="text-xs text-muted-foreground">
              最近刷新：{new Date(lastRefresh).toLocaleString('zh-CN')}
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching || isEmpty}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新明细
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-medium mb-2">还没有可查看的资产明细</p>
          <p className="mb-6 text-muted-foreground">
            先添加钱包地址或绑定交易所账户，明细页会自动展示你的持仓结构。
          </p>
          <div className="flex gap-3">
            <Link href="/wallets/add">
              <Button>添加钱包</Button>
            </Link>
            <Link href="/cex">
              <Button variant="outline">绑定交易所</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {!isFetching && !hasValuedAssets && hasSources ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-sm text-muted-foreground">
                当前没有拿到可计价的资产数据。常见原因包括地址下没有原生币、交易所 API 权限不足，或第三方报价暂时不可用。
              </CardContent>
            </Card>
          ) : null}

          <HoldingsOverview data={holdingsData} />
        </>
      )}
    </div>
  )
}
