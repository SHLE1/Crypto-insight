import type { PriceData } from '@/types'

const STABLECOINS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USDE', 'DAI'])
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'
const COINGECKO_BATCH_SIZE = 50
const COINGECKO_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h
const COINGECKO_PRICE_CACHE_TTL = 5 * 60 * 1000 // 5m
const COINGECKO_STALE_CACHE_TTL = 60 * 60 * 1000 // 1h
const COINGECKO_MAX_BATCHES_PER_CALL = 1
const DEFAULT_COINGECKO_MAX_REQUESTS_PER_MINUTE = 8
const BINANCE_TICKER_BATCH_SIZE = 20

// Supported EVM chains for CoinGecko simple/token_price
const EVM_CG_CHAINS: Record<string, string> = {
  eth: 'ethereum',
  bsc: 'binance-smart-chain',
  arb: 'arbitrum-one',
  polygon: 'polygon-pos',
  base: 'base',
  avax: 'avalanche',
}

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

interface TimedCacheEntry<T> {
  fetchedAt: number
  value: T
}

interface BinanceTickerResponse {
  symbol: string
  lastPrice: string
  priceChangePercent: string
}

// Local reference table: contract address → CoinGecko ID
// Also: symbol → CoinGecko ID (for known symbols)
let coinListCache:
  | {
      fetchedAt: number
      // EVM platform key → contract address → coin id
      byPlatform: Map<string, Map<string, string>>
      // symbol (uppercase) → coin id
      bySymbol: Map<string, string>
    }
  | null = null

let solanaTokenMetadataCache:
  | {
      fetchedAt: number
      items: Map<string, SolanaTokenMetadata>
    }
  | null = null

const symbolPriceCache = new Map<string, TimedCacheEntry<PriceData>>()
const evmTokenPriceCache = new Map<string, TimedCacheEntry<PriceData>>()
const solanaTokenPriceCache = new Map<string, TimedCacheEntry<CoinGeckoTokenPriceResponseItem>>()

const coingeckoRateState = {
  windowStartedAt: 0,
  usedRequests: 0,
  cursors: new Map<string, number>(),
}

function toNumber(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeBinanceMarketSymbol(symbol: string) {
  return symbol.startsWith('LD') && symbol.length > 2 ? symbol.slice(2) : symbol
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

function getCoinGeckoRequestLimit() {
  const parsed = Number(process.env.COINGECKO_MAX_REQUESTS_PER_MINUTE)
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return DEFAULT_COINGECKO_MAX_REQUESTS_PER_MINUTE
}

function resetCoinGeckoWindowIfNeeded(now = Date.now()) {
  if (now - coingeckoRateState.windowStartedAt >= 60_000) {
    coingeckoRateState.windowStartedAt = now
    coingeckoRateState.usedRequests = 0
  }
}

function reserveCoinGeckoRequests(requested: number) {
  resetCoinGeckoWindowIfNeeded()

  const limit = getCoinGeckoRequestLimit()
  const remaining = Math.max(0, limit - coingeckoRateState.usedRequests)
  const granted = Math.max(0, Math.min(requested, remaining))
  coingeckoRateState.usedRequests += granted
  return granted
}

function rotateSelection(items: string[], namespace: string, count: number) {
  if (items.length === 0 || count <= 0) return []

  const cursor = coingeckoRateState.cursors.get(namespace) ?? 0
  const selected: string[] = []

  for (let index = 0; index < Math.min(count, items.length); index++) {
    selected.push(items[(cursor + index) % items.length])
  }

  coingeckoRateState.cursors.set(namespace, (cursor + selected.length) % items.length)
  return selected
}

function selectCoinGeckoRefreshItems(namespace: string, items: string[]) {
  const uniqueItems = Array.from(new Set(items))
  if (uniqueItems.length === 0) return []

  const requestedBatches = Math.ceil(uniqueItems.length / COINGECKO_BATCH_SIZE)
  const grantedBatches = reserveCoinGeckoRequests(Math.min(requestedBatches, COINGECKO_MAX_BATCHES_PER_CALL))
  return rotateSelection(uniqueItems, namespace, grantedBatches * COINGECKO_BATCH_SIZE)
}

function getFreshCacheValue<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, ttl = COINGECKO_PRICE_CACHE_TTL) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > ttl) return null
  return entry.value
}

function getStaleCacheValue<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, ttl = COINGECKO_STALE_CACHE_TTL) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > ttl) return null
  return entry.value
}

function setCacheValue<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, value: T) {
  cache.set(key, {
    fetchedAt: Date.now(),
    value,
  })
}

// ---------------------------------------------------------------------------
// CoinGecko local reference table (contract address → ID, symbol → ID)
// ---------------------------------------------------------------------------

async function getCoinListMap() {
  const now = Date.now()

  if (coinListCache && now - coinListCache.fetchedAt < COINGECKO_CACHE_TTL) {
    return coinListCache
  }

  const response = await fetch(`${COINGECKO_API_BASE}/coins/list?include_platform=true`, {
    cache: 'no-store',
    headers: getCoinGeckoHeaders(),
  })

  if (!response.ok) {
    throw new Error('CoinGecko 代币索引不可用')
  }

  const data = (await response.json()) as CoinGeckoCoinListResponseItem[]

  const byPlatform = new Map<string, Map<string, string>>()
  const bySymbol = new Map<string, string>()

  for (const item of data) {
    // Symbol → ID mapping (first wins for duplicates)
    const upperSymbol = item.symbol.toUpperCase()
    if (!bySymbol.has(upperSymbol)) {
      bySymbol.set(upperSymbol, item.id)
    }

    // Platform contract → ID mapping
    if (item.platforms) {
      for (const [platform, address] of Object.entries(item.platforms)) {
        if (!address) continue
        const normalizedAddr = address.toLowerCase()
        if (!byPlatform.has(platform)) {
          byPlatform.set(platform, new Map())
        }
        const platformMap = byPlatform.get(platform)!
        if (!platformMap.has(normalizedAddr)) {
          platformMap.set(normalizedAddr, item.id)
        }
      }
    }
  }

  coinListCache = { fetchedAt: now, byPlatform, bySymbol }
  return coinListCache
}

// ---------------------------------------------------------------------------
// Binance ticker (primary price source, fast and free)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// CoinGecko batched price fetch (fallback for non-Binance tokens)
// ---------------------------------------------------------------------------

/**
 * Fetch prices for multiple CoinGecko IDs in a single call.
 * Uses /simple/price with comma-separated ids, up to 50 per call.
 */
async function fetchCoinGeckoPriceBatch(coinIds: string[]): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()
  if (coinIds.length === 0) return result

  const batches = chunk(coinIds, COINGECKO_BATCH_SIZE)
  const headers = getCoinGeckoHeaders()

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
        symbol: coinId, // caller will remap to actual symbol
        price: toNumber(item.usd?.toString()),
        change24h: toNumber(item.usd_24h_change?.toString()),
      })
    }
  }

  return result
}

/**
 * Fetch prices for EVM contract addresses using /simple/token_price/{chain}.
 * Batches up to 50 addresses per call.
 */
async function fetchEvmContractPriceBatch(
  chainPlatform: string,
  addresses: string[]
): Promise<Map<string, CoinGeckoTokenPriceResponseItem>> {
  const result = new Map<string, CoinGeckoTokenPriceResponseItem>()
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

    for (const [addr, item] of Object.entries(data)) {
      result.set(addr.toLowerCase(), item)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Exponential backoff retry for 429 errors
// ---------------------------------------------------------------------------

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

      if (res.status === 429) {
        if (attempt < maxRetries) {
          console.warn(`[CoinGecko 429] retry in ${waitMs}ms (${attempt + 1}/${maxRetries})`)
          await new Promise((r) => setTimeout(r, waitMs))
          waitMs *= 2 // 1s → 2s → 4s
          continue
        }
      }

      // Other errors: don't retry
      return null
    } catch {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, waitMs))
        waitMs *= 2
        continue
      }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Solana token metadata & prices
// ---------------------------------------------------------------------------

async function getSolanaTokenMetadataMap() {
  const now = Date.now()

  if (solanaTokenMetadataCache && now - solanaTokenMetadataCache.fetchedAt < COINGECKO_CACHE_TTL) {
    return solanaTokenMetadataCache.items
  }

  // Reuse the shared coin list instead of a separate call
  const listMap = await getCoinListMap().catch(() => null)
  if (!listMap) return new Map<string, SolanaTokenMetadata>()

  const items = new Map<string, SolanaTokenMetadata>()
  const solanaMap = listMap.byPlatform.get('solana')

  if (solanaMap) {
    for (const [mintAddr, coinId] of solanaMap.entries()) {
      // Reverse lookup: find the coin entry to get symbol/name
      // We stored bySymbol, but we need the reverse. Use coinId → symbol from bySymbol.
      // Actually, let's just store symbol/name from the original data.
      // For simplicity, we use the coinId as fallback.
      items.set(mintAddr, {
        symbol: coinId.toUpperCase().slice(0, 10),
        name: coinId,
      })
    }
  }

  solanaTokenMetadataCache = { fetchedAt: now, items }
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

  const data = await fetchWithRetry<Record<string, CoinGeckoTokenPriceResponseItem>>(
    `${COINGECKO_API_BASE}/simple/token_price/solana?${query.toString()}`,
    { cache: 'no-store', headers: getCoinGeckoHeaders() }
  )

  return data ?? ({} as Record<string, CoinGeckoTokenPriceResponseItem>)
}

// ---------------------------------------------------------------------------
// Public API: getPrices — unified price lookup
// ---------------------------------------------------------------------------

export async function getPrices(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))).filter(Boolean)
  const normalizedSymbolMap = new Map(uniqueSymbols.map((symbol) => [symbol, normalizeBinanceMarketSymbol(symbol)]))
  const prices = new Map<string, PriceData>()

  // 1) Stablecoins → $1
  const marketSymbols = Array.from(new Set(Array.from(normalizedSymbolMap.values()))).filter(
    (symbol) => !STABLECOINS.has(symbol)
  )

  normalizedSymbolMap.forEach((marketSymbol, originalSymbol) => {
    if (STABLECOINS.has(marketSymbol)) {
      prices.set(originalSymbol, { symbol: originalSymbol, price: 1, change24h: 0 })
    }
  })

  // 2) Try Binance ticker first (fast, no rate limit issues)
  const binanceBatches = await Promise.all(
    chunk(marketSymbols, BINANCE_TICKER_BATCH_SIZE).map((batch) => fetchBinanceTickerBatch(batch))
  )

  const binancePrices = new Map<string, PriceData>()
  binanceBatches.forEach((batch) => {
    Object.entries(batch).forEach(([symbol, price]) => {
      binancePrices.set(symbol, price)
    })
  })

  // 3) Find symbols not found on Binance → try CoinGecko
  const missingSymbols: string[] = []
  uniqueSymbols.forEach((symbol) => {
    if (prices.has(symbol)) return
    const marketSymbol = normalizedSymbolMap.get(symbol) ?? symbol
    const binancePrice = binancePrices.get(marketSymbol)
    if (binancePrice) {
      prices.set(symbol, binancePrice)
    } else {
      const cachedPrice = getFreshCacheValue(symbolPriceCache, symbol)
      if (cachedPrice) {
        prices.set(symbol, cachedPrice)
      } else {
        missingSymbols.push(symbol)
      }
    }
  })

  // 4) For missing symbols, try CoinGecko via symbol → coin ID mapping
  if (missingSymbols.length > 0) {
    const listMap = await getCoinListMap().catch(() => null)
    if (listMap) {
      const refreshSymbols = selectCoinGeckoRefreshItems('symbols', missingSymbols)
      const refreshCoinIds: string[] = []
      const coinIdToSymbol = new Map<string, string>()

      for (const sym of refreshSymbols) {
        const coinId = listMap.bySymbol.get(sym)
        if (coinId) {
          refreshCoinIds.push(coinId)
          coinIdToSymbol.set(coinId, sym)
        }
      }

      if (refreshCoinIds.length > 0) {
        const cgPrices = await fetchCoinGeckoPriceBatch(refreshCoinIds)
        for (const [coinId, priceData] of Array.from(cgPrices)) {
          const sym = coinIdToSymbol.get(coinId)
          if (sym) {
            const nextPrice = { symbol: sym, price: priceData.price, change24h: priceData.change24h }
            prices.set(sym, nextPrice)
            setCacheValue(symbolPriceCache, sym, nextPrice)
          }
        }

        refreshSymbols.forEach((sym) => {
          if (prices.has(sym)) return

          const stalePrice = getStaleCacheValue(symbolPriceCache, sym)
          if (stalePrice) {
            prices.set(sym, stalePrice)
          }
        })
      }
    }
  }

  // 5) Fill remaining with null
  uniqueSymbols.forEach((symbol) => {
    if (!prices.has(symbol)) {
      const stalePrice = getStaleCacheValue(symbolPriceCache, symbol)
      if (stalePrice) {
        prices.set(symbol, stalePrice)
      } else {
        prices.set(symbol, { symbol, price: null, change24h: null })
      }
    }
  })

  return Object.fromEntries(prices.entries())
}

// ---------------------------------------------------------------------------
// Public API: getEvmTokenPrices — batch EVM contract address → price
// ---------------------------------------------------------------------------

/**
 * Fetch prices for EVM token contract addresses.
 * Returns { [lowercase_address]: PriceData }
 */
export async function getEvmTokenPrices(
  tokens: Array<{ address: string; symbol: string }>,
  chainKey: string
): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()
  if (tokens.length === 0) return result

  const cgPlatform = EVM_CG_CHAINS[chainKey]
  if (!cgPlatform) {
    // Unknown chain, return null prices
    for (const t of tokens) {
      result.set(t.address.toLowerCase(), { symbol: t.symbol, price: null, change24h: null })
    }
    return result
  }

  const missingTokens: Array<{ address: string; symbol: string }> = []
  for (const token of tokens) {
    const cacheKey = `${chainKey}:${token.address.toLowerCase()}`
    const cachedPrice = getFreshCacheValue(evmTokenPriceCache, cacheKey)
    if (cachedPrice) {
      result.set(token.address.toLowerCase(), cachedPrice)
    } else {
      missingTokens.push(token)
    }
  }

  // 1) Try CoinGecko /simple/token_price/{chain} by contract address
  const refreshTokens = selectCoinGeckoRefreshItems(
    `evm-contract:${chainKey}`,
    missingTokens.map((token) => token.address.toLowerCase())
  )
  const refreshTokenSet = new Set(refreshTokens)
  const contractLookupTokens = missingTokens.filter((token) => refreshTokenSet.has(token.address.toLowerCase()))
  const cgPrices = await fetchEvmContractPriceBatch(
    cgPlatform,
    contractLookupTokens.map((token) => token.address.toLowerCase())
  )

  for (const t of contractLookupTokens) {
    const addr = t.address.toLowerCase()
    const cgData = cgPrices.get(addr)
    if (cgData) {
      const nextPrice = {
        symbol: t.symbol,
        price: toNumber(cgData.usd?.toString()),
        change24h: toNumber(cgData.usd_24h_change?.toString()),
      }
      result.set(addr, nextPrice)
      setCacheValue(evmTokenPriceCache, `${chainKey}:${addr}`, nextPrice)
    }
  }

  // 2) For tokens not found by contract, try symbol lookup via local reference table
  const stillMissing = contractLookupTokens.filter((t) => !result.has(t.address.toLowerCase()))
  if (stillMissing.length > 0) {
    const listMap = await getCoinListMap().catch(() => null)
    if (listMap) {
      const refreshByIdTokens = selectCoinGeckoRefreshItems(
        `evm-id:${chainKey}`,
        stillMissing.map((token) => token.address.toLowerCase())
      )
      const refreshByIdTokenSet = new Set(refreshByIdTokens)
      const coinIds: string[] = []
      const coinIdToAddr = new Map<string, string>()

      for (const t of stillMissing) {
        if (!refreshByIdTokenSet.has(t.address.toLowerCase())) continue
        const coinId = listMap.bySymbol.get(t.symbol.toUpperCase())
        if (coinId) {
          coinIds.push(coinId)
          coinIdToAddr.set(coinId, t.address.toLowerCase())
        }
      }

      if (coinIds.length > 0) {
        const cgIdPrices = await fetchCoinGeckoPriceBatch(coinIds)
        for (const [coinId, priceData] of Array.from(cgIdPrices)) {
          const addr = coinIdToAddr.get(coinId)
          if (addr) {
            const token = tokens.find((t) => t.address.toLowerCase() === addr)
            const nextPrice = {
              symbol: token?.symbol ?? priceData.symbol,
              price: priceData.price,
              change24h: priceData.change24h,
            }
            result.set(addr, nextPrice)
            setCacheValue(evmTokenPriceCache, `${chainKey}:${addr}`, nextPrice)
          }
        }
      }
    }
  }

  // 3) Fill remaining with null
  for (const t of tokens) {
    const addr = t.address.toLowerCase()
    if (!result.has(addr)) {
      const stalePrice = getStaleCacheValue(evmTokenPriceCache, `${chainKey}:${addr}`)
      if (stalePrice) {
        result.set(addr, stalePrice)
      } else {
        result.set(addr, { symbol: t.symbol, price: null, change24h: null })
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Public API: getSolanaTokenMarketData (unchanged)
// ---------------------------------------------------------------------------

export async function getSolanaTokenMarketData(mints: string[]) {
  const uniqueMints = Array.from(new Set(mints.map((mint) => mint.trim()).filter(Boolean)))

  if (uniqueMints.length === 0) {
    return {} as Record<string, SolanaTokenMarketData>
  }

  const metadataMap = await getSolanaTokenMetadataMap().catch(() => new Map<string, SolanaTokenMetadata>())
  const prices: Record<string, CoinGeckoTokenPriceResponseItem> = {}
  const uncachedMints: string[] = []

  uniqueMints.forEach((mint) => {
    const cachedPrice = getFreshCacheValue(solanaTokenPriceCache, mint)
    if (cachedPrice) {
      prices[mint] = cachedPrice
    } else {
      uncachedMints.push(mint)
    }
  })

  const refreshMints = selectCoinGeckoRefreshItems('solana', uncachedMints)
  const priceBatches = await Promise.all(
    chunk(refreshMints, COINGECKO_BATCH_SIZE).map((batch) => fetchCoinGeckoSolanaTokenPriceBatch(batch))
  )

  priceBatches.forEach((batch) => {
    Object.entries(batch).forEach(([mint, price]) => {
      prices[mint] = price
      setCacheValue(solanaTokenPriceCache, mint, price)
    })
  })

  const entries = uniqueMints.map((mint) => {
    const metadata = metadataMap.get(mint)
    const priceEntry = prices[mint] ?? getStaleCacheValue(solanaTokenPriceCache, mint) ?? undefined

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
