'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

function SourceRow({ source, parentPrice }: { source: SourceDetail; parentPrice: number | null }) {
  const value = parentPrice !== null ? source.balance * parentPrice : null
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs text-muted-foreground py-1.5 pl-4">
      <div className="min-w-0 flex items-center gap-2">
        {source.chainLabel && (
          <span className="shrink-0 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">
            {source.chainLabel}
          </span>
        )}
        <span className="truncate">{source.sourceLabel}</span>
      </div>
      <span className="font-mono tabular-nums shrink-0">
        {source.balance.toLocaleString('en-US', { maximumFractionDigits: 8 })}
      </span>
      <span className="font-mono tabular-nums shrink-0 w-20 text-right">
        {value !== null ? formatCurrency(value) : '—'}
      </span>
    </div>
  )
}

export function HoldingsOverview({ data }: HoldingsOverviewProps) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  const toggleExpand = (symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol))
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">资产明细</CardTitle>
        <Badge variant="secondary">{data.length} 项</Badge>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有可展示的资产明细</p>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] gap-4 text-xs text-muted-foreground md:grid">
              <span>资产</span>
              <span className="text-right">持仓</span>
              <span className="text-right">单价</span>
              <span className="text-right">市值</span>
              <span className="text-right">24h</span>
            </div>
            {data.map((asset) => {
              const isExpanded = expandedSymbol === asset.symbol
              const hasSources = asset.sources && asset.sources.length > 0

              return (
                <div key={asset.symbol}>
                  <div
                    className="grid gap-2 rounded-lg border border-border/70 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr] md:items-center md:gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => hasSources && toggleExpand(asset.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {hasSources ? (
                          isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        <p className="font-medium">{asset.symbol}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {asset.sourceCount} 来源
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">持仓</span>
                      <span>{asset.balance.toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">单价</span>
                      <span>{formatCurrency(asset.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">市值</span>
                      <span className="font-medium">{formatCurrency(asset.value)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">24h</span>
                      <span className={asset.change24h !== null && asset.change24h < 0 ? 'text-red-500' : 'text-green-500'}>
                        {formatPercent(asset.change24h)}
                      </span>
                    </div>
                  </div>

                  {isExpanded && hasSources && (
                    <div className="mt-1 ml-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                      <div className="hidden grid-cols-[1fr_auto_auto] gap-3 text-[10px] text-muted-foreground/70 px-4 py-1">
                        <span>来源</span>
                        <span className="shrink-0">持仓</span>
                        <span className="shrink-0 w-20 text-right">市值</span>
                      </div>
                      {asset.sources!.map((source, idx) => (
                        <SourceRow
                          key={`${source.sourceId}${source.chainLabel ?? ''}-${idx}`}
                          source={source}
                          parentPrice={asset.price}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground">
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
        )}
      </CardContent>
    </Card>
  )
}
