import type { PriceData } from '@/types'

const STABLECOINS = new Set(['USDT', 'USDC', 'FDUSD', 'TUSD', 'USDE', 'DAI'])

interface BinanceTickerResponse {
  lastPrice: string
  priceChangePercent: string
}

interface OkxTickerResponse {
  code: string
  msg: string
  data?: Array<{
    last: string
    open24h: string
  }>
}

function toNumber(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function fetchBinanceTicker(symbol: string): Promise<PriceData | null> {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as BinanceTickerResponse
  const price = toNumber(data.lastPrice)
  const change24h = toNumber(data.priceChangePercent)

  if (price === null) {
    return null
  }

  return {
    symbol,
    price,
    change24h,
  }
}

async function fetchOkxTicker(symbol: string): Promise<PriceData | null> {
  const response = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as OkxTickerResponse
  const ticker = data.data?.[0]

  if (!ticker) {
    return null
  }

  const price = toNumber(ticker.last)
  const open24h = toNumber(ticker.open24h)

  if (price === null) {
    return null
  }

  const change24h =
    open24h && open24h > 0 ? ((price - open24h) / open24h) * 100 : null

  return {
    symbol,
    price,
    change24h,
  }
}

export async function getPrices(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))).filter(Boolean)

  const priceEntries = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      if (STABLECOINS.has(symbol)) {
        return [symbol, { symbol, price: 1, change24h: 0 }] as const
      }

      try {
        const ticker = (await fetchBinanceTicker(symbol)) ?? (await fetchOkxTicker(symbol))
        return [symbol, ticker ?? { symbol, price: null, change24h: null }] as const
      } catch {
        return [symbol, { symbol, price: null, change24h: null }] as const
      }
    })
  )

  return Object.fromEntries(priceEntries)
}
