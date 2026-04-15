'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWalletStore } from '@/stores/wallets'
import { validateAddress, getChainLabel } from '@/lib/validators'
import { EVM_CHAIN_OPTIONS, DEFAULT_EVM_CHAINS } from '@/lib/evm-chains'
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">添加钱包</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">钱包信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>链类型</Label>
              <div className="flex gap-2">
                {CHAIN_OPTIONS.map((chain) => (
                  <Button
                    key={chain}
                    type="button"
                    variant={chainType === chain ? 'default' : 'outline'}
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

            {chainType === 'evm' && (
              <div className="space-y-2">
                <Label>查询链</Label>
                <div className="flex flex-wrap gap-2">
                  {EVM_CHAIN_OPTIONS.map((opt) => (
                    <Button
                      key={opt.key}
                      type="button"
                      variant={selectedEvmChains.includes(opt.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleEvmChain(opt.key)}
                    >
                      {opt.name} ({opt.symbol})
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  选择要查询的链，同一地址在不同链上可能持有不同代币。
                </p>
              </div>
            )}

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
              <p className="text-xs text-muted-foreground">
                {chainType === 'evm'
                  ? 'EVM 地址在多条链上通用，会查询每条链上的原生代币和热门 ERC-20 代币。'
                  : chainType === 'solana'
                  ? '当前按原生 SOL + SPL Token 查询。'
                  : '当前按 BTC 地址余额查询。'}
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

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit">确认添加</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/wallets')}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
