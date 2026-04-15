'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercent } from '@/lib/validators'
import type { PriceStatus } from '@/types'

interface SourceDetail {
  sourceId: string
  sourceType: 'wallet' | 'cex'
  sourceLabel: string
  assetId?: string
  balance: number
  chainLabel?: string
}

interface HoldingRow {
  assetId: string
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  priceStatus: PriceStatus
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
  priceStatus: PriceStatus
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
  priceStatus: PriceStatus
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
  priceStatus: PriceStatus
  sourceId: string
  sourceType: 'wallet' | 'cex'
  sourceLabel: string
  chainLabel: string
}

function getPriceStatusRank(status: PriceStatus) {
  if (status === 'missing') return 2
  if (status === 'stale') return 1
  return 0
}

function mergePriceStatus(current: PriceStatus, next: PriceStatus) {
  return getPriceStatusRank(next) > getPriceStatusRank(current) ? next : current
}

function getPriceStatusLabel(status: PriceStatus) {
  if (status === 'stale') return '旧价'
  if (status === 'missing') return '缺价'
  return null
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

function getChangeColor(change24h: number | null) {
  if (change24h === null) return 'text-muted-foreground'
  return change24h < 0 ? 'text-red-500' : 'text-emerald-600'
}

function MetricBlock({
  label,
  value,
  emphasis = false,
  toneClassName,
}: {
  label: string
  value: string
  emphasis?: boolean
  toneClassName?: string
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={[
          'mt-1 font-mono tabular-nums text-sm',
          emphasis ? 'font-semibold text-foreground' : 'text-foreground',
          toneClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function SourceRow({ row }: { row: DetailRow }) {
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)
  return (
    <div className="rounded-lg border border-border/40 bg-background/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{row.title}</span>
            {priceStatusLabel ? (
              <Badge variant="outline" className="rounded-full text-[10px]">
                {priceStatusLabel}
              </Badge>
            ) : null}
            {row.meta ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {row.meta}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{row.subtitle}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium ${getChangeColor(row.change24h)}`}>
          {formatPercent(row.change24h)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        <MetricBlock label="持仓" value={formatBalance(row.balance)} />
        <MetricBlock label="单价" value={formatCurrency(row.price)} />
        <MetricBlock label="市值" value={formatCurrency(row.value)} emphasis />
      </div>
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
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70">
      <button
        type="button"
        className="w-full p-4 text-left transition-colors hover:bg-muted/20"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <p className="truncate font-medium">{row.title}</p>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {row.badge}
              </Badge>
              {priceStatusLabel ? (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {priceStatusLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{row.subtitle}</p>
          </div>
          <span className={`shrink-0 text-sm font-medium ${getChangeColor(row.change24h)}`}>
            {formatPercent(row.change24h)}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MetricBlock label="持仓" value={formatBalance(row.balance)} />
          <MetricBlock label="单价" value={formatCurrency(row.price)} />
          <MetricBlock label="市值" value={formatCurrency(row.value)} emphasis />
          <MetricBlock
            label="24h"
            value={formatPercent(row.change24h)}
            toneClassName={getChangeColor(row.change24h)}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">来源明细</p>
            <p className="text-[11px] text-muted-foreground">{row.details.length} 项</p>
          </div>
          <div className="space-y-2">
            {row.details.map((detail) => (
              <SourceRow key={detail.key} row={detail} />
            ))}
          </div>
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
      tokenKey: `${holding.assetId}-${source.sourceId}-${source.chainLabel ?? 'unknown'}-${index}`,
      symbol: holding.symbol,
      name: holding.name,
      balance: source.balance,
      price: holding.price,
      value: holding.price !== null ? source.balance * holding.price : 0,
      change24h: holding.change24h,
      priceStatus: holding.priceStatus,
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
      priceStatus: holding.priceStatus,
      badge: `${holding.sourceCount} 来源`,
      details: (holding.sources ?? []).map((source, index) => ({
        key: `${holding.assetId}-${source.sourceId}-${source.chainLabel ?? 'unknown'}-${index}`,
        title: source.sourceLabel,
        subtitle: source.sourceType === 'cex' ? '交易所账户' : '钱包',
        balance: source.balance,
        price: holding.price,
        value: holding.price !== null ? source.balance * holding.price : 0,
        change24h: holding.change24h,
        priceStatus: holding.priceStatus,
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
        priceStatus: position.priceStatus,
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
          priceStatus: position.priceStatus,
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
        priceStatus: group.details.reduce<PriceStatus>(
          (status, detail) => mergePriceStatus(status, detail.priceStatus),
          'live'
        ),
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
        priceStatus: position.priceStatus,
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
            priceStatus: position.priceStatus,
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
        detail.priceStatus = mergePriceStatus(detail.priceStatus, position.priceStatus)
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
          priceStatus: position.priceStatus,
          meta: position.sourceLabel,
        })
      }
  })

  return Array.from(chainMap.values())
    .map((group) => ({
      ...group,
        price: getGroupPrice(group.value, group.balance),
        change24h: getWeightedChange(group.details),
        priceStatus: group.details.reduce<PriceStatus>(
          (status, detail) => mergePriceStatus(status, detail.priceStatus),
          'live'
        ),
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
  const activeKey = expandedKey && rows.some((row) => row.key === expandedKey) ? expandedKey : (rows[0]?.key ?? null)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">还没有可展示的资产明细</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {mode === 'token'
          ? '同一代币会合并展示不同来源的持仓。'
          : mode === 'wallet'
            ? '每张卡代表一个钱包或交易所账户。'
            : '每张卡代表一条链上的聚合资产。'}
      </p>
      {rows.map((row) => (
        <GroupCard
          key={row.key}
          row={row}
          expanded={activeKey === row.key}
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
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-fit">
            <TabsTrigger className="w-full" value="token">
              按代币
            </TabsTrigger>
            <TabsTrigger className="w-full" value="wallet">
              按钱包
            </TabsTrigger>
            <TabsTrigger className="w-full" value="chain">
              按链
            </TabsTrigger>
          </TabsList>
          <TabsContent className="mt-0" value="token">
            <GroupedHoldingsView rows={groupedData.token} mode="token" />
          </TabsContent>
          <TabsContent className="mt-0" value="wallet">
            <GroupedHoldingsView rows={groupedData.wallet} mode="wallet" />
          </TabsContent>
          <TabsContent className="mt-0" value="chain">
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
