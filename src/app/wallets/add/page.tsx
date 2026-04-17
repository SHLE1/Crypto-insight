'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_EVM_CHAINS, EVM_CHAIN_OPTIONS } from '@/lib/evm-chains'
import { getChainLabel, validateAddress } from '@/lib/validators'
import { useWalletStore } from '@/stores/wallets'
import type { ChainType } from '@/types'
import { toast } from 'sonner'

const CHAIN_OPTIONS: ChainType[] = ['evm', 'solana', 'btc']

export default function AddWalletPage() {
  const router = useRouter()
  const addWallet = useWalletStore((s) => s.addWallet)
  const wallets = useWalletStore((s) => s.wallets)

  const [chainType, setChainType] = useState<ChainType>('evm')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [selectedEvmChains, setSelectedEvmChains] = useState<string[]>(DEFAULT_EVM_CHAINS)

  const toggleEvmChain = (key: string) => {
    setSelectedEvmChains((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = address.trim()
    if (!trimmed) {
      setError('请输入钱包地址')
      return
    }

    if (!validateAddress(trimmed, chainType)) {
      setError(`无效的 ${getChainLabel(chainType)} 地址`)
      return
    }

    if (chainType === 'evm' && selectedEvmChains.length === 0) {
      setError('请至少选择一条 EVM 链')
      return
    }

    const normalizedAddress = chainType === 'evm' ? trimmed.toLowerCase() : trimmed
    const alreadyExists = wallets.some(
      (wallet) =>
        wallet.chainType === chainType &&
        (chainType === 'evm' ? wallet.address.toLowerCase() : wallet.address) === normalizedAddress
    )

    if (alreadyExists) {
      setError('这个地址已经添加过了')
      return
    }

    addWallet({
      id: crypto.randomUUID(),
      name: name.trim(),
      chainType,
      address: trimmed,
      enabled: true,
      evmChains: chainType === 'evm' ? selectedEvmChains : undefined,
    })

    toast.success('钱包已添加')
    router.push('/wallets')
  }

  return (
    <div className="analytics-shell">
      <PageHeader
        eyebrow="New wallet"
        title="添加一个新的链上地址来源。"
        description="按链类型校验地址，EVM 地址可同时覆盖多条链；添加后会立即参与总览和资产明细统计。"
      />

      <Card className="max-w-4xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base">钱包信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label>链类型</Label>
              <div className="flex flex-wrap gap-2">
                {CHAIN_OPTIONS.map((chain) => (
                  <Button
                    key={chain}
                    type="button"
                    variant={chainType === chain ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setChainType(chain)
                      setError('')
                    }}
                  >
                    {getChainLabel(chain)}
                  </Button>
                ))}
              </div>
            </div>

            {chainType === 'evm' ? (
              <div className="space-y-2.5">
                <Label>查询链</Label>
                <div className="flex flex-wrap gap-2">
                  {EVM_CHAIN_OPTIONS.map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      variant={selectedEvmChains.includes(opt.key) ? 'secondary' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleEvmChain(opt.key)}
                    >
                      {opt.name} ({opt.symbol})
                    </Button>
                  ))}
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  选择要查询的链。同一地址在不同链上可能持有不同代币。
                </p>
              </div>
            ) : null}

            <div className="space-y-2.5">
              <Label htmlFor="address">钱包地址</Label>
              <Input
                id="address"
                placeholder={
                  chainType === 'evm'
                    ? '0x...'
                    : chainType === 'btc'
                      ? '1... / 3... / bc1...'
                      : 'Solana 地址'
                }
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setError('')
                }}
                className="font-mono"
              />
              <p className="text-xs leading-6 text-muted-foreground">
                {chainType === 'evm'
                  ? 'EVM 地址在多条链上通用，会查询每条链上的原生代币和热门 ERC-20 代币。'
                  : chainType === 'solana'
                    ? '当前按原生 SOL + SPL Token 查询。'
                    : '当前按 BTC 地址余额查询。'}
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="name">备注名称（可选）</Label>
              <Input
                id="name"
                placeholder="例如：主钱包"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">确认添加</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/wallets')}>
                取消
              </Button>
            </div>
          </form>

          <aside className="surface-subtle rounded-[1.45rem] p-5">
            <p className="section-label">Guide</p>
            <h2 className="mt-3 text-base font-semibold tracking-[-0.04em] text-foreground">添加前确认</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>· 地址只保存在当前浏览器，不会上传到服务端。</li>
              <li>· EVM 地址建议按实际持仓链勾选，减少无意义查询。</li>
              <li>· 添加完成后会在总览页自动参与净值计算。</li>
            </ul>
          </aside>
        </CardContent>
      </Card>
    </div>
  )
}
