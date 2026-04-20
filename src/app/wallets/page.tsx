'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { EVM_CHAINS } from '@/lib/evm-chains'
import { formatCurrency, getChainLabel, shortAddress } from '@/lib/validators'
import { usePortfolioStore } from '@/stores/portfolio'
import { useWalletStore } from '@/stores/wallets'
import { toast } from 'sonner'

export default function WalletsPage() {
  const { wallets, removeWallet, toggleWallet, updateWallet } = useWalletStore()
  const snapshots = usePortfolioStore((s) => s.snapshots)
  const removeSnapshot = usePortfolioStore((s) => s.removeSnapshot)
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const cancelRenaming = () => {
    setEditingWalletId(null)
    setDraftName('')
  }

  const startRenaming = (id: string, currentName: string) => {
    setEditingWalletId(id)
    setDraftName(currentName)
  }

  const handleRename = (id: string, previousName: string) => {
    const nextName = draftName.trim()
    if (nextName === previousName.trim()) {
      cancelRenaming()
      return
    }

    updateWallet(id, { name: nextName })
    toast.success(nextName ? `钱包名称已更新为 ${nextName}` : '备注名称已清空，之后会显示地址简称。')
    cancelRenaming()
  }

  const handleRemove = (id: string, name: string) => {
    removeWallet(id)
    removeSnapshot(id)
    if (editingWalletId === id) {
      cancelRenaming()
    }
    toast.success(`已删除 ${name}，对应本地快照也已清理。`)
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
        badge="钱包"
        title="我的钱包"
        description="所有钱包地址均参与资产统计和净值趋势计算。禁用时将同步清除对应的本地缓存。"
        actions={
          <Link href="/wallets/add">
            <Button className="gap-2">
              <Plus size={16} weight="regular" />
              添加钱包
            </Button>
          </Link>
        }
      />

      {wallets.length === 0 ? (
        <EmptyState
          title="暂无钱包地址"
          description="添加后将自动参与总资产统计、持仓明细和净值趋势计算。"
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
            const isEditing = editingWalletId === w.id

            return (
              <Card key={w.id}>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <Switch checked={w.enabled} onCheckedChange={() => handleToggle(w.id, w.enabled)} />
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <form
                          className="space-y-2.5"
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleRename(w.id, w.name ?? '')
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              autoFocus
                              value={draftName}
                              placeholder="例如：主钱包"
                              className="h-9 max-w-sm"
                              onChange={(e) => setDraftName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.preventDefault()
                                  cancelRenaming()
                                }
                              }}
                            />
                            <Button type="submit" size="sm" className="gap-1.5">
                              <Check size={14} weight="bold" />
                              保存
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={cancelRenaming}>
                              <X size={14} weight="bold" />
                              取消
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {getChainLabel(w.chainType)}
                            </Badge>
                            {w.chainType === 'evm' && w.evmChains && w.evmChains.length > 0 ? (
                              <span>{w.evmChains.map((k) => EVM_CHAINS[k]?.name ?? k).join(', ')}</span>
                            ) : null}
                            <span>留空后，会改为显示地址简称</span>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {w.name || shortAddress(w.address)}
                          </p>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {getChainLabel(w.chainType)}
                          </Badge>
                          {w.chainType === 'evm' && w.evmChains && w.evmChains.length > 0 ? (
                            <span className="text-xs leading-6 text-muted-foreground">
                              {w.evmChains.map((k) => EVM_CHAINS[k]?.name ?? k).join(', ')}
                            </span>
                          ) : null}
                        </div>
                      )}
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{w.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1 text-left sm:text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                      </p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        {snapshot ? new Date(snapshot.updatedAt).toLocaleString('zh-CN') : '尚未刷新'}
                      </p>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startRenaming(w.id, w.name ?? '')}
                        aria-label={`编辑 ${w.name || shortAddress(w.address)} 的名称`}
                      >
                        <PencilSimple size={16} weight="regular" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(w.id, w.name || shortAddress(w.address))}
                      aria-label={`删除 ${w.name || shortAddress(w.address)}`}
                    >
                      <Trash size={16} weight="regular" />
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
