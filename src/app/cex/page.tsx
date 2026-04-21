'use client'

import { useState } from 'react'
import { Key, Plus, Trash, X, Building2 } from 'lucide-react'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, getExchangeLabel } from '@/lib/validators'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import type { ExchangeType } from '@/types'
import { toast } from 'sonner'

const EXCHANGE_OPTIONS: ExchangeType[] = ['binance', 'okx']

export default function CexPage() {
  const { accounts, addAccount, removeAccount, toggleAccount, updateAccount } = useCexStore()
  const snapshots = usePortfolioStore((s) => s.snapshots)
  const removeSnapshot = usePortfolioStore((s) => s.removeSnapshot)
  const [showForm, setShowForm] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [exchange, setExchange] = useState<ExchangeType>('binance')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')

  const resetForm = () => {
    setLabel('')
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setEditingAccountId(null)
    setShowForm(false)
  }

  const startEditing = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId)
    if (!account) return

    setEditingAccountId(account.id)
    setExchange(account.exchange)
    setLabel(account.label)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error('请先填写 API Key 和 API Secret。')
      return
    }

    if (exchange === 'okx' && !passphrase.trim()) {
      toast.error('OKX 账户还需要填写 Passphrase。')
      return
    }

    const alreadyExists = accounts.some(
      (account) =>
        account.id !== editingAccountId &&
        account.exchange === exchange &&
        account.apiKey.trim() === apiKey.trim()
    )

    if (alreadyExists) {
      toast.error('这个交易所账户已经绑定过了，不需要重复添加。')
      return
    }

    if (editingAccountId) {
      updateAccount(editingAccountId, {
        ...accounts.find(a => a.id === editingAccountId)!,
        exchange,
        label: label.trim() || getExchangeLabel(exchange),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        passphrase: exchange === 'okx' ? passphrase.trim() : undefined,
      })
      removeSnapshot(editingAccountId)
      toast.success('密钥已更新，下次刷新会重新拉取这个账户的数据。')
    } else {
      addAccount({
        id: crypto.randomUUID(),
        exchange,
        label: label.trim() || getExchangeLabel(exchange),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        passphrase: exchange === 'okx' ? passphrase.trim() : undefined,
        enabled: true,
      })
      toast.success('交易所账户已添加，现在可以回到总览查看资产。')
    }

    resetForm()
  }

  const handleRemove = (id: string, label: string) => {
    removeAccount(id)
    removeSnapshot(id)
    toast.success(`已删除 ${label}，对应本地快照也已清理。`)
  }

  const handleToggle = (id: string, enabled: boolean) => {
    toggleAccount(id)
    if (enabled) {
      removeSnapshot(id)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">交易所账户</h2>
          <p className="text-sm text-muted-foreground">
            接入只读 API 后，账户余额将自动汇入资产总览与持仓明细。密钥仅保存在本地浏览器，导出文件不包含任何密钥。
          </p>
        </div>
        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="size-4" />
            添加账户
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <Card className="max-w-3xl mt-4">
          <CardHeader className="flex flex-row items-center justify-between gap-0">
            <div>
               <CardTitle>{editingAccountId ? '重新填写或更新密钥' : '添加交易所账户'}</CardTitle>
               <CardDescription>配置您的只读 API 密钥，请勿授予交易或提现权限。</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <Label>交易所</Label>
                <div className="flex flex-wrap gap-2">
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <Button
                      key={ex}
                      type="button"
                      variant={exchange === ex ? 'default' : 'outline'}
                      size="sm"
                      disabled={editingAccountId !== null}
                      onClick={() => setExchange(ex)}
                    >
                      {getExchangeLabel(ex)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="label">备注名称（可选）</Label>
                <Input id="label" placeholder="例如：主账户 / 量化账户" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="apiKey">API Key (Access Key)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="输入只读权限的 API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    placeholder="输入对应的 API Secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                  />
                </div>
              </div>

              {exchange === 'okx' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="passphrase">Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="OKX API 创建时设置的 Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                  />
                </div>
              )}

              <Separator className="my-4" />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>取消</Button>
                <Button type="submit">{editingAccountId ? '更新密钥' : '保存配置'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="没有绑定的交易所账户"
            description="添加只读权限的 API 密钥以追踪汇集所有加密资产。"
            action={
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="size-4" />
                添加账户
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {accounts.map((account) => {
            const snapshot = snapshots[account.id]
            const isOkx = account.exchange === 'okx'
            return (
              <Card key={account.id} className={!account.enabled ? 'opacity-60' : ''}>
                <CardHeader className="flex flex-row items-start justify-between gap-0 pb-2">
                  <div className="flex items-center gap-2">
                     <Building2 className="w-5 h-5 text-muted-foreground" />
                     <div className="flex flex-col gap-1">
                       <CardTitle className="text-base">{account.label}</CardTitle>
                       <CardDescription className="text-xs uppercase font-mono">{account.exchange}</CardDescription>
                     </div>
                  </div>
                  <Switch
                    checked={account.enabled}
                    onCheckedChange={(checked) => handleToggle(account.id, checked)}
                    aria-label="切换账户启用状态"
                  />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-baseline justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">快照价值</p>
                        <p className="text-xl font-bold tracking-tight">
                          {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => startEditing(account.id)}>
                        <Key className="size-4" />更新密钥
                      </Button>
                      <Button variant="destructive" size="sm" className="px-3" onClick={() => handleRemove(account.id, account.label)}>
                        <Trash className="size-4" />
                      </Button>
                    </div>
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
