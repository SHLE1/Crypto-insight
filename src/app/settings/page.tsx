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

      toast.success('导入完成。请重新刷新一次，拉取最新资产数据。')
    } catch {
      toast.error('导入失败。请选择从 Crypto Insight 导出的 JSON 文件。')
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
    toast.success('当前浏览器里的本地数据已清空。')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="设置"
        title="偏好设置"
        description="数据仅保存在当前设备，不会同步至云端。导入导出可恢复结构与标签，但密钥须手动重新填写。"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基础设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow
              label="计价货币"
              description="当前只支持 USD。"
              control={<Input value={settings.quoteCurrency} disabled className="w-24 text-center" />}
            />

            <Separator />

            <SettingRow
              label="自动刷新间隔（秒）"
              description="建议设置在 60 到 300 秒之间。"
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
              description="在资产明细里隐藏低于 0.1 USD 的项目。"
              control={<Switch checked={settings.hideSmallAssets} onCheckedChange={(checked) => settings.updateSettings({ hideSmallAssets: checked })} />}
            />

            <Separator />

            <SettingRow
              label="启用 DeFi 统计"
              description="查询 EVM 和 Solana 钱包里的协议仓位。当前结果会直接计入总资产。"
              control={<Switch checked={settings.defiEnabled} onCheckedChange={(checked) => settings.updateSettings({ defiEnabled: checked })} />}
            />

            <Separator />

            <SettingRow
              label="深色模式"
              description="主题偏好会保存在当前浏览器。"
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
                description="导出钱包、账户标签和设置，不包含快照和任何密钥。"
                control={
                  <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                    <DownloadSimple size={16} weight="regular" />
                    导出配置
                  </Button>
                }
              />

              <Separator />

              <SettingRow
                label="导入数据"
                description="从导出的文件恢复钱包、标签和设置。导入后请重新刷新数据。"
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
                      导入配置
                    </Button>
                  </>
                }
              />

              <Separator />

              <SettingRow
                label="数据存储"
                description="所有数据都保存在浏览器本地，不会自动上传。"
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
                description="清空钱包、交易所配置、资产缓存和历史记录。"
                control={
                  <Button variant="destructive" size="sm" onClick={() => setConfirmResetOpen(true)} className="gap-2">
                    <Trash size={16} weight="regular" />
                    清空数据
                  </Button>
                }
              />

              {confirmResetOpen ? (
                <div className="rounded-md border border-destructive/15 bg-destructive/6 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Warning size={16} weight="fill" className="text-destructive" />
                    要清空当前浏览器里的全部本地数据吗？
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    这个操作会删除钱包、交易所配置、资产快照和历史记录，而且不能撤销。
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleReset}>
                      确认清空数据
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
                云同步会在后续版本上线，到时支持登录账号和跨设备同步。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">关于</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-7 text-muted-foreground">
              <p>Crypto Insight V1.0.0</p>
              <p>个人加密资产面板 · 数据仅保存在本地 · 无需注册登录</p>
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
