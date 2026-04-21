'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEFAULT_EVM_CHAINS, EVM_CHAIN_OPTIONS } from '@/lib/evm-chains'
import { getChainLabel, validateAddress } from '@/lib/validators'
import { useWalletStore } from '@/stores/wallets'
import type { ChainType } from '@/types'
import { toast } from 'sonner'
import { ArrowLeft, Wallet } from 'lucide-react'
import Link from 'next/link'

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
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <Link href="/wallets">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" />
                 </Button>
               </Link>
               <h2 className="text-2xl font-bold tracking-tight">添加地址</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
               配置您要追踪的区块链钱包地址。该数据仅加密保存在本地。
            </p>
         </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <CardTitle>监控基础信息</CardTitle>
          </div>
          <CardDescription>选择网络类型并粘贴只读钱包地址</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label>网络体系</Label>
              <div className="flex flex-wrap gap-2">
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

            {chainType === 'evm' ? (
              <div className="flex flex-col gap-3">
                <Label>需要监控的具体链</Label>
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
                  勾选后将同步该地址在对应链上的原生代币和常见 ERC-20。
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
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
                className="font-mono text-sm max-w-xl"
              />
              <p className="text-xs text-muted-foreground">
                {chainType === 'evm'
                  ? '注意：我们会按您上方勾选的子链查询资产缓存。'
                  : chainType === 'solana'
                    ? '当前会查询 SOL 和常见的 SPL Token 分发。'
                    : '当前会查询地址级别的原生 BTC 余额。'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">备注名称（可选）</Label>
              <Input
                id="name"
                placeholder="例如：提币冷钱包 / 空投号"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xl"
              />
            </div>

            {error && <p className="text-sm font-medium text-foreground">{error}</p>}

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/wallets')}>
                取消返回
              </Button>
              <Button type="submit">
                保存监控配置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
