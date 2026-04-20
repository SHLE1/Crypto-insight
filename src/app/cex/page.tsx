'use client'

import { useState } from 'react'
import { Key, Plus, Trash, X } from '@phosphor-icons/react'
import { EmptyState } from '@/components/layout/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-6">
      <PageHeader
        badge="交易所"
        title="把交易所资产接入同一张总表。"
        description="绑定只读 API 后，交易所余额会自动出现在总览和资产明细里。密钥只保存在当前浏览器，导出文件不会包含它们。"
        actions={
          !showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus size={16} weight="regular" />
              添加账户
            </Button>
          ) : null
        }
      />

      {showForm ? (
        <Card className="max-w-4xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/75">
            <CardTitle className="text-base">{editingAccountId ? '重新填写或更新密钥' : '添加交易所账户'}</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={resetForm}>
              <X size={16} weight="regular" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>交易所</Label>
                <div className="flex gap-2">
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <Button
                      key={ex}
                      type="button"
                      variant={exchange === ex ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={editingAccountId !== null}
                      onClick={() => setExchange(ex)}
                    >
                      {getExchangeLabel(ex)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">备注名称（可选）</Label>
                <Input id="label" placeholder="例如：主账户 / 量化账户" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key（只读权限）</Label>
                <Input id="apiKey" placeholder="输入只读 API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="font-mono" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input id="apiSecret" type="password" placeholder="输入 API Secret" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className="font-mono" />
              </div>

              {exchange === 'okx' ? (
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Passphrase</Label>
                  <Input id="passphrase" type="password" placeholder="输入 OKX Passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                </div>
              ) : null}

              <p className="text-xs leading-6 text-muted-foreground">
                密钥只保存在当前浏览器，导出文件不会包含它们。请确认这组 Key 只有只读权限。
              </p>

              <div className="flex gap-3">
                <Button type="submit">保存账户</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>

            <div className="subtle-panel p-5">
              <p className="muted-kicker">绑定前先看</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                <li>只使用只读权限的 API Key。</li>
                <li>导出文件不会包含任何密钥。</li>
                <li>删除账户时，会一起清理这个账户的本地快照。</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      {accounts.length === 0 && !showForm ? (
        <EmptyState
          title="还没有交易所账户"
          description="添加只读 API 后，这里的资产会自动进入总览和资产明细。"
          action={<Button onClick={() => setShowForm(true)}>添加第一个账户</Button>}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => {
            const snapshot = snapshots[a.id]
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <Switch checked={a.enabled} onCheckedChange={() => handleToggle(a.id, a.enabled)} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{a.label}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {getExchangeLabel(a.exchange)}
                        </Badge>
                        {!a.apiKey.trim() ? (
                          <Badge variant="outline" className="text-[10px]">
                            需要重新填写密钥
                          </Badge>
                        ) : null}
                        {snapshot?.status === 'error' ? (
                          <Badge variant="destructive" className="text-[10px]">
                            异常
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-xs leading-6 text-muted-foreground">
                        {a.apiKey.trim()
                          ? `Key: ${a.apiKey.slice(0, 6)}...${a.apiKey.slice(-4)}`
                          : '这个浏览器里还没有保存密钥。重新填写后才能刷新这个账户。'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {snapshot ? formatCurrency(snapshot.totalValue) : '--'}
                      </p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        {snapshot ? new Date(snapshot.updatedAt).toLocaleString('zh-CN') : '还没刷新'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => startEditing(a.id)}>
                      <Key size={16} weight="regular" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(a.id, a.label)}>
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
