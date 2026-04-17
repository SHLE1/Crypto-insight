'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, shortAddress } from '@/lib/validators'
import type { WalletInput, PortfolioSnapshot } from '@/types'

interface WalletSummaryProps {
  wallets: WalletInput[]
  snapshots: Record<string, PortfolioSnapshot>
}

export function WalletSummary({ wallets, snapshots }: WalletSummaryProps) {
  const displayWallets = wallets.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 pb-3">
        <CardTitle className="text-sm font-medium">钱包</CardTitle>
        <Link href="/wallets" className="text-xs text-primary hover:underline">
          查看全部
        </Link>
      </CardHeader>
      <CardContent>
        {displayWallets.length === 0 ? (
          <div className="py-6 text-center">
            <p className="mb-2 text-sm text-muted-foreground">尚未添加钱包</p>
            <Link
              href="/wallets/add"
              className="text-sm text-primary hover:underline"
            >
              添加第一个钱包 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {displayWallets.map((w) => {
              const snapshot = snapshots[w.id]
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-border/80 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {w.chainType.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {w.name || shortAddress(w.address)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shortAddress(w.address)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {snapshot
                      ? formatCurrency(snapshot.totalValue)
                      : '--'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
