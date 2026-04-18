'use client'

import { useRef, useState, type ReactNode } from 'react'
import {
  Cloud,
  DownloadSimple,
  Lock,
  Trash,
  UploadSimple,
  Warning,
} from '@phosphor-icons/react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

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
    toast.success('数据已导出')
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

      toast.success('数据已导入')
    } catch {
      toast.error('导入失败，文件格式不正确')
    } finally {
      event.target.value = ''
    }
  }

  const handleReset = () => {
    setWallets([])
    setAccounts([])
    clearPortfolio()
    clearDefi()
    setConfirmResetOpen(false)
    toast.success('本地数据已清空')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="设置"
        title="控制主题、同步频率与本地数据边界。"
        description="这是一套本地优先的配置面板。导入导出只恢复结构与标签，任何密钥都需要重新手动填写。"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基础设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              label="计价货币"
              description="当前仅支持 USD。"
              control={<Input value={settings.quoteCurrency} disabled className="w-24 text-center" />}
            />

            <Separator />

            <SettingRow
              label="自动刷新间隔（秒）"
              description="建议 60-300 秒。"
              control={
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
              }
            />

            <Separator />

            <SettingRow
              label="隐藏小额资产"
              description="隐藏资产明细里低于 0.1 USD 的项目。"
              control={<Switch checked={settings.hideSmallAssets} onCheckedChange={(checked) => settings.updateSettings({ hideSmallAssets: checked })} />}
            />

            <Separator />

            <SettingRow
              label="启用 DeFi 统计"
              description="查询 EVM 与 Solana 钱包的协议仓位，默认低频刷新；当前会直接并入总资产。"
              control={<Switch checked={settings.defiEnabled} onCheckedChange={(checked) => settings.updateSettings({ defiEnabled: checked })} />}
            />

            <Separator />

            <SettingRow
              label="深色模式"
              description="主题会保存在当前浏览器。"
              control={<Switch checked={settings.theme === 'dark'} onCheckedChange={(checked) => settings.updateSettings({ theme: checked ? 'dark' : 'light' })} />}
            />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">数据管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                label="导出数据"
                description="导出钱包配置、账户标签与设置，不包含快照与任何密钥。"
                control={
                  <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                    <DownloadSimple size={16} weight="regular" />
                    导出 JSON
                  </Button>
                }
              />

              <Separator />

              <SettingRow
                label="导入数据"
                description="从导出的 JSON 恢复钱包、标签与设置，导入后需要重新刷新数据。"
                control={
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleImport}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                      <UploadSimple size={16} weight="regular" />
                      导入 JSON
                    </Button>
                  </>
                }
              />

              <Separator />

              <SettingRow
                label="数据存储"
                description="所有数据均保存在浏览器本地，不会上传至服务端。"
                control={
                  <Badge variant="secondary">
                    <Lock size={14} weight="regular" className="mr-1" />
                    仅本地
                  </Badge>
                }
              />

              <Separator />

              <SettingRow
                label="清空本地数据"
                description="清空钱包、交易所配置、资产缓存与历史看板数据。"
                control={
                  <Button variant="destructive" size="sm" onClick={() => setConfirmResetOpen(true)} className="gap-2">
                    <Trash size={16} weight="regular" />
                    清空
                  </Button>
                }
              />

              {confirmResetOpen ? (
                <div className="rounded-[1.1rem] border border-destructive/15 bg-destructive/6 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Warning size={16} weight="fill" className="text-destructive" />
                    确认清空当前浏览器里的全部本地数据？
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    这个操作会移除钱包、交易所配置、资产快照与历史记录，且无法撤销。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleReset}>
                      确认清空
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmResetOpen(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="opacity-80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud size={16} weight="regular" />
                云同步
              </CardTitle>
              <Badge variant="outline" className="text-xs">即将支持</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                云同步功能将在第二版上线，届时支持账号登录与跨设备数据同步。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">关于</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-7 text-muted-foreground">
              <p>Crypto Insight V1.0.0</p>
              <p>个人加密资产面板 · 数据仅存本地 · 无需注册登录</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description: string
  control: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
