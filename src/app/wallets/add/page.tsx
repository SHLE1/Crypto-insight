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
      setError('请输入钱包地址后再保存。')
      return
    }

    if (!validateAddress(trimmed, chainType)) {
      setError(`${getChainLabel(chainType)} 地址格式不正确，请检查后重试。`)
      return
    }

    if (chainType === 'evm' && selectedEvmChains.length === 0) {
      setError('请至少选择一条要查询的 EVM 链。')
      return
    }

    const normalizedAddress = chainType === 'evm' ? trimmed.toLowerCase() : trimmed
    const alreadyExists = wallets.some(
      (wallet) =>
        wallet.chainType === chainType &&
        (chainType === 'evm' ? wallet.address.toLowerCase() : wallet.address) === normalizedAddress
    )

    if (alreadyExists) {
      setError('这个地址已经在列表里了，不需要重复添加。')
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

    toast.success('钱包已添加，现在可以开始查看资产了。')
    router.push('/wallets')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="新增钱包"
        title="添加钱包地址"
        description="钱包地址仅保存在本地浏览器，添加后将立即参与资产统计。"
      />

      <Card className="max-w-4xl">
        <CardHeader className="border-b border-border/75">
          <CardTitle className="text-base">钱包信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>链类型</Label>
              <div className="flex flex-wrap gap-2">
                {CHAIN_OPTIONS.map((chain) => (
                  <Button
                    key={chain}
                    type="button"
                    variant={chainType === chain ? 'secondary' : 'outline'}
                    size="sm"
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
              <div className="space-y-2">
                <Label>查询链</Label>
                <div className="flex flex-wrap gap-2">
                  {EVM_CHAIN_OPTIONS.map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      variant={selectedEvmChains.includes(opt.key) ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => toggleEvmChain(opt.key)}
                    >
                      {opt.name} ({opt.symbol})
                    </Button>
                  ))}
                </div>
                <p className="text-xs leading-6 text-muted-foreground">
                  选择你想查询的链。同一个地址在不同链上可能有不同资产。
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
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
                  ? '同一个 EVM 地址可以在多条链上使用。我们会按你勾选的链查询原生代币和常见 ERC-20。'
                  : chainType === 'solana'
                    ? '当前会查询 SOL 和常见 SPL Token。'
                    : '当前会查询这个 BTC 地址的余额。'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">备注名称（可选）</Label>
              <Input
                id="name"
                placeholder="例如：主钱包"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-3">
              <Button type="submit">添加钱包</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/wallets')}>
                返回钱包列表
              </Button>
            </div>
          </form>

          <div className="subtle-panel p-5">
            <p className="muted-kicker">添加前先看</p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
              <li>钱包地址只保存在当前浏览器。</li>
              <li>EVM 地址建议只勾选你实际会用到的链，避免无效查询。</li>
              <li>添加后，这个地址会直接参与总览、明细和趋势计算。</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
