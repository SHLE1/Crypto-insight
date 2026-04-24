'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  if (change24h === null) return 'text-muted-foreground/50'
  return change24h < 0 ? 'text-muted-foreground' : 'text-foreground'
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

function SourceRow({ row }: { row: DetailRow }) {
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)
  const changeColor = getChangeColor(row.change24h)

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] items-center gap-x-4 border-b border-border/40 py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-base font-semibold">{row.title}</span>
          {priceStatusLabel ? (
            <Badge variant="outline" className="text-[10px]">{priceStatusLabel}</Badge>
          ) : null}
          {row.meta ? (
            <span className="rounded bg-muted/70 px-1.5 py-px text-[10px] text-muted-foreground">{row.meta}</span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{row.subtitle}</p>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">持仓</p>
        <p className="tabular-nums text-xs font-medium">{formatBalance(row.balance)}</p>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">单价</p>
        <p className="tabular-nums text-xs font-medium">{formatCurrency(row.price)}</p>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">市值</p>
        <p className={`tabular-nums text-xs font-semibold ${changeColor}`}>{formatCurrency(row.value)}</p>
        <p className={`text-[10px] ${changeColor}`}>{formatPercent(row.change24h)}</p>
      </div>
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

  const CaretIcon = expanded ? CaretDown : CaretRight

  return (
    <div className={`overflow-hidden transition-colors border-l-2 ${expanded ? 'bg-muted/30 border-l-foreground/25' : 'border-l-transparent hover:bg-muted/10'}`}>
      <button type="button" className="w-full px-4 py-3 text-left outline-none" onClick={onToggle}>
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,auto)] items-center gap-x-8">
          {/* 名称列 */}
          <div className="flex items-center gap-2 min-w-0">
            <CaretIcon size={12} weight="bold" className="shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-semibold tracking-tight">{row.title}</span>
            <Badge variant="secondary" className="text-[10px] shrink-0">{row.badge}</Badge>
            {priceStatusLabel ? (
              <Badge variant="outline" className="text-[10px] shrink-0">{priceStatusLabel}</Badge>
            ) : null}
            {row.subtitle && row.subtitle.toLowerCase() !== row.title.split('·')[0].trim().toLowerCase() ? (
              <span className="hidden lg:inline text-xs text-muted-foreground truncate">{row.subtitle}</span>
            ) : null}
          </div>
          {/* 持仓 */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground">持仓</p>
            <p className="text-sm font-medium tabular-nums">{formatBalance(row.balance)}</p>
          </div>
          {/* 均价 */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground">均价</p>
            <p className="text-sm font-medium tabular-nums">{formatCurrency(row.price)}</p>
          </div>
          {/* 24h */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground">24H</p>
            <p className={`text-sm font-medium tabular-nums ${getChangeColor(row.change24h)}`}>{formatPercent(row.change24h)}</p>
          </div>
          {/* 总市值 */}
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatCurrency(row.value)}</p>
            <p className="text-[10px] text-muted-foreground">{share.toFixed(1)}%</p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border/40 bg-muted/20 px-4 lg:px-8 pb-3 pt-2">
          <div className="flex flex-col gap-1">
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
      badge: `${holding.sourceCount} 个来源`,
      details: (holding.sources ?? []).map((source, index) => ({
        key: `${holding.assetId}-${source.sourceId}-${source.chainLabel ?? 'unknown'}-${index}`,
        title: source.sourceLabel,
        subtitle: source.sourceType === 'cex' ? '交易所账户' : '钱包地址',
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
          subtitle: position.sourceType === 'cex' ? '交易所账户' : '钱包地址',
          balance: position.balance,
          price: getGroupPrice(position.value, position.balance),
          value: position.value,
          change24h: position.change24h,
          priceStatus: position.priceStatus,
          badge: `${position.sourceType === 'cex' ? '交易所账户' : '钱包地址'}`,
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
        badge: `${group.details.length} 个资产`,
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
    return <p className="text-sm leading-7 text-muted-foreground">当前筛选条件下没有匹配的资产。</p>
  }

  return (
    <div className="flex flex-col">
      <p className="text-xs pb-3 leading-6 text-muted-foreground">
        {mode === 'token'
          ? '按代币查看，同一代币将汇总来自不同来源的持仓。'
          : mode === 'wallet'
            ? '按钱包查看，每项代表一个钱包或交易所账户。'
            : '按链查看，同一链上的资产将合并展示。'}
      </p>
      <div className="divide-y divide-border/40">
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
    <div className="col-span-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight">明细工作台</h3>
          <p className="text-xs text-muted-foreground">支持搜索与筛选，可在代币、钱包、链三个视角间切换。</p>
        </div>
        <div className="flex items-center gap-6 text-sm shrink-0">
          <div>
            <span className="muted-kicker block">平均单项</span>
            <span className="font-medium tabular-nums">{formatCurrency(analytics.averagePositionValue)}</span>
          </div>
          <div>
            <span className="muted-kicker block">价格异常</span>
            <span className={`font-medium tabular-nums ${analytics.missingPriceCount + analytics.stalePriceCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
              {analytics.missingPriceCount + analytics.stalePriceCount} 个
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 pb-4 border-b border-border/40">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass size={15} weight="regular" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索代币、钱包、交易所账户或链"
            className="pl-9 bg-transparent border-border/40 rounded-lg h-9 shadow-none text-sm focus-visible:ring-0 focus-visible:border-border"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              size="sm"
              className="rounded-lg shadow-none h-8 px-3 text-xs font-medium"
              variant={statusFilter === filter.key ? 'secondary' : 'ghost'}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="pt-5">
        <Tabs defaultValue="token" className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <TabsList variant="line" className="grid w-full grid-cols-3 sm:w-fit bg-transparent gap-6">
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-2.5 text-sm" value="token">
                按代币
              </TabsTrigger>
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-2.5 text-sm" value="wallet">
                按钱包
              </TabsTrigger>
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-2.5 text-sm" value="chain">
                按链
              </TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground">{data.length} 个代币条目</span>
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
        <p className="mt-8 pt-4 border-t border-border/40 text-xs leading-6 text-muted-foreground mb-4">
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
      </div>
    </div>
  )
}
