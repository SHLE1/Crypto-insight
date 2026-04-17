'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercent } from '@/lib/validators'
import type { HoldingRow, PortfolioAnalytics, PriceStatus } from '@/types'

interface HoldingsOverviewProps {
  data: HoldingRow[]
  analytics: PortfolioAnalytics
  totalValue: number
}

type GroupMode = 'token' | 'wallet' | 'chain'
type StatusFilter = 'all' | 'live' | 'issues' | 'missing' | 'stale'

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

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'issues', label: '只看异常' },
  { key: 'missing', label: '缺价格' },
  { key: 'stale', label: '旧价格' },
  { key: 'live', label: '价格正常' },
]

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

function matchesStatusFilter(row: GroupRow, filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'issues') return row.priceStatus !== 'live'
  return row.priceStatus === filter
}

function getRowSearchText(row: GroupRow) {
  return [
    row.title,
    row.subtitle,
    row.badge,
    ...row.details.flatMap((detail) => [detail.title, detail.subtitle, detail.meta ?? '']),
  ]
    .join(' ')
    .toLowerCase()
}

function MetricBlock({
  label,
  value,
  toneClassName,
}: {
  label: string
  value: string
  toneClassName?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium tabular-nums ${toneClassName ?? 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function SourceRow({ row }: { row: DetailRow }) {
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)

  return (
    <div className="grid gap-3 rounded-xl border border-border/60 bg-background/80 p-3 md:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{row.title}</span>
          {priceStatusLabel ? (
            <Badge variant="outline" className="rounded-full text-[10px]">
              {priceStatusLabel}
            </Badge>
          ) : null}
          {row.meta ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{row.meta}</span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{row.subtitle}</p>
      </div>
      <MetricBlock label="持仓" value={formatBalance(row.balance)} />
      <MetricBlock label="单价" value={formatCurrency(row.price)} />
      <MetricBlock label="市值 / 24h" value={`${formatCurrency(row.value)} · ${formatPercent(row.change24h)}`} toneClassName={getChangeColor(row.change24h)} />
    </div>
  )
}

function GroupCard({
  row,
  totalValue,
  expanded,
  onToggle,
}: {
  row: GroupRow
  totalValue: number
  expanded: boolean
  onToggle: () => void
}) {
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)
  const share = totalValue > 0 ? (row.value / totalValue) * 100 : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80">
      <button type="button" className="w-full p-4 text-left transition-colors hover:bg-muted/10" onClick={onToggle}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <p className="truncate text-base font-semibold">{row.title}</p>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {row.badge}
              </Badge>
              {priceStatusLabel ? (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {priceStatusLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{row.subtitle}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <MetricBlock label="持仓" value={formatBalance(row.balance)} />
              <MetricBlock label="均价" value={formatCurrency(row.price)} />
              <MetricBlock label="24h" value={formatPercent(row.change24h)} toneClassName={getChangeColor(row.change24h)} />
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-right">
            <p className="text-[11px] text-muted-foreground">总市值</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{formatCurrency(row.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">占组合 {share.toFixed(1)}%</p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border/50 bg-muted/15 px-4 py-4">
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
      const existing = walletMap.get(key)

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
    const detailKey = `${position.chainLabel}-${position.symbol}`
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
            key: detailKey,
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

    const detail = existing.details.find((item) => item.key === detailKey)
    if (detail) {
      detail.balance += position.balance
      detail.value += position.value
      detail.price = getGroupPrice(detail.value, detail.balance)
      detail.priceStatus = mergePriceStatus(detail.priceStatus, position.priceStatus)
      detail.meta = undefined
    } else {
      existing.details.push({
        key: detailKey,
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
        }))
        .sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value)
}

function GroupedHoldingsView({
  rows,
  mode,
  totalValue,
}: {
  rows: GroupRow[]
  mode: GroupMode
  totalValue: number
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(rows[0]?.key ?? null)
  const activeKey = expandedKey !== null && rows.some((row) => row.key === expandedKey) ? expandedKey : null

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">当前筛选条件下没有可展示的资产。</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {mode === 'token'
          ? '按代币查看时，同一代币会合并不同来源的持仓。'
          : mode === 'wallet'
            ? '按钱包查看时，每张卡代表一个钱包或交易所账户。'
            : '按链查看时，会把同一条链上的资产合并展示。'}
      </p>
      {rows.map((row) => (
        <GroupCard
          key={row.key}
          row={row}
          totalValue={totalValue}
          expanded={activeKey === row.key}
          onToggle={() => setExpandedKey((current) => (current === row.key ? null : row.key))}
        />
      ))}
    </div>
  )
}

export function HoldingsOverview({ data, analytics, totalValue }: HoldingsOverviewProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const groupedData = useMemo(
    () => ({
      token: buildGroupedRows(data, 'token'),
      wallet: buildGroupedRows(data, 'wallet'),
      chain: buildGroupedRows(data, 'chain'),
    }),
    [data]
  )

  const filteredData = useMemo(() => {
    const filterRows = (rows: GroupRow[]) =>
      rows.filter((row) => {
        const matchesQuery = deferredQuery ? getRowSearchText(row).includes(deferredQuery) : true
        return matchesQuery && matchesStatusFilter(row, statusFilter)
      })

    return {
      token: filterRows(groupedData.token),
      wallet: filterRows(groupedData.wallet),
      chain: filterRows(groupedData.chain),
    }
  }, [deferredQuery, groupedData, statusFilter])

  return (
    <Card className="col-span-full">
      <CardHeader className="gap-4 border-b border-border/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">资产明细</CardTitle>
            <p className="text-xs text-muted-foreground">支持搜索、筛选，并按代币、按钱包、按链切换视角。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MetricBlock label="平均单项" value={formatCurrency(analytics.averagePositionValue)} />
            <MetricBlock
              label="最大仓位"
              value={analytics.topHolding ? `${analytics.topHolding.symbol} ${analytics.topHolding.share.toFixed(1)}%` : '--'}
            />
            <MetricBlock
              label="价格异常"
              value={`${analytics.missingPriceCount + analytics.stalePriceCount} 项`}
              toneClassName={analytics.missingPriceCount + analytics.stalePriceCount > 0 ? 'text-amber-500' : undefined}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索代币、钱包、交易所或链"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.key}
                type="button"
                size="sm"
                variant={statusFilter === filter.key ? 'secondary' : 'outline'}
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="token" className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList variant="line" className="grid w-full grid-cols-3 sm:w-fit">
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
            <Badge variant="secondary">{data.length} 项代币</Badge>
          </div>
          <TabsContent className="mt-0" value="token">
            <GroupedHoldingsView rows={filteredData.token} mode="token" totalValue={totalValue} />
          </TabsContent>
          <TabsContent className="mt-0" value="wallet">
            <GroupedHoldingsView rows={filteredData.wallet} mode="wallet" totalValue={totalValue} />
          </TabsContent>
          <TabsContent className="mt-0" value="chain">
            <GroupedHoldingsView rows={filteredData.chain} mode="chain" totalValue={totalValue} />
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
