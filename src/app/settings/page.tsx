'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/settings'
import { useWalletStore } from '@/stores/wallets'
import { useCexStore } from '@/stores/cex'
import { usePortfolioStore } from '@/stores/portfolio'
import { toast } from 'sonner'
import { Download, Cloud, Lock } from 'lucide-react'

export default function SettingsPage() {
  const settings = useSettingsStore()
  const wallets = useWalletStore((s) => s.wallets)
  const accounts = useCexStore((s) => s.accounts)
  const { snapshots } = usePortfolioStore()

  const handleExport = () => {
    const data = {
      wallets: wallets.map((w) => ({ id: w.id, name: w.name, chainType: w.chainType, address: w.address })),
      cexAccounts: accounts.map((a) => ({
        id: a.id,
        exchange: a.exchange,
        label: a.label,
      })),
      snapshots,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crypto-insight-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('数据已导出')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基础设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>计价货币</Label>
              <p className="text-xs text-muted-foreground">当前仅支持 USD</p>
            </div>
            <Input
              value={settings.quoteCurrency}
              disabled
              className="w-24 text-center"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>自动刷新间隔（秒）</Label>
              <p className="text-xs text-muted-foreground">建议 60-300 秒</p>
            </div>
            <Input
              type="number"
              min={30}
              max={600}
              value={settings.refreshInterval}
              onChange={(e) =>
                settings.updateSettings({
                  refreshInterval: Number(e.target.value) || 60,
                })
              }
              className="w-24 text-center"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>深色模式</Label>
              <p className="text-xs text-muted-foreground">默认深色，可切换浅色</p>
            </div>
            <Switch
              checked={settings.theme === 'dark'}
              onCheckedChange={(checked) => {
                const newTheme = checked ? 'dark' : 'light'
                settings.updateSettings({ theme: newTheme })
                document.documentElement.classList.toggle('dark', checked)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>导出数据</Label>
              <p className="text-xs text-muted-foreground">
                导出钱包配置与资产快照（不含 API Key）
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出 JSON
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>数据存储</Label>
              <p className="text-xs text-muted-foreground">
                所有数据均保存在浏览器本地，不会上传至服务端
              </p>
            </div>
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              仅本地
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            云同步
          </CardTitle>
          <Badge variant="outline" className="text-xs">即将支持</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            云同步功能将在第二版上线，届时支持 Supabase 账号登录与跨设备数据同步。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">关于</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Crypto Insight V1.0.0</p>
          <p>个人加密资产面板 · 数据仅存本地 · 无需注册登录</p>
        </CardContent>
      </Card>
    </div>
  )
}
