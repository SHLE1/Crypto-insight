'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDefiChainLabel, getDefiChainKeyFromEvmChainKey } from '@/lib/defi/chains'
import { EVM_CHAIN_OPTIONS } from '@/lib/evm-chains'
import { shortAddress, validateAddress } from '@/lib/validators'
import { useDefiStore } from '@/stores/defi'

interface ManualDefiSourcesProps {
  isFetching: boolean
  onRefresh: () => void
}

export function ManualDefiSources({ isFetching, onRefresh }: ManualDefiSourcesProps) {
  const manualSources = useDefiStore((state) => state.manualSources)
  const addManualSource = useDefiStore((state) => state.addManualSource)
  const removeManualSource = useDefiStore((state) => state.removeManualSource)
  const toggleManualSource = useDefiStore((state) => state.toggleManualSource)
  const [chainKey, setChainKey] = useState('bsc')
  const [contractAddress, setContractAddress] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  const normalizedContract = contractAddress.trim().toLowerCase()
  const normalizedChainKey = getDefiChainKeyFromEvmChainKey(chainKey)
  const existingSource = useMemo(
    () => manualSources.find((source) => source.chainKey === normalizedChainKey && source.contractAddress.toLowerCase() === normalizedContract),
    [manualSources, normalizedChainKey, normalizedContract]
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!validateAddress(normalizedContract, 'evm')) {
      setError('请输入有效的 EVM 合约地址。')
      return
    }

    if (existingSource) {
      setError('这个链和合约已经添加过。')
      return
    }

    addManualSource({
      id: `${normalizedChainKey}:${normalizedContract}`,
      chainKey: normalizedChainKey,
      contractAddress: normalizedContract,
      label: label.trim() || undefined,
      enabled: true,
      origin: 'manual',
    })
    setContractAddress('')
    setLabel('')
  }

  return (
    <div className="border-y sm:border sm:rounded-xl border-border/40 p-4 sm:p-6">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">手动补充</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            自动来源识别不到时，可按链和合约地址读取当前钱包的链上余额；API 成功识别且可本地化的来源也会自动固定到这里。价格缺失时只显示数量。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching} className="gap-2 shrink-0">
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <form className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_minmax(160px,220px)_auto]" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="manual-defi-chain">Chain</Label>
          <select
            id="manual-defi-chain"
            value={chainKey}
            onChange={(event) => setChainKey(event.target.value)}
            className="h-8 rounded-none border border-border/40 bg-background px-3 text-sm outline-none focus-visible:border-foreground"
          >
            {EVM_CHAIN_OPTIONS.map((chain) => (
              <option key={chain.key} value={chain.key}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="manual-defi-contract">CA</Label>
          <Input
            id="manual-defi-contract"
            value={contractAddress}
            onChange={(event) => setContractAddress(event.target.value)}
            placeholder="0x..."
            spellCheck={false}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="manual-defi-label">标签</Label>
          <Input id="manual-defi-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="可选" />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full gap-2 lg:w-auto">
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>
      </form>

      {error ? <p className="mt-3 text-xs text-muted-foreground">{error}</p> : null}

      {manualSources.length > 0 ? (
        <div className="mt-5 divide-y divide-border/30 border-t border-border/40">
          {manualSources.map((source) => (
            <div key={source.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{source.label || shortAddress(source.contractAddress)}</p>
                  <Badge variant={source.enabled ? 'secondary' : 'outline'}>{source.enabled ? '启用' : '暂停'}</Badge>
                  {source.origin === 'api' ? <Badge variant="outline">自动固定</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDefiChainLabel(source.chainKey)} · {shortAddress(source.contractAddress)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => toggleManualSource(source.id)}>
                  {source.enabled ? '暂停' : '启用'}
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={() => removeManualSource(source.id)} aria-label="删除手动来源">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
