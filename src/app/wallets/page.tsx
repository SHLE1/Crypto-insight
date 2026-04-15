'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useWalletStore } from '@/stores/wallets'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatCurrency, shortAddress, getChainLabel } from '@/lib/validators'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WalletsPage() {
  const { wallets, removeWallet, toggleWallet } = useWalletStore()
  const snapshots = usePortfolioStore((s) => s.snapshots)

  const handleRemove = (id: string, name: string) => {
    removeWallet(id)
    toast.success(`已删除钱包: ${name}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">钱包</h1>
        <Link href="/wallets/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加钱包
          </Button>
        </Link>
      </div>

      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">尚未添加任何钱包地址</p>
          <Link href="/wallets/add">
            <Button>添加第一个钱包</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => {
            const snapshot = snapshots[w.id]
            return (
              <Card key={w.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Switch
                      checked={w.enabled}
                      onCheckedChange={() => toggleWallet(w.id)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {w.name || shortAddress(w.address)}
                        </p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {getChainLabel(w.chainType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {w.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-medium">
                        {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                      </p>
                      {snapshot && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(snapshot.updatedAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(w.id, w.name || shortAddress(w.address))}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
