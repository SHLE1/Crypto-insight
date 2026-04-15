'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWalletStore } from '@/stores/wallets'
import { validateAddress, getChainLabel } from '@/lib/validators'
import type { ChainType } from '@/types'
import { toast } from 'sonner'

const CHAIN_OPTIONS: ChainType[] = ['evm', 'solana', 'btc']

export default function AddWalletPage() {
  const router = useRouter()
  const addWallet = useWalletStore((s) => s.addWallet)

  const [chainType, setChainType] = useState<ChainType>('evm')
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

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

    addWallet({
      id: crypto.randomUUID(),
      name: name.trim(),
      chainType,
      address: trimmed,
      enabled: true,
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
