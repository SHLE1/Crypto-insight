import type { PriceData } from '@/types'

const STABLECOINS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USDE', 'DAI'])
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'
const COINGECKO_BATCH_SIZE = 50
const COINGECKO_CACHE_TTL = 12 * 60 * 60 * 1000
const BINANCE_TICKER_BATCH_SIZE = 20

interface CoinGeckoCoinListResponseItem {
  id: string
  symbol: string
  name: string
  platforms?: Record<string, string>
}

interface CoinGeckoTokenPriceResponseItem {
  usd?: number
  usd_24h_change?: number
}

interface SolanaTokenMarketData {
  symbol: string
  name: string
  price: number | null
  change24h: number | null
}

interface SolanaTokenMetadata {
  symbol: string
  name: string
}

interface BinanceTickerResponse {
  symbol: string
  lastPrice: string
  priceChangePercent: string
}

let solanaTokenMetadataCache:
  | {
      fetchedAt: number
      items: Map<string, SolanaTokenMetadata>
    }
  | null = null

function toNumber(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getCoinGeckoHeaders() {
  const demoApiKey = process.env.COINGECKO_DEMO_API_KEY?.trim()

  return demoApiKey ? { 'x-cg-demo-api-key': demoApiKey } : undefined
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

async function fetchBinanceTickerBatch(symbols: string[]) {
  if (symbols.length === 0) {
    return {} as Record<string, PriceData>
  }

  const query = new URLSearchParams({
    symbols: JSON.stringify(symbols.map((symbol) => `${symbol}USDT`)),
    type: 'MINI',
  })

  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?${query.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return {} as Record<string, PriceData>
  }

  const data = (await response.json()) as BinanceTickerResponse[]

  if (!Array.isArray(data)) {
    return {} as Record<string, PriceData>
  }

  const prices = new Map<string, PriceData>()

  data.forEach((ticker) => {
    const symbol = ticker.symbol.replace(/USDT$/, '')
    const price = toNumber(ticker.lastPrice)

    if (!symbol || price === null) {
      return
    }

    prices.set(symbol, {
      symbol,
      price,
      change24h: toNumber(ticker.priceChangePercent),
    })
  })

  return Object.fromEntries(prices.entries())
}

async function getSolanaTokenMetadataMap() {
  const now = Date.now()

  if (solanaTokenMetadataCache && now - solanaTokenMetadataCache.fetchedAt < COINGECKO_CACHE_TTL) {
    return solanaTokenMetadataCache.items
  }

  const response = await fetch(`${COINGECKO_API_BASE}/coins/list?include_platform=true`, {
    cache: 'no-store',
    headers: getCoinGeckoHeaders(),
  })

  if (!response.ok) {
    throw new Error('CoinGecko 代币索引不可用')
  }

  const data = (await response.json()) as CoinGeckoCoinListResponseItem[]
  const items = new Map<string, SolanaTokenMetadata>()

  data.forEach((item) => {
    const mintAddress = item.platforms?.solana

    if (!mintAddress || items.has(mintAddress)) {
      return
    }

    items.set(mintAddress, {
      symbol: item.symbol.toUpperCase(),
      name: item.name,
    })
  })

  solanaTokenMetadataCache = {
    fetchedAt: now,
    items,
  }

  return items
}

async function fetchCoinGeckoSolanaTokenPriceBatch(mints: string[]) {
  if (mints.length === 0) {
    return {} as Record<string, CoinGeckoTokenPriceResponseItem>
  }

  const query = new URLSearchParams({
    contract_addresses: mints.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  })

  const response = await fetch(`${COINGECKO_API_BASE}/simple/token_price/solana?${query.toString()}`, {
    cache: 'no-store',
    headers: getCoinGeckoHeaders(),
  })

  if (!response.ok) {
    return {}
  }

  return (await response.json()) as Record<string, CoinGeckoTokenPriceResponseItem>
}

export async function getPrices(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))).filter(Boolean)
  const prices = new Map<string, PriceData>()
  const marketSymbols = uniqueSymbols.filter((symbol) => {
    if (STABLECOINS.has(symbol)) {
      prices.set(symbol, { symbol, price: 1, change24h: 0 })
      return false
    }

    return true
  })

  const binanceBatches = await Promise.all(
    chunk(marketSymbols, BINANCE_TICKER_BATCH_SIZE).map((batch) => fetchBinanceTickerBatch(batch))
  )

  binanceBatches.forEach((batch) => {
    Object.entries(batch).forEach(([symbol, price]) => {
      prices.set(symbol, price)
    })
  })

  uniqueSymbols.forEach((symbol) => {
    if (!prices.has(symbol)) {
      prices.set(symbol, { symbol, price: null, change24h: null })
    }
  })

  return Object.fromEntries(prices.entries())
}

export async function getSolanaTokenMarketData(mints: string[]) {
  const uniqueMints = Array.from(new Set(mints.map((mint) => mint.trim()).filter(Boolean)))

  if (uniqueMints.length === 0) {
    return {} as Record<string, SolanaTokenMarketData>
  }

  const metadataMap = await getSolanaTokenMetadataMap().catch(() => new Map<string, SolanaTokenMetadata>())
  const priceBatches = await Promise.all(
    chunk(uniqueMints, COINGECKO_BATCH_SIZE).map((batch) => fetchCoinGeckoSolanaTokenPriceBatch(batch))
  )
  const prices = Object.assign({}, ...priceBatches)

  const entries = uniqueMints.map((mint) => {
    const metadata = metadataMap.get(mint)
    const priceEntry = prices[mint]

    return [
      mint,
      {
        symbol: metadata?.symbol ?? shortenAddress(mint),
        name: metadata?.name ?? shortenAddress(mint),
        price: toNumber(priceEntry?.usd?.toString()),
        change24h: toNumber(priceEntry?.usd_24h_change?.toString()),
      },
    ] as const
  })

  return Object.fromEntries(entries)
}
