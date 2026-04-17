import { EVM_CHAINS } from '@/lib/evm-chains'
import { getChainLabel } from '@/lib/validators'
import type {
  HoldingRow,
  PortfolioAnalytics,
  PortfolioHistoryPoint,
  PortfolioSnapshot,
  PriceStatus,
} from '@/types'

function getPriceStatusRank(status: PriceStatus | undefined) {
  if (status === 'missing') return 2
  if (status === 'stale') return 1
  return 0
}

function mergePriceStatus(current: PriceStatus | undefined, next: PriceStatus | undefined): PriceStatus {
  return getPriceStatusRank(next) > getPriceStatusRank(current) ? (next ?? 'live') : (current ?? 'live')
}

function getAssetChainLabel(chainKey?: string) {
  if (!chainKey) return null
  if (chainKey in EVM_CHAINS) {
    return EVM_CHAINS[chainKey]?.name ?? chainKey
  }
  if (chainKey === 'solana' || chainKey === 'btc' || chainKey === 'evm') {
    return getChainLabel(chainKey)
  }
  return chainKey
}

function getAssetDisplayName(snapshot: PortfolioSnapshot, asset: PortfolioSnapshot['assets'][number]) {
  if (snapshot.sourceType === 'cex') {
    return asset.symbol
  }

  const chainLabel = getAssetChainLabel(asset.chainKey)
  return chainLabel ? `${asset.symbol} · ${chainLabel}` : asset.symbol
}

export function buildHoldingsData({
  snapshots,
  hideSmallAssets,
  walletNameMap,
  cexLabelMap,
  walletChainLabelMap,
}: {
  snapshots: Record<string, PortfolioSnapshot>
  hideSmallAssets: boolean
  walletNameMap: Map<string, string>
  cexLabelMap: Map<string, string>
  walletChainLabelMap: Map<string, string | null>
}): {
  holdingsData: HoldingRow[]
  totalValue: number
  change24hValue: number
  change24hPercent: number
  assetData: { name: string; value: number }[]
  walletTotal: number
  cexTotal: number
} {
  let total = 0
  let weightedChange = 0
  const assetMap = new Map<string, number>()
  const holdingsMap = new Map<
    string,
    {
      assetId: string
      symbol: string
      name: string
      balance: number
      price: number | null
      value: number
      change24h: number | null
      priceStatus: PriceStatus
      sources: Array<{ sourceId: string; sourceType: 'wallet' | 'cex'; sourceLabel: string; balance: number; chainKey?: string }>
    }
  >()
  let wTotal = 0
  let cTotal = 0

  Object.values(snapshots).forEach((snap) => {
    total += snap.totalValue
    if (snap.sourceType === 'wallet') wTotal += snap.totalValue
    else cTotal += snap.totalValue

    snap.assets.forEach((a) => {
      const assetKey = a.assetId ?? `${snap.source}:${a.symbol}`
      const displaySymbol = getAssetDisplayName(snap, a)

      assetMap.set(displaySymbol, (assetMap.get(displaySymbol) ?? 0) + (a.value ?? 0))
      if (a.value && a.change24h !== null) {
        weightedChange += a.value * (a.change24h / 100)
      }

      const sourceLabel = snap.sourceType === 'wallet'
        ? (walletNameMap.get(snap.source) ?? snap.source)
        : (cexLabelMap.get(snap.source) ?? snap.source)

      const buildSourceDetails = () => {
        if (a._chainBreakdowns && a._chainBreakdowns.length > 0) {
          return a._chainBreakdowns
            .filter((c) => c.balance > 0)
            .map((c) => ({
              sourceId: snap.source,
              sourceType: snap.sourceType,
              sourceLabel,
              assetId: a.assetId,
              balance: c.balance,
              chainKey: c.chainKey,
            }))
        }
        return [{
          sourceId: snap.source,
          sourceType: snap.sourceType,
          sourceLabel,
          assetId: a.assetId,
          balance: a.balance,
        }]
      }

      const existing = holdingsMap.get(assetKey)
      if (existing) {
        existing.balance += a.balance
        existing.value += a.value ?? 0
        existing.price = a.price ?? existing.price
        existing.change24h = a.change24h ?? existing.change24h
        existing.priceStatus = mergePriceStatus(existing.priceStatus, a.priceStatus)
        existing.sources.push(...buildSourceDetails())
      } else {
        holdingsMap.set(assetKey, {
          assetId: assetKey,
          symbol: displaySymbol,
          name: a.name,
          balance: a.balance,
          price: a.price,
          value: a.value ?? 0,
          change24h: a.change24h,
          priceStatus: a.priceStatus ?? 'missing',
          sources: buildSourceDetails(),
        })
      }
    })
  })

  const stripLdPrefix = (sym: string) =>
    sym.startsWith('LD') && sym.length > 2 ? sym.slice(2) : sym

  const changePercent = total > 0 ? (weightedChange / total) * 100 : 0
  const assetEntries = Array.from(assetMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
  const holdingsEntries = Array.from(holdingsMap.values())
    .map((holding) => ({
      assetId: holding.assetId,
      symbol: stripLdPrefix(holding.symbol),
      name: holding.name,
      balance: holding.balance,
      price: holding.price,
      value: holding.value,
      change24h: holding.change24h,
      priceStatus: holding.priceStatus,
      sourceCount: new Set(holding.sources.map((s) => s.sourceId)).size,
      sources: holding.sources.map((s) => ({
        ...s,
        chainLabel:
          s.sourceType === 'cex'
            ? 'CEX'
            : s.chainKey
              ? (EVM_CHAINS[s.chainKey]?.name ?? s.chainKey)
              : (walletChainLabelMap.get(s.sourceId) ?? undefined),
      })),
    }))
    .filter((holding) => !hideSmallAssets || holding.value >= 0.1)
    .sort((a, b) => b.value - a.value)

  return {
    totalValue: total,
    change24hValue: weightedChange,
    change24hPercent: changePercent,
    assetData: assetEntries,
    holdingsData: holdingsEntries,
    walletTotal: wTotal,
    cexTotal: cTotal,
  }
}

export function buildPortfolioAnalytics({
  holdingsData,
  walletTotal,
  cexTotal,
  history,
  activeSourceCount,
}: {
  holdingsData: HoldingRow[]
  walletTotal: number
  cexTotal: number
  history: PortfolioHistoryPoint[]
  activeSourceCount: number
}): PortfolioAnalytics {
  const totalValue = holdingsData.reduce((sum, holding) => sum + holding.value, 0)
  const valueHoldings = holdingsData.filter((holding) => holding.value > 0)
  const rankedByValue = [...valueHoldings].sort((a, b) => b.value - a.value)
  const rankedByChange = valueHoldings
    .filter((holding) => holding.change24h !== null)
    .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
  const historyValues = history.map((point) => point.totalValue)
  const pricedAssetCount = holdingsData.filter((holding) => holding.priceStatus === 'live').length
  const stalePriceCount = holdingsData.filter((holding) => holding.priceStatus === 'stale').length
  const missingPriceCount = holdingsData.filter((holding) => holding.priceStatus === 'missing').length
  const totalSourcesValue = walletTotal + cexTotal

  const toInsightAsset = (holding: HoldingRow | undefined | null) =>
    holding
      ? {
          symbol: holding.symbol,
          value: holding.value,
          share: totalValue > 0 ? (holding.value / totalValue) * 100 : 0,
          change24h: holding.change24h,
        }
      : null

  return {
    assetCount: holdingsData.length,
    pricedAssetCount,
    stalePriceCount,
    missingPriceCount,
    topHolding: toInsightAsset(rankedByValue[0]),
    topThreeShare:
      totalValue > 0
        ? (rankedByValue.slice(0, 3).reduce((sum, holding) => sum + holding.value, 0) / totalValue) * 100
        : 0,
    bestPerformer: toInsightAsset(rankedByChange[0]),
    worstPerformer: toInsightAsset(rankedByChange[rankedByChange.length - 1]),
    averagePositionValue: holdingsData.length > 0 ? totalValue / holdingsData.length : 0,
    walletShare: totalSourcesValue > 0 ? (walletTotal / totalSourcesValue) * 100 : 0,
    cexShare: totalSourcesValue > 0 ? (cexTotal / totalSourcesValue) * 100 : 0,
    historyHigh: historyValues.length > 0 ? Math.max(...historyValues) : null,
    historyLow: historyValues.length > 0 ? Math.min(...historyValues) : null,
    historyPoints: history.length,
    activeSourceCount,
  }
}
