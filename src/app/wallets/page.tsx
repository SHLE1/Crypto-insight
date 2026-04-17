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

  const enabledCount = wallets.filter((wallet) => wallet.enabled).length

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
    <div className="analytics-shell">
      <PageHeader
        eyebrow="Wallet sources"
        title="本地管理你的链上地址来源。"
        description="开启或停用单个钱包、保留多链 EVM 查询范围，并在同一页快速确认快照估值与更新时间。"
        actions={
          <Link href="/wallets/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              添加钱包
            </Button>
          </Link>
        }
        stats={[
          { label: '钱包总数', value: `${wallets.length}`, detail: '保存在当前浏览器' },
          { label: '当前启用', value: `${enabledCount}`, detail: '会参与自动刷新与总资产计算' },
        ]}
      />

      {wallets.length === 0 ? (
        <EmptyState
          mark="W"
          title="还没有添加任何钱包地址。"
          description="添加后会自动参与总览、资产明细与趋势分析。"
          actions={
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
              <Card key={w.id} className="list-row">
                <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Switch checked={w.enabled} onCheckedChange={() => handleToggle(w.id, w.enabled)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold tracking-[-0.04em]">
                          {w.name || shortAddress(w.address)}
                        </p>
                        <Badge variant="secondary" className="rounded-full text-[10px] tracking-[0.08em]">
                          {getChainLabel(w.chainType)}
                        </Badge>
                        {w.chainType === 'evm' && w.evmChains && w.evmChains.length > 0 ? (
                          <span className="data-pill">{w.evmChains.map((k) => EVM_CHAINS[k]?.name ?? k).join(' · ')}</span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{w.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <div className="surface-subtle min-w-[10.5rem] rounded-[1.15rem] px-4 py-3 text-right">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">快照估值</p>
                      <p className="mt-1.5 text-sm font-semibold tracking-[-0.03em] text-foreground">
                        {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {snapshot ? new Date(snapshot.updatedAt).toLocaleString('zh-CN') : '等待首次刷新'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(w.id, w.name || shortAddress(w.address))}
                      aria-label={`删除钱包 ${w.name || shortAddress(w.address)}`}
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
