import type { PriceData } from '@/types'

const STABLECOINS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USDE', 'DAI'])
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'
const COINGECKO_BATCH_SIZE = 50
const BINANCE_TICKER_BATCH_SIZE = 20
const COINGECKO_CACHE_TTL = 24 * 60 * 60 * 1000
const PRICE_CACHE_TTL = 5 * 60 * 1000
const STALE_PRICE_CACHE_TTL = 60 * 60 * 1000

const EVM_CG_CHAINS: Record<string, string> = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  bsc: 'binance-smart-chain',
  arb: 'arbitrum-one',
  arbitrum: 'arbitrum-one',
  polygon: 'polygon-pos',
  base: 'base',
  avax: 'avalanche',
  avalanche: 'avalanche',
}

const STATIC_SYMBOL_TO_COINGECKO_ID = new Map<string, string>([
  ['AAVE', 'aave'],
  ['ARB', 'arbitrum'],
  ['AVAX', 'avalanche-2'],
  ['BNB', 'binancecoin'],
  ['BTC', 'bitcoin'],
  ['BTCB', 'bitcoin-bep2'],
  ['BUSD', 'binance-usd'],
  ['DAI', 'dai'],
  ['DEGEN', 'degen-base'],
  ['ETH', 'ethereum'],
  ['GMX', 'gmx'],
  ['LINK', 'chainlink'],
  ['POL', 'polygon-ecosystem-token'],
  ['SHIB', 'shiba-inu'],
  ['SOL', 'solana'],
  ['UNI', 'uniswap'],
  ['USDE', 'ethena-usde'],
  ['WBNB', 'wbnb'],
  ['WBTC', 'wrapped-bitcoin'],
  ['WETH', 'weth'],
  ['WETH.E', 'weth'],
  ['XRP', 'ripple'],
])

const STATIC_SOLANA_TOKEN_METADATA = new Map<
  string,
  {
    symbol: string
    name: string
  }
>([
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', { symbol: 'USDC', name: 'USD Coin' }],
  ['Es9vMFrzaCERmJfrF4H2FyM4syjzAm8h1Hn3pV3Dg4eL', { symbol: 'USDT', name: 'Tether USD' }],
  ['DezXAZ8z7PnrnRJjz3wXBoRgixCa6Nn6x1V7ebJ6jRjm', { symbol: 'BONK', name: 'Bonk' }],
  ['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', { symbol: 'JUP', name: 'Jupiter' }],
  ['So11111111111111111111111111111111111111112', { symbol: 'wSOL', name: 'Wrapped SOL' }],
])

interface CoinGeckoCoinListResponseItem {
  id: string
  symbol: string
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
  status: PriceData['status']
}

interface TimedCacheEntry<T> {
  fetchedAt: number
  value: T
}

interface BinanceTickerResponse {
  symbol: string
  lastPrice: string
  priceChangePercent: string
}

interface CachedPriceValue {
  symbol: string
  price: number | null
  change24h: number | null
}

let coinListCache:
  | {
      fetchedAt: number
      bySymbol: Map<string, string>
    }
  | null = null

const symbolPriceCache = new Map<string, TimedCacheEntry<CachedPriceValue>>()
const evmTokenPriceCache = new Map<string, TimedCacheEntry<CachedPriceValue>>()
const solanaTokenPriceCache = new Map<string, TimedCacheEntry<CachedPriceValue>>()

const symbolRequestInFlight = new Map<string, Promise<Record<string, PriceData>>>()
const evmRequestInFlight = new Map<string, Promise<Map<string, PriceData>>>()
const solanaRequestInFlight = new Map<string, Promise<Record<string, CachedPriceValue>>>()

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

function normalizeBinanceMarketSymbol(symbol: string) {
  return symbol.startsWith('LD') && symbol.length > 2 ? symbol.slice(2) : symbol
}

function getCoinGeckoHeaders() {
  const demoApiKey = process.env.COINGECKO_DEMO_API_KEY?.trim()
  return demoApiKey ? { 'x-cg-demo-api-key': demoApiKey } : undefined
}

function setCacheValue(cache: Map<string, TimedCacheEntry<CachedPriceValue>>, key: string, value: CachedPriceValue) {
  cache.set(key, {
    fetchedAt: Date.now(),
    value,
  })
}

function getFreshCacheValue(cache: Map<string, TimedCacheEntry<CachedPriceValue>>, key: string): PriceData | null {
  const entry = cache.get(key)
  if (!entry || Date.now() - entry.fetchedAt > PRICE_CACHE_TTL) return null

  return {
    ...entry.value,
    status: 'live',
  }
}

function getStaleCacheValue(cache: Map<string, TimedCacheEntry<CachedPriceValue>>, key: string): PriceData | null {
  const entry = cache.get(key)
  if (!entry || Date.now() - entry.fetchedAt > STALE_PRICE_CACHE_TTL) return null

  return {
    ...entry.value,
    status: 'stale',
  }
}

async function withInFlight<T>(map: Map<string, Promise<T>>, key: string, factory: () => Promise<T>) {
  const existing = map.get(key)
  if (existing) {
    return existing
  }

  const task = factory().finally(() => {
    map.delete(key)
  })
  map.set(key, task)
  return task
}

async function fetchWithRetry<T>(
  url: string,
  init?: RequestInit,
  maxRetries = 3
): Promise<T | null> {
  let waitMs = 1000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init)

      if (res.ok) {
        return (await res.json()) as T
      }

      if (res.status === 429 && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        waitMs *= 2
        continue
      }

      return null
    } catch {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        waitMs *= 2
        continue
      }
    }
  }

  return null
}

async function fetchBinanceTickerBatch(symbols: string[]) {
  if (symbols.length === 0) {
    return {} as Record<string, CachedPriceValue>
  }

  const query = new URLSearchParams({
    symbols: JSON.stringify(symbols.map((symbol) => `${symbol}USDT`)),
    type: 'MINI',
  })

  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?${query.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return {} as Record<string, CachedPriceValue>
  }

  const data = (await response.json()) as BinanceTickerResponse[]
  if (!Array.isArray(data)) {
    return {} as Record<string, CachedPriceValue>
  }

  const prices = new Map<string, CachedPriceValue>()
  data.forEach((ticker) => {
    const symbol = ticker.symbol.replace(/USDT$/, '')
    const price = toNumber(ticker.lastPrice)
    if (!symbol || price === null) return

    prices.set(symbol, {
      symbol,
      price,
      change24h: toNumber(ticker.priceChangePercent),
    })
  })

  return Object.fromEntries(prices.entries())
}

async function fetchCoinGeckoPriceBatch(coinIds: string[]) {
  const result = new Map<string, CachedPriceValue>()
  if (coinIds.length === 0) return result

  const headers = getCoinGeckoHeaders()
  const batches = chunk(coinIds, COINGECKO_BATCH_SIZE)

  for (const batch of batches) {
    const query = new URLSearchParams({
      ids: batch.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    })

    const data = await fetchWithRetry<Record<string, CoinGeckoTokenPriceResponseItem>>(
      `${COINGECKO_API_BASE}/simple/price?${query.toString()}`,
      { cache: 'no-store', headers }
    )

    if (!data) continue

    for (const [coinId, item] of Object.entries(data)) {
      result.set(coinId, {
        symbol: coinId,
        price: toNumber(item.usd),
        change24h: toNumber(item.usd_24h_change),
      })
    }
  }

  return result
}

async function fetchEvmContractPriceBatch(
  chainPlatform: string,
  addresses: string[]
) {
  const result = new Map<string, CachedPriceValue>()
  if (addresses.length === 0) return result

  const headers = getCoinGeckoHeaders()
  const batches = chunk(addresses, COINGECKO_BATCH_SIZE)

  for (const batch of batches) {
    const query = new URLSearchParams({
      contract_addresses: batch.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    })

    const data = await fetchWithRetry<Record<string, CoinGeckoTokenPriceResponseItem>>(
      `${COINGECKO_API_BASE}/simple/token_price/${chainPlatform}?${query.toString()}`,
      { cache: 'no-store', headers }
    )

    if (!data) continue

    for (const [address, item] of Object.entries(data)) {
      result.set(address.toLowerCase(), {
        symbol: address,
        price: toNumber(item.usd),
        change24h: toNumber(item.usd_24h_change),
      })
    }
  }

  return result
}

async function fetchSolanaTokenPriceBatch(mints: string[]) {
  if (mints.length === 0) {
    return {} as Record<string, CachedPriceValue>
  }

  const query = new URLSearchParams({
    contract_addresses: mints.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  })

  const data = await fetchWithRetry<Record<string, CoinGeckoTokenPriceResponseItem>>(
    `${COINGECKO_API_BASE}/simple/token_price/solana?${query.toString()}`,
    { cache: 'no-store', headers: getCoinGeckoHeaders() }
  )

  if (!data) {
    return {} as Record<string, CachedPriceValue>
  }

  return Object.fromEntries(
    Object.entries(data).map(([mint, item]) => [
      mint,
      {
        symbol: mint,
        price: toNumber(item.usd),
        change24h: toNumber(item.usd_24h_change),
      },
    ])
  )
}

async function getCoinListMap() {
  const now = Date.now()
  if (coinListCache && now - coinListCache.fetchedAt < COINGECKO_CACHE_TTL) {
    return coinListCache.bySymbol
  }

  const response = await fetch(`${COINGECKO_API_BASE}/coins/list`, {
    cache: 'no-store',
    headers: getCoinGeckoHeaders(),
  })

  if (!response.ok) {
    throw new Error('CoinGecko 代币索引不可用')
  }

  const data = (await response.json()) as CoinGeckoCoinListResponseItem[]
  const bySymbol = new Map<string, string>()

  for (const item of data) {
    const symbol = item.symbol.toUpperCase()
    if (!bySymbol.has(symbol)) {
      bySymbol.set(symbol, item.id)
    }
  }

  coinListCache = {
    fetchedAt: now,
    bySymbol,
  }

  return bySymbol
}

async function resolveCoinGeckoIds(symbols: string[]) {
  const resolved = new Map<string, string>()
  const unresolved: string[] = []

  symbols.forEach((symbol) => {
    const staticId = STATIC_SYMBOL_TO_COINGECKO_ID.get(symbol)
    if (staticId) {
      resolved.set(symbol, staticId)
    } else {
      unresolved.push(symbol)
    }
  })

  if (unresolved.length === 0) {
    return resolved
  }

  const listMap = await getCoinListMap().catch(() => null)
  if (!listMap) {
    return resolved
  }

  unresolved.forEach((symbol) => {
    const coinId = listMap.get(symbol)
    if (coinId) {
      resolved.set(symbol, coinId)
    }
  })

  return resolved
}

async function fetchBatchedSymbolPrices(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols))
  const normalizedSymbols = Array.from(new Set(uniqueSymbols.map((symbol) => normalizeBinanceMarketSymbol(symbol))))
  const result = new Map<string, PriceData>()

  const binanceBatches = await Promise.all(
    chunk(normalizedSymbols, BINANCE_TICKER_BATCH_SIZE).map((batch) => fetchBinanceTickerBatch(batch))
  )
  const binancePrices = new Map<string, CachedPriceValue>()

  binanceBatches.forEach((batch) => {
    Object.entries(batch).forEach(([symbol, price]) => {
      binancePrices.set(symbol, price)
    })
  })

  const unresolvedSymbols: string[] = []
  uniqueSymbols.forEach((symbol) => {
    const marketSymbol = normalizeBinanceMarketSymbol(symbol)
    const binancePrice = binancePrices.get(marketSymbol)
    if (binancePrice) {
      const nextPrice = { symbol, price: binancePrice.price, change24h: binancePrice.change24h, status: 'live' as const }
      result.set(symbol, nextPrice)
      setCacheValue(symbolPriceCache, symbol, nextPrice)
    } else {
      unresolvedSymbols.push(symbol)
    }
  })

  if (unresolvedSymbols.length > 0) {
    const idLookupSymbols = Array.from(
      new Set(unresolvedSymbols.map((symbol) => normalizeBinanceMarketSymbol(symbol)))
    )
    const symbolToCoinId = await resolveCoinGeckoIds(idLookupSymbols)
    const coinIds = Array.from(new Set(Array.from(symbolToCoinId.values())))
    const cgPrices = await fetchCoinGeckoPriceBatch(coinIds)

    unresolvedSymbols.forEach((symbol) => {
      const marketSymbol = normalizeBinanceMarketSymbol(symbol)
      const coinId = symbolToCoinId.get(marketSymbol)
      const cgPrice = coinId ? cgPrices.get(coinId) : undefined
      if (!cgPrice) return

      const nextPrice = {
        symbol,
        price: cgPrice.price,
        change24h: cgPrice.change24h,
        status: 'live' as const,
      }
      result.set(symbol, nextPrice)
      setCacheValue(symbolPriceCache, symbol, nextPrice)
    })
  }

  return Object.fromEntries(result.entries())
}

async function fetchBatchedEvmTokenPrices(
  tokens: Array<{ address: string; symbol: string }>,
  chainKey: string
) {
  const result = new Map<string, PriceData>()
  const cgPlatform = EVM_CG_CHAINS[chainKey]

  if (!cgPlatform) {
    tokens.forEach((token) => {
      result.set(token.address.toLowerCase(), {
        symbol: token.symbol,
        price: null,
        change24h: null,
        status: 'missing',
      })
    })
    return result
  }

  const byAddress = new Map(tokens.map((token) => [token.address.toLowerCase(), token]))
  const pricesByContract = await fetchEvmContractPriceBatch(cgPlatform, Array.from(byAddress.keys()))

  pricesByContract.forEach((price, address) => {
    const token = byAddress.get(address)
    if (!token) return

    const nextPrice = {
      symbol: token.symbol,
      price: price.price,
      change24h: price.change24h,
      status: 'live' as const,
    }
    result.set(address, nextPrice)
    setCacheValue(evmTokenPriceCache, `${chainKey}:${address}`, nextPrice)
  })

  const unresolvedTokens = tokens.filter((token) => !result.has(token.address.toLowerCase()))
  if (unresolvedTokens.length > 0) {
    const symbolToCoinId = await resolveCoinGeckoIds(
      Array.from(new Set(unresolvedTokens.map((token) => token.symbol.toUpperCase())))
    )
    const coinIds = Array.from(new Set(Array.from(symbolToCoinId.values())))
    const cgPrices = await fetchCoinGeckoPriceBatch(coinIds)

    unresolvedTokens.forEach((token) => {
      const address = token.address.toLowerCase()
      const coinId = symbolToCoinId.get(token.symbol.toUpperCase())
      const cgPrice = coinId ? cgPrices.get(coinId) : undefined
      if (!cgPrice) return

      const nextPrice = {
        symbol: token.symbol,
        price: cgPrice.price,
        change24h: cgPrice.change24h,
        status: 'live' as const,
      }
      result.set(address, nextPrice)
      setCacheValue(evmTokenPriceCache, `${chainKey}:${address}`, nextPrice)
    })
  }

  return result
}

export async function getPrices(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))).filter(Boolean)
  const result = new Map<string, PriceData>()
  const unresolvedSymbols: string[] = []

  uniqueSymbols.forEach((symbol) => {
    if (STABLECOINS.has(normalizeBinanceMarketSymbol(symbol))) {
      result.set(symbol, { symbol, price: 1, change24h: 0, status: 'live' })
      return
    }

    const cachedPrice = getFreshCacheValue(symbolPriceCache, symbol)
    if (cachedPrice) {
      result.set(symbol, cachedPrice)
      return
    }

    unresolvedSymbols.push(symbol)
  })

  if (unresolvedSymbols.length > 0) {
    const batchKey = unresolvedSymbols.slice().sort().join(',')
    const livePrices = await withInFlight(symbolRequestInFlight, batchKey, () =>
      fetchBatchedSymbolPrices(unresolvedSymbols)
    )

    unresolvedSymbols.forEach((symbol) => {
      const price = livePrices[symbol]
      if (price) {
        result.set(symbol, price)
      }
    })
  }

  uniqueSymbols.forEach((symbol) => {
    if (result.has(symbol)) return

    const stalePrice = getStaleCacheValue(symbolPriceCache, symbol)
    if (stalePrice) {
      result.set(symbol, stalePrice)
      return
    }

    result.set(symbol, {
      symbol,
      price: null,
      change24h: null,
      status: 'missing',
    })
  })

  return Object.fromEntries(result.entries())
}

export async function getEvmTokenPrices(
  tokens: Array<{ address: string; symbol: string }>,
  chainKey: string
): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()
  const dedupedTokens = Array.from(
    new Map(tokens.map((token) => [token.address.toLowerCase(), { ...token, address: token.address.toLowerCase() }])).values()
  )
  const unresolvedTokens: Array<{ address: string; symbol: string }> = []

  dedupedTokens.forEach((token) => {
    const cacheKey = `${chainKey}:${token.address}`
    const cachedPrice = getFreshCacheValue(evmTokenPriceCache, cacheKey)
    if (cachedPrice) {
      result.set(token.address, cachedPrice)
      return
    }

    unresolvedTokens.push(token)
  })

  if (unresolvedTokens.length > 0) {
    const batchKey = `${chainKey}:${unresolvedTokens.map((token) => token.address).sort().join(',')}`
    const livePrices = await withInFlight(evmRequestInFlight, batchKey, () =>
      fetchBatchedEvmTokenPrices(unresolvedTokens, chainKey)
    )
    livePrices.forEach((price, address) => {
      result.set(address, price)
    })
  }

  dedupedTokens.forEach((token) => {
    if (result.has(token.address)) return

    const stalePrice = getStaleCacheValue(evmTokenPriceCache, `${chainKey}:${token.address}`)
    if (stalePrice) {
      result.set(token.address, stalePrice)
      return
    }

    result.set(token.address, {
      symbol: token.symbol,
      price: null,
      change24h: null,
      status: 'missing',
    })
  })

  return result
}

export async function getSolanaTokenMarketData(mints: string[]) {
  const uniqueMints = Array.from(new Set(mints.map((mint) => mint.trim()).filter(Boolean)))

  if (uniqueMints.length === 0) {
    return {} as Record<string, SolanaTokenMarketData>
  }

  const livePrices: Record<string, CachedPriceValue> = {}
  const unresolvedMints: string[] = []

  uniqueMints.forEach((mint) => {
    const cachedPrice = getFreshCacheValue(solanaTokenPriceCache, mint)
    if (cachedPrice) {
      livePrices[mint] = cachedPrice
    } else {
      unresolvedMints.push(mint)
    }
  })

  if (unresolvedMints.length > 0) {
    const batchKey = unresolvedMints.slice().sort().join(',')
    const fetchedPrices = await withInFlight(solanaRequestInFlight, batchKey, () =>
      Promise.all(
        chunk(unresolvedMints, COINGECKO_BATCH_SIZE).map((batch) => fetchSolanaTokenPriceBatch(batch))
      ).then((batches) => Object.assign({} as Record<string, CachedPriceValue>, ...batches))
    )

    ;(Object.entries(fetchedPrices) as Array<[string, CachedPriceValue]>).forEach(([mint, price]) => {
      livePrices[mint] = price
      setCacheValue(solanaTokenPriceCache, mint, price)
    })
  }

  return Object.fromEntries(
    uniqueMints.map((mint) => {
      const metadata = STATIC_SOLANA_TOKEN_METADATA.get(mint)
      const livePrice = livePrices[mint]
      const stalePrice = livePrice ? null : getStaleCacheValue(solanaTokenPriceCache, mint)
      const resolvedPrice = livePrice
        ? { ...livePrice, status: 'live' as const }
        : stalePrice
          ? stalePrice
          : {
              symbol: metadata?.symbol ?? shortenAddress(mint),
              price: null,
              change24h: null,
              status: 'missing' as const,
            }

      return [
        mint,
        {
          symbol: metadata?.symbol ?? resolvedPrice.symbol,
          name: metadata?.name ?? shortenAddress(mint),
          price: resolvedPrice.price,
          change24h: resolvedPrice.change24h,
          status: resolvedPrice.status,
        },
      ] as const
    })
  )
}
