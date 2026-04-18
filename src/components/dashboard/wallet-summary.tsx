'use client'

import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
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
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/75 pb-4">
        <div className="space-y-2">
          <p className="muted-kicker">来源</p>
          <CardTitle className="text-base">钱包</CardTitle>
        </div>
        <Link href="/wallets" className="inline-flex items-center gap-1 text-xs text-primary hover:gap-1.5">
          查看全部
          <CaretRight size={12} weight="bold" />
        </Link>
      </CardHeader>
      <CardContent>
        {displayWallets.length === 0 ? (
          <div className="py-7 text-center">
            <p className="mb-2 text-sm text-muted-foreground">尚未添加钱包</p>
            <Link href="/wallets/add" className="inline-flex items-center gap-1 text-sm text-primary hover:gap-1.5">
              添加第一个钱包
              <CaretRight size={12} weight="bold" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayWallets.map((w) => {
              const snapshot = snapshots[w.id]
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-[1rem] border border-border/75 bg-background/70 p-3.5 hover:bg-muted/18"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {w.chainType.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{w.name || shortAddress(w.address)}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{shortAddress(w.address)}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
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
