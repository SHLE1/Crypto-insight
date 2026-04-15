'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { formatCurrency, getExchangeLabel } from '@/lib/validators'
import type { ExchangeType } from '@/types'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const EXCHANGE_OPTIONS: ExchangeType[] = ['binance', 'okx']

export default function CexPage() {
  const { accounts, addAccount, removeAccount, toggleAccount } = useCexStore()
  const snapshots = usePortfolioStore((s) => s.snapshots)
  const [showForm, setShowForm] = useState(false)
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
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error('请填写 API Key 和 Secret')
      return
    }

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
    resetForm()
  }

  const handleRemove = (id: string, label: string) => {
    removeAccount(id)
    toast.success(`已删除账户: ${label}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">交易所</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            绑定账户
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="max-w-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">绑定交易所账户</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>交易所</Label>
                <div className="flex gap-2">
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <Button
                      key={ex}
                      type="button"
                      variant={exchange === ex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExchange(ex)}
                    >
                      {getExchangeLabel(ex)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">备注名称（可选）</Label>
                <Input
                  id="label"
                  placeholder="例如：主账户"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key（只读权限）</Label>
                <Input
                  id="apiKey"
                  placeholder="填入只读 API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
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

              {exchange === 'okx' && (
                <div className="space-y-2">
                  <Label htmlFor="passphrase">Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="OKX Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                ⚠️ API Key 仅保存在浏览器本地，不会上传至服务端。请确保使用只读权限的 Key。
              </p>

              <div className="flex gap-3">
                <Button type="submit">确认绑定</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Separator />

      {accounts.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">尚未绑定任何交易所账户</p>
          <Button onClick={() => setShowForm(true)}>
            绑定第一个账户
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => {
            const snapshot = snapshots[a.id]
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Switch
                      checked={a.enabled}
                      onCheckedChange={() => toggleAccount(a.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{a.label}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getExchangeLabel(a.exchange)}
                        </Badge>
                        {snapshot?.status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            异常
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        Key: {a.apiKey.slice(0, 6)}...{a.apiKey.slice(-4)}
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
                      onClick={() => handleRemove(a.id, a.label)}
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
