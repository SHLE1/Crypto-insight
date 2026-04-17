'use client'

import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { EVM_CHAINS } from '@/lib/evm-chains'
import { formatCurrency, getChainLabel, shortAddress } from '@/lib/validators'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWalletStore } from '@/stores/wallets'
import { toast } from 'sonner'

export default function WalletsPage() {
  const { wallets, removeWallet, toggleWallet } = useWalletStore()
  const snapshots = usePortfolioStore((s) => s.snapshots)
  const removeSnapshot = usePortfolioStore((s) => s.removeSnapshot)

  const handleRemove = (id: string, name: string) => {
    removeWallet(id)
    removeSnapshot(id)
    toast.success(`已删除钱包: ${name}`)
  }

  const handleToggle = (id: string, enabled: boolean) => {
    toggleWallet(id)
    if (enabled) {
      removeSnapshot(id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Wallets"
        title="钱包"
        description="管理链上地址来源以及启用状态。"
        actions={
          <Link href="/wallets/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              添加钱包
            </Button>
          </Link>
        }
      />

      {wallets.length === 0 ? (
        <EmptyState
          title="尚未添加任何钱包地址"
          description="添加后会自动参与总览、资产明细和净值趋势分析。"
          action={
            <Link href="/wallets/add">
              <Button>添加第一个钱包</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => {
            const snapshot = snapshots[w.id]
            return (
              <Card key={w.id}>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Switch checked={w.enabled} onCheckedChange={() => handleToggle(w.id, w.enabled)} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {w.name || shortAddress(w.address)}
                        </p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {getChainLabel(w.chainType)}
                        </Badge>
                        {w.chainType === 'evm' && w.evmChains && w.evmChains.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {w.evmChains.map((k) => EVM_CHAINS[k]?.name ?? k).join(', ')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{w.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {snapshot ? new Date(snapshot.updatedAt).toLocaleString('zh-CN') : '等待刷新'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(w.id, w.name || shortAddress(w.address))}
                    >
                      <Trash2 className="h-4 w-4" />
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
