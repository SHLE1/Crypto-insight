'use client'

import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getExchangeLabel } from '@/lib/validators'
import type { CexAccountInput, PortfolioSnapshot } from '@/types'

interface CexSummaryProps {
  accounts: CexAccountInput[]
  snapshots: Record<string, PortfolioSnapshot>
}

export function CexSummary({ accounts, snapshots }: CexSummaryProps) {
  const displayAccounts = accounts.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
        <div className="space-y-2">
          <p className="muted-kicker">来源</p>
          <CardTitle className="text-base">交易所</CardTitle>
        </div>
        <Link href="/cex" className="inline-flex items-center gap-1 text-xs text-primary hover:gap-1.5">
          查看全部
          <CaretRight size={12} weight="bold" />
        </Link>
      </CardHeader>
      <CardContent>
        {displayAccounts.length === 0 ? (
          <div className="py-7 text-center">
            <p className="mb-2 text-sm text-muted-foreground">暂无交易所账户</p>
            <Link href="/cex" className="inline-flex items-center gap-1 text-sm text-primary hover:gap-1.5">
              添加交易所账户
              <CaretRight size={12} weight="bold" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayAccounts.map((a) => {
              const snapshot = snapshots[a.id]
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-[1rem] border border-border/60 bg-muted/20 p-3.5 hover:bg-muted/30"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {getExchangeLabel(a.exchange)}
                      </Badge>
                      <p className="truncate text-sm font-medium">{a.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {snapshot?.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px]">
                        异常
                      </Badge>
                    )}
                    <p className="text-sm font-medium tabular-nums">
                      {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
