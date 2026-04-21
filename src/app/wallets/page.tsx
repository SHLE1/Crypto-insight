'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Pencil, Plus, Trash2, X, Wallet as WalletIcon } from 'lucide-react'
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
    setDraftName(currentName || '')
  }

  const handleRename = (id: string, previousName: string) => {
    const nextName = draftName.trim()
    if (nextName === (previousName || '').trim()) {
      cancelRenaming()
      return
    }

    updateWallet(id, { name: nextName })
    toast.success(nextName ? `钱包名称已更新为 ${nextName}` : '备注名称已清空， 之后会显示地址简称。')
    cancelRenaming()
  }

  const handleRemove = (id: string, name: string) => {
    removeWallet(id)
    removeSnapshot(id)
    if (editingWalletId === id) {
      cancelRenaming()
    }
    toast.success(`已删除 ${name || '未命名钱包'}，对应本地快照也已清理。`)
  }

  const handleToggle = (id: string, enabled: boolean) => {
    toggleWallet(id)
    if (enabled) {
      removeSnapshot(id)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">我的钱包</h2>
          <p className="text-sm text-muted-foreground">
            所有启用的钱包地址均参与资产统计和净值趋势计算。
          </p>
        </div>
        <Link href="/wallets/add">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            添加钱包
          </Button>
        </Link>
      </div>

      {wallets.length === 0 ? (
        <div className="mt-4">
           <EmptyState
            title="暂无钱包地址"
            description="添加后将自动参与总资产统计、持仓明细和净值趋势计算。"
            action={
              <Link href="/wallets/add">
                <Button>添加第一个钱包</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 mt-4">
          {wallets.map((w) => {
            const snapshot = snapshots[w.id]
            const isEditing = editingWalletId === w.id

            return (
              <Card key={w.id} className={`${!w.enabled ? 'opacity-60 grayscale-[0.5]' : ''} transition-all`}>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    <Switch 
                       className="mt-1"
                       checked={w.enabled} 
                       onCheckedChange={(c) => handleToggle(w.id, c)} 
                    />
                    <div className="flex flex-col gap-1.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                           <Input
                             autoFocus
                             className="h-8 w-48 text-sm"
                             placeholder="设置名称..."
                             value={draftName}
                             onChange={(e) => setDraftName(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Escape') cancelRenaming()
                               if (e.key === 'Enter') handleRename(w.id, w.name ?? '')
                             }}
                           />
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground" onClick={() => handleRename(w.id, w.name ?? '')}>
                              <Check className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={cancelRenaming}>
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h3 className="font-semibold text-base leading-none">
                            {w.name || shortAddress(w.address)}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] h-5">{getChainLabel(w.chainType)}</Badge>
                          <button 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            onClick={() => startRenaming(w.id, w.name ?? '')}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground font-mono">
                        <span>{w.address}</span>
                        {w.chainType === 'evm' && w.evmChains && w.evmChains.length > 0 && (
                          <span className="font-sans hidden sm:inline-block border-l border-border pl-3">
                            {w.evmChains.map((k) => EVM_CHAINS[k]?.name ?? k).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                     <div className="text-left sm:text-right">
                        <div className="font-bold text-lg tabular-nums">
                          {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {snapshot ? new Date(snapshot.updatedAt).toLocaleString('zh-CN') : '尚未拉取'}
                        </div>
                     </div>
                     <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-muted/10" onClick={() => handleRemove(w.id, w.name ?? '')}>
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
