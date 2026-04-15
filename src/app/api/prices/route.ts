import { NextRequest, NextResponse } from 'next/server'
import type { PriceResponse, PriceData } from '@/types'

// 模拟价格数据 — 第一版使用静态数据，后续接入 CoinGecko 等真实数据源
const MOCK_PRICES: Record<string, { price: number; change24h: number }> = {
  ETH: { price: 3200.5, change24h: 2.35 },
  BTC: { price: 68500.0, change24h: -0.82 },
  SOL: { price: 178.3, change24h: 5.12 },
  USDT: { price: 1.0, change24h: 0.01 },
  USDC: { price: 1.0, change24h: -0.01 },
  BNB: { price: 605.2, change24h: 1.45 },
  MATIC: { price: 0.72, change24h: -1.23 },
  ARB: { price: 1.15, change24h: 3.67 },
  OP: { price: 2.45, change24h: -0.56 },
  LINK: { price: 14.82, change24h: 1.89 },
  UNI: { price: 7.65, change24h: -2.1 },
  AAVE: { price: 92.3, change24h: 0.78 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const symbols: string[] = body.symbols || []

    const prices: PriceData[] = symbols.map((symbol) => {
      const upper = symbol.toUpperCase()
      const data = MOCK_PRICES[upper]
      return {
        symbol: upper,
        price: data?.price ?? null,
        change24h: data?.change24h ?? null,
      }
    })

    const response: PriceResponse = {
      prices,
      status: prices.some((p) => p.price === null) ? 'partial' : 'success',
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        prices: [],
        status: 'error',
        updatedAt: new Date().toISOString(),
      } satisfies PriceResponse,
      { status: 400 }
    )
  }
}
