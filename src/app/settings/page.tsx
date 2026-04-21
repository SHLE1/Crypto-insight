'use client'

import { useRef, useState, type ReactNode } from 'react'
import {
  Cloud,
  Download,
  Lock,
  Trash2,
  Upload,
  AlertTriangle,
  MonitorCog
} from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useCexStore } from '@/stores/cex'
import { useDefiStore } from '@/stores/defi'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useWalletStore } from '@/stores/wallets'
import { toast } from 'sonner'

export default function SettingsPage() {
  const settings = useSettingsStore()
  const wallets = useWalletStore((s) => s.wallets)
  const setWallets = useWalletStore((s) => s.setWallets)
  const accounts = useCexStore((s) => s.accounts)
  const setAccounts = useCexStore((s) => s.setAccounts)
  const clearPortfolio = usePortfolioStore((s) => s.clearAll)
  const clearDefi = useDefiStore((s) => s.clearAll)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = {
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        chainType: wallet.chainType,
        address: wallet.address,
        enabled: wallet.enabled,
        evmChains: wallet.evmChains,
      })),
      cexAccounts: accounts.map((a) => ({
        id: a.id,
        exchange: a.exchange,
        label: a.label,
        enabled: a.enabled,
      })),
      settings: {
        quoteCurrency: settings.quoteCurrency,
        refreshInterval: settings.refreshInterval,
        theme: settings.theme,
        defiEnabled: settings.defiEnabled,
        hideSmallAssets: settings.hideSmallAssets,
      },
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crypto-insight-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('导出完成。这个文件不包含密钥和历史快照。')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const raw = await file.text()
      const data = JSON.parse(raw) as {
        wallets?: typeof wallets
        cexAccounts?: Array<Pick<(typeof accounts)[number], 'id' | 'exchange' | 'label' | 'enabled'>>
        settings?: Partial<typeof settings>
      }

      setWallets(
        Array.isArray(data.wallets)
          ? data.wallets.map((wallet) => ({
              ...wallet,
              enabled: wallet.enabled ?? true,
              evmChains:
                wallet.chainType === 'evm'
                  ? wallet.evmChains && wallet.evmChains.length > 0
                    ? wallet.evmChains
                    : undefined
                  : undefined,
            }))
          : []
      )
      setAccounts(
        Array.isArray(data.cexAccounts)
          ? data.cexAccounts.map((account) => ({
              ...account,
              apiKey: '',
              apiSecret: '',
              passphrase: undefined,
              enabled: account.enabled ?? true,
            }))
          : []
      )
      clearPortfolio()
      clearDefi()

      if (data.settings) {
        settings.updateSettings({
          quoteCurrency: data.settings.quoteCurrency ?? settings.quoteCurrency,
          refreshInterval: data.settings.refreshInterval ?? settings.refreshInterval,
          theme: data.settings.theme ?? settings.theme,
          defiEnabled: data.settings.defiEnabled ?? settings.defiEnabled,
          hideSmallAssets: data.settings.hideSmallAssets ?? settings.hideSmallAssets,
        })
      }

      toast.success('导入完成。清空历史数据，请稍后重新刷新获取最新资产。')
    } catch {
      toast.error('导入失败，请检查文件格式。')
    } finally {
      event.target.value = '' // reset
    }
  }

  const handleReset = () => {
    if (confirm('确认清空所有本地数据、钱包地址、交易所密钥和历史趋势？清空后无法恢复。')) {
      setWallets([])
      setAccounts([])
      clearPortfolio()
      clearDefi()
      toast.success('数据已清空。')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">偏好设置</h2>
        <p className="text-sm text-muted-foreground">
          所有数据仅安全地保存在您的当前设备，不会向云端发送任何私钥信息。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MonitorCog className="w-5 h-5 text-muted-foreground" />
              <CardTitle>基础配置</CardTitle>
            </div>
            <CardDescription>配置看板的显示与刷新逻辑。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="gap-0.5">
                <Label>计价货币</Label>
                <div className="text-sm text-muted-foreground">所有的资产换算基础单位</div>
              </div>
              <Input
                value={settings.quoteCurrency}
                disabled
                className="w-24 text-center disabled:opacity-75"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="gap-0.5">
                <Label>后台刷新间隔</Label>
                <div className="text-sm text-muted-foreground">静默同步数据（秒）</div>
              </div>
              <Input
                type="number"
                min={30}
                max={3600}
                value={settings.refreshInterval}
                className="w-24 text-center"
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 300
                  settings.updateSettings({ refreshInterval: val })
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
               <div className="gap-0.5">
                <Label>DeFi 查询开关</Label>
                <div className="text-sm text-muted-foreground">开启后可同步预言机仓位</div>
              </div>
              <Switch
                checked={settings.defiEnabled}
                onCheckedChange={(c) => settings.updateSettings({ defiEnabled: c })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
               <div className="gap-0.5">
                <Label>隐藏微小资产</Label>
                <div className="text-sm text-muted-foreground">过滤价值极低的尘埃代币</div>
              </div>
              <Switch
                checked={settings.hideSmallAssets}
                onCheckedChange={(c) => settings.updateSettings({ hideSmallAssets: c })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-muted-foreground" />
                <CardTitle>数据备份与恢复</CardTitle>
              </div>
              <CardDescription>导出不包含私钥的安全 JSON 用于多端迁移。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" className="flex-1 gap-2" onClick={handleExport}>
                  <Download className="size-4" />
                  导出安全配置
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4" />
                  导入配置
                </Button>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImport}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/60">
            <CardHeader>
               <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle>危险操作</CardTitle>
              </div>
              <CardDescription>清空本地 IndexedDB 数据，恢复出厂状态。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full gap-2" onClick={handleReset}>
                <Trash2 className="size-4" />
                清空本地系统数据
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
