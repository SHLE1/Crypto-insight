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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">交易所</CardTitle>
        <Link href="/cex" className="text-xs text-primary hover:underline">
          查看全部
        </Link>
      </CardHeader>
      <CardContent>
        {displayAccounts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">尚未绑定交易所</p>
            <Link
              href="/cex"
              className="text-sm text-primary hover:underline"
            >
              绑定交易所账户 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAccounts.map((a) => {
              const snapshot = snapshots[a.id]
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getExchangeLabel(a.exchange)}
                    </Badge>
                    <p className="text-sm font-medium">{a.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {snapshot?.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        异常
                      </Badge>
                    )}
                    <p className="text-sm font-medium">
                      {snapshot
                        ? formatCurrency(snapshot.totalValue)
                        : '--'}
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
