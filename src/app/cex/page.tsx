'use client'

import { useState } from 'react'
import { KeyRound, Plus, Trash2, X } from 'lucide-react'
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

  const enabledCount = accounts.filter((account) => account.enabled).length

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
      toast.error('请填写 API Key 和 Secret')
      return
    }

    if (exchange === 'okx' && !passphrase.trim()) {
      toast.error('OKX 账户需要填写 Passphrase')
      return
    }

    const alreadyExists = accounts.some(
      (account) =>
        account.id !== editingAccountId &&
        account.exchange === exchange &&
        account.apiKey.trim() === apiKey.trim()
    )

    if (alreadyExists) {
      toast.error('这个交易所账户已经绑定过了')
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
      toast.success('交易所密钥已更新')
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
      toast.success('交易所账户已添加')
    }

    resetForm()
  }

  const handleRemove = (id: string, label: string) => {
    removeAccount(id)
    removeSnapshot(id)
    toast.success(`已删除账户: ${label}`)
  }

  const handleToggle = (id: string, enabled: boolean) => {
    toggleAccount(id)
    if (enabled) {
      removeSnapshot(id)
    }
  }

  return (
    <div className="analytics-shell">
      <PageHeader
        eyebrow="Exchange accounts"
        title="把只读交易所账户并入你的本地资产分析台。"
        description="密钥只保存在当前浏览器；删除、停用或更新账户后，不会把敏感信息带入导出文件。"
        actions={
          !showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              绑定账户
            </Button>
          ) : null
        }
        stats={[
          { label: '账户总数', value: `${accounts.length}`, detail: '当前浏览器保存的只读账户' },
          { label: '当前启用', value: `${enabledCount}`, detail: '参与总览与明细计算' },
        ]}
      />

      {showForm ? (
        <Card className="max-w-4xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
            <CardTitle className="text-base">{editingAccountId ? '补填或更新密钥' : '绑定交易所账户'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm} aria-label="关闭表单">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <Label>交易所</Label>
                <div className="flex flex-wrap gap-2">
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <Button
                      key={ex}
                      type="button"
                      variant={exchange === ex ? 'secondary' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      disabled={editingAccountId !== null}
                      onClick={() => setExchange(ex)}
                    >
                      {getExchangeLabel(ex)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="label">备注名称（可选）</Label>
                <Input id="label" placeholder="例如：主账户" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="apiKey">API Key（只读权限）</Label>
                <Input
                  id="apiKey"
                  placeholder="填入只读 API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="填入 API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="font-mono"
                />
              </div>

              {exchange === 'okx' ? (
                <div className="space-y-2.5">
                  <Label htmlFor="passphrase">Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="OKX Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                  />
                </div>
              ) : null}

              <p className="text-xs leading-6 text-muted-foreground">
                仅保存于当前浏览器，导出文件不会包含密钥。请确保使用只读权限的 Key。
              </p>

              <div className="flex flex-wrap gap-3">
                <Button type="submit">确认绑定</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>

            <aside className="surface-subtle rounded-[1.45rem] p-5">
              <p className="section-label">Security</p>
              <h2 className="mt-3 text-base font-semibold tracking-[-0.04em] text-foreground">安全原则</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <li>· 只使用只读权限，不开启提币、交易或转账权限。</li>
                <li>· 导出文件不会包含 API Key、Secret 或 Passphrase。</li>
                <li>· 删除或停用账户时，会同步清理本地快照缓存。</li>
              </ul>
            </aside>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      {accounts.length === 0 && !showForm ? (
        <EmptyState
          mark="EX"
          title="还没有绑定任何交易所账户。"
          description="接入只读 API 后，就能把链上资产和交易所余额统一纳入总览。"
          actions={<Button onClick={() => setShowForm(true)}>绑定第一个账户</Button>}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => {
            const snapshot = snapshots[a.id]
            return (
              <Card key={a.id} className="list-row">
                <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <Switch checked={a.enabled} onCheckedChange={() => handleToggle(a.id, a.enabled)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold tracking-[-0.04em]">{a.label}</p>
                        <Badge variant="secondary" className="rounded-full text-[10px] tracking-[0.08em]">
                          {getExchangeLabel(a.exchange)}
                        </Badge>
                        {!a.apiKey.trim() ? <Badge variant="outline" className="rounded-full text-[10px]">需重填密钥</Badge> : null}
                        {snapshot?.status === 'error' ? <Badge variant="destructive" className="rounded-full text-[10px]">异常</Badge> : null}
                      </div>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        {a.apiKey.trim()
                          ? `Key: ${a.apiKey.slice(0, 6)}...${a.apiKey.slice(-4)}`
                          : '当前浏览器未保存密钥，需要重新填写后才能刷新。'}
                      </p>
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
                    <Button variant="ghost" size="icon" onClick={() => startEditing(a.id)} aria-label={`更新账户 ${a.label} 的密钥`}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(a.id, a.label)} aria-label={`删除账户 ${a.label}`}>
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
