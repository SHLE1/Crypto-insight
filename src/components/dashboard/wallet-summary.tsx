'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, shortAddress } from '@/lib/validators'
import type { PortfolioSnapshot, WalletInput } from '@/types'

interface WalletSummaryProps {
  wallets: WalletInput[]
  snapshots: Record<string, PortfolioSnapshot>
}

export function WalletSummary({ wallets, snapshots }: WalletSummaryProps) {
  const displayWallets = wallets.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <p className="section-label">Wallets</p>
          <CardTitle className="mt-2 text-base">钱包</CardTitle>
        </div>
        <Link href="/wallets" className="text-xs text-primary hover:underline">
          查看全部
        </Link>
      </CardHeader>
      <CardContent>
        {displayWallets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">尚未添加钱包</p>
            <Link href="/wallets/add" className="mt-3 inline-block text-sm text-primary hover:underline">
              添加第一个钱包 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayWallets.map((w) => {
              const snapshot = snapshots[w.id]
              return (
                <div key={w.id} className="surface-subtle flex items-center justify-between gap-3 rounded-[1.2rem] p-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] tracking-[0.08em]">
                      {w.chainType.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tracking-[-0.03em]">
                        {w.name || shortAddress(w.address)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{shortAddress(w.address)}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium tracking-[-0.03em]">
                    {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
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
