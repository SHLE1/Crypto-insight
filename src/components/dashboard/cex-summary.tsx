'use client'

import Link from 'next/link'
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <p className="section-label">Exchanges</p>
          <CardTitle className="mt-2 text-base">交易所</CardTitle>
        </div>
        <Link href="/cex" className="text-xs text-primary hover:underline">
          查看全部
        </Link>
      </CardHeader>
      <CardContent>
        {displayAccounts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">尚未绑定交易所</p>
            <Link href="/cex" className="mt-3 inline-block text-sm text-primary hover:underline">
              绑定交易所账户 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayAccounts.map((a) => {
              const snapshot = snapshots[a.id]
              return (
                <div key={a.id} className="surface-subtle flex items-center justify-between gap-3 rounded-[1.2rem] p-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge variant="secondary" className="rounded-full text-[10px] tracking-[0.08em]">
                      {getExchangeLabel(a.exchange)}
                    </Badge>
                    <p className="truncate text-sm font-medium tracking-[-0.03em]">{a.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {snapshot?.status === 'error' ? (
                      <Badge variant="destructive" className="rounded-full text-[10px]">异常</Badge>
                    ) : null}
                    <p className="text-sm font-medium tracking-[-0.03em]">
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
