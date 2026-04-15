'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercent } from '@/lib/validators'

interface SourceDetail {
  sourceId: string
  sourceType: 'wallet' | 'cex'
  sourceLabel: string
  balance: number
  chainLabel?: string
}

interface HoldingRow {
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  sourceCount: number
  sources?: SourceDetail[]
}

interface HoldingsOverviewProps {
  data: HoldingRow[]
}

type GroupMode = 'token' | 'wallet' | 'chain'

interface DetailRow {
  key: string
  title: string
  subtitle: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  meta?: string
}

interface GroupRow {
  key: string
  title: string
  subtitle: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  badge: string
  details: DetailRow[]
}

interface PositionRow {
  tokenKey: string
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  sourceId: string
  sourceType: 'wallet' | 'cex'
  sourceLabel: string
  chainLabel: string
}

function formatBalance(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 })
}

function getWeightedChange(positions: Array<{ value: number; change24h: number | null }>) {
  const base = positions.reduce((sum, position) => sum + position.value, 0)
  if (base <= 0) return null

  const weighted = positions.reduce((sum, position) => {
    if (position.change24h === null) return sum
    return sum + position.value * (position.change24h / 100)
  }, 0)

  return (weighted / base) * 100
}

function getGroupPrice(value: number, balance: number) {
  if (value <= 0 || balance <= 0) {
    return null
  }

  return value / balance
}

function SourceRow({ row }: { row: DetailRow }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5 pl-4 text-xs text-muted-foreground">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {row.meta ? (
            <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0.5 text-[10px]">{row.meta}</span>
          ) : null}
          <span className="truncate">{row.title}</span>
        </div>
        <p className="truncate text-[11px] text-muted-foreground/80">{row.subtitle}</p>
      </div>
      <span className="shrink-0 font-mono tabular-nums">{formatBalance(row.balance)}</span>
      <span className="w-20 shrink-0 text-right font-mono tabular-nums">
        {formatCurrency(row.value)}
      </span>
    </div>
  )
}

function GroupCard({
  row,
  expanded,
  onToggle,
}: {
  row: GroupRow
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <div
        className="grid cursor-pointer gap-2 rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/30 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] md:items-center md:gap-4"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <p className="font-medium">{row.title}</p>
            <Badge variant="outline" className="text-[10px]">
              {row.badge}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
        </div>
        <div className="flex items-center justify-between text-sm md:block md:text-right">
          <span className="text-muted-foreground md:hidden">持仓</span>
          <span>{formatBalance(row.balance)}</span>
        </div>
        <div className="flex items-center justify-between text-sm md:block md:text-right">
          <span className="text-muted-foreground md:hidden">单价</span>
          <span>{formatCurrency(row.price)}</span>
        </div>
        <div className="flex items-center justify-between text-sm md:block md:text-right">
          <span className="text-muted-foreground md:hidden">市值</span>
          <span className="font-medium">{formatCurrency(row.value)}</span>
        </div>
        <div className="flex items-center justify-between text-sm md:block md:text-right">
          <span className="text-muted-foreground md:hidden">24h</span>
          <span className={row.change24h !== null && row.change24h < 0 ? 'text-red-500' : 'text-green-500'}>
            {formatPercent(row.change24h)}
          </span>
        </div>
      </div>

      {expanded ? (
        <div className="mt-1 ml-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-3 px-4 py-1 text-[10px] text-muted-foreground/70">
            <span>明细</span>
            <span className="shrink-0">持仓</span>
            <span className="w-20 shrink-0 text-right">市值</span>
          </div>
          {row.details.map((detail) => (
            <SourceRow key={detail.key} row={detail} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function buildGroupedRows(data: HoldingRow[], mode: GroupMode) {
  const positions: PositionRow[] = data.flatMap((holding) => {
    if (!holding.sources || holding.sources.length === 0) {
      return []
    }

    return holding.sources.map((source, index) => ({
      tokenKey: `${holding.symbol}-${source.sourceId}-${source.chainLabel ?? 'unknown'}-${index}`,
      symbol: holding.symbol,
      name: holding.name,
      balance: source.balance,
      price: holding.price,
      value: holding.price !== null ? source.balance * holding.price : 0,
      change24h: holding.change24h,
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      sourceLabel: source.sourceLabel,
      chainLabel: source.chainLabel ?? '未知链',
    }))
  })

  if (mode === 'token') {
    return data.map((holding) => ({
      key: holding.symbol,
      title: holding.symbol,
      subtitle: holding.name,
      balance: holding.balance,
      price: holding.price,
      value: holding.value,
      change24h: holding.change24h,
      badge: `${holding.sourceCount} 来源`,
      details: (holding.sources ?? []).map((source, index) => ({
        key: `${holding.symbol}-${source.sourceId}-${source.chainLabel ?? 'unknown'}-${index}`,
        title: source.sourceLabel,
        subtitle: source.sourceType === 'cex' ? '交易所账户' : '钱包',
        balance: source.balance,
        price: holding.price,
        value: holding.price !== null ? source.balance * holding.price : 0,
        change24h: holding.change24h,
        meta: source.chainLabel,
      })),
    }))
  }

  if (mode === 'wallet') {
    const walletMap = new Map<string, GroupRow>()

    positions.forEach((position) => {
      const key = `${position.sourceType}:${position.sourceId}`
      const existing = walletMap.get(key)
      const detail: DetailRow = {
        key: position.tokenKey,
        title: position.symbol,
        subtitle: position.name,
        balance: position.balance,
        price: position.price,
        value: position.value,
        change24h: position.change24h,
        meta: position.chainLabel,
      }

      if (existing) {
        existing.balance += position.balance
        existing.value += position.value
        existing.details.push(detail)
      } else {
        walletMap.set(key, {
          key,
          title: position.sourceLabel,
          subtitle: position.sourceType === 'cex' ? '交易所账户' : '钱包',
          balance: position.balance,
          price: getGroupPrice(position.value, position.balance),
          value: position.value,
          change24h: position.change24h,
          badge: `${position.sourceType === 'cex' ? '交易所' : '钱包'}`,
          details: [detail],
        })
      }
    })

    return Array.from(walletMap.values())
      .map((group) => ({
        ...group,
        price: getGroupPrice(group.value, group.balance),
        change24h: getWeightedChange(group.details),
        badge: `${group.details.length} 资产`,
        details: group.details.sort((a, b) => b.value - a.value),
      }))
      .sort((a, b) => b.value - a.value)
  }

  const chainMap = new Map<string, GroupRow>()

  positions.forEach((position) => {
    const key = position.chainLabel
    const existing = chainMap.get(key)

    if (!existing) {
      chainMap.set(key, {
        key,
        title: position.chainLabel,
        subtitle: position.chainLabel === 'CEX' ? '未归属到单条链的交易所资产' : '链上资产',
        balance: position.balance,
        price: getGroupPrice(position.value, position.balance),
        value: position.value,
        change24h: position.change24h,
        badge: '1 资产',
        details: [
          {
            key: `${position.chainLabel}-${position.symbol}`,
            title: position.symbol,
            subtitle: position.name,
            balance: position.balance,
            price: position.price,
            value: position.value,
            change24h: position.change24h,
            meta: position.sourceLabel,
          },
        ],
      })
      return
    }

    existing.balance += position.balance
    existing.value += position.value

    const detail = existing.details.find((item) => item.title === position.symbol)
    if (detail) {
      detail.balance += position.balance
      detail.value += position.value
      detail.subtitle = position.name
      detail.meta = undefined
    } else {
      existing.details.push({
        key: `${position.chainLabel}-${position.symbol}`,
        title: position.symbol,
        subtitle: position.name,
        balance: position.balance,
        price: position.price,
        value: position.value,
        change24h: position.change24h,
        meta: position.sourceLabel,
      })
    }
  })

  return Array.from(chainMap.values())
    .map((group) => ({
      ...group,
      price: getGroupPrice(group.value, group.balance),
      change24h: getWeightedChange(group.details),
      badge: `${group.details.length} 资产`,
      details: group.details
        .map((detail) => ({
          ...detail,
          price: getGroupPrice(detail.value, detail.balance),
          change24h: detail.change24h,
        }))
        .sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value)
}

function GroupedHoldingsView({ rows, mode }: { rows: GroupRow[]; mode: GroupMode }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(rows[0]?.key ?? null)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">还没有可展示的资产明细</p>
  }

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] gap-4 text-xs text-muted-foreground md:grid">
        <span>
          {mode === 'token' ? '资产' : mode === 'wallet' ? '钱包 / 账户' : '链'}
        </span>
        <span className="text-right">持仓</span>
        <span className="text-right">单价</span>
        <span className="text-right">市值</span>
        <span className="text-right">24h</span>
      </div>
      {rows.map((row) => (
        <GroupCard
          key={row.key}
          row={row}
          expanded={expandedKey === row.key}
          onToggle={() => setExpandedKey((current) => (current === row.key ? null : row.key))}
        />
      ))}
    </div>
  )
}

export function HoldingsOverview({ data }: HoldingsOverviewProps) {
  const groupedData = useMemo(
    () => ({
      token: buildGroupedRows(data, 'token'),
      wallet: buildGroupedRows(data, 'wallet'),
      chain: buildGroupedRows(data, 'chain'),
    }),
    [data]
  )

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">资产明细</CardTitle>
          <p className="text-xs text-muted-foreground">支持按代币、按钱包、按链查看同一份资产数据</p>
        </div>
        <Badge variant="secondary">{data.length} 项代币</Badge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="token" className="gap-4">
          <TabsList>
            <TabsTrigger value="token">按代币</TabsTrigger>
            <TabsTrigger value="wallet">按钱包</TabsTrigger>
            <TabsTrigger value="chain">按链</TabsTrigger>
          </TabsList>
          <TabsContent value="token">
            <GroupedHoldingsView rows={groupedData.token} mode="token" />
          </TabsContent>
          <TabsContent value="wallet">
            <GroupedHoldingsView rows={groupedData.wallet} mode="wallet" />
          </TabsContent>
          <TabsContent value="chain">
            <GroupedHoldingsView rows={groupedData.chain} mode="chain" />
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-xs text-muted-foreground">
          主流资产价格来自{' '}
          <a
            href="https://developers.binance.com/docs/zh-CN/binance-spot-api-docs/rest-api/market-data-endpoints"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Binance
          </a>
          ，部分 Solana 代币价格仍来自{' '}
          <a
            href="https://www.coingecko.com/en/api?utm_source=crypto-insight&utm_medium=referral"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            CoinGecko
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
