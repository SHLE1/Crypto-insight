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
    <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-border/30 last:border-0 last:pr-0 pb-3 sm:pb-0 sm:pr-6">
      <p className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold tracking-tight tabular-nums ${toneClassName ?? 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function SourceRow({ row }: { row: DetailRow }) {
  const priceStatusLabel = getPriceStatusLabel(row.priceStatus)
  const changeColor = getChangeColor(row.change24h)

  return (
    <div className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] items-center gap-x-4 border-b border-border/40 py-3 last:border-0">
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
    <div className={`overflow-hidden border-b border-border/40 last:border-0 transition-colors ${expanded ? 'bg-zinc-50/30 dark:bg-zinc-950/20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]' : 'hover:bg-muted/30'}`}>
      <button type="button" className="w-full p-4 lg:py-6 text-left outline-none" onClick={onToggle}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px] lg:grid-rows-[auto_auto]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="flex flex-wrap items-center gap-2">
              <CaretIcon size={14} weight="bold" className="shrink-0 text-muted-foreground" />
              <p className="truncate text-base font-semibold tracking-[-0.03em]">{row.title}</p>
              <Badge variant="secondary" className="text-[10px]">
                {row.badge}
              </Badge>
              {priceStatusLabel ? (
                <Badge variant="outline" className="text-[10px]">
                  {priceStatusLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground ml-6">{row.subtitle}</p>
          </div>
          <div className="grid gap-2 sm:gap-0 sm:grid-cols-3 sm:items-center lg:col-start-1 lg:row-start-2 mt-3 lg:mt-0 ml-0 lg:ml-6">
            <MetricBlock label="持仓" value={formatBalance(row.balance)} />
            <MetricBlock label="均价" value={formatCurrency(row.price)} />
            <MetricBlock label="24h" value={formatPercent(row.change24h)} toneClassName={getChangeColor(row.change24h)} />
          </div>
          <div className="lg:px-4 lg:py-0 text-left lg:col-start-2 lg:row-start-2 lg:flex lg:h-full lg:flex-col lg:justify-center lg:text-right mt-3 lg:mt-0 ml-0 lg:ml-6">
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">总市值</p>
            <p className="mt-1.5 text-2xl lg:text-3xl font-semibold tracking-tighter tabular-nums text-foreground">{formatCurrency(row.value)}</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">占组合 {share.toFixed(1)}%</p>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border/40 bg-muted/10 px-4 lg:px-10 pb-6 pt-4">
          <div className="mb-2 flex items-center gap-2.5 py-2.5">
            <div className="h-4 w-0.5 shrink-0 bg-foreground/20" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">{row.title}</p>
            <p className="text-[11px] text-muted-foreground tracking-widest">· {row.details.length} 来源</p>
          </div>
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
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-6 text-muted-foreground">
        {mode === 'token'
          ? '按代币查看，同一代币将汇总来自不同来源的持仓。'
          : mode === 'wallet'
            ? '按钱包查看，每项代表一个钱包或交易所账户。'
            : '按链查看，同一链上的资产将合并展示。'}
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
    <div className="col-span-full mt-2">
      <div className="gap-6 border-y border-border/40 pb-6 pt-5 px-4 sm:px-0">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold tracking-tight">明细工作台</h3>
            <p className="text-sm text-muted-foreground">支持搜索与筛选，可在代币、钱包、链三个视角间切换。</p>
          </div>
          <div className="grid gap-3 sm:gap-0 sm:grid-cols-3 sm:items-center">
            <MetricBlock label="平均单项" value={formatCurrency(analytics.averagePositionValue)} />
            <MetricBlock
              label="最大仓位"
              value={analytics.topHolding ? `${analytics.topHolding.symbol} ${analytics.topHolding.share.toFixed(1)}%` : '--'}
            />
            <MetricBlock
              label="价格异常"
              value={`${analytics.missingPriceCount + analytics.stalePriceCount} 个`}
              toneClassName={analytics.missingPriceCount + analytics.stalePriceCount > 0 ? 'text-foreground font-medium' : undefined}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between mt-6">
          <div className="relative w-full max-w-md">
            <MagnifyingGlass size={16} weight="regular" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索代币、钱包、交易所账户或链"
              className="pl-9 bg-muted/20 border-border/40 rounded-none h-10 shadow-none focus-visible:ring-0 focus-visible:border-border"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.key}
                type="button"
                size="sm"
                className="rounded-none shadow-none h-10 px-4 font-medium tracking-tight"
                variant={statusFilter === filter.key ? 'secondary' : 'outline'}
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-8 px-4 sm:px-0">
        <Tabs defaultValue="token" className="gap-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-6">
            <TabsList variant="line" className="grid w-full grid-cols-3 sm:w-fit bg-transparent gap-6">
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3" value="token">
                按代币
              </TabsTrigger>
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3" value="wallet">
                按钱包
              </TabsTrigger>
              <TabsTrigger className="w-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-3" value="chain">
                按链
              </TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="border-border/40 tracking-widest uppercase text-xs rounded-none bg-muted/10 pb-1">{data.length} 个代币条目</Badge>
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
