import { NextRequest, NextResponse } from 'next/server'
import type { PriceResponse } from '@/types'
import { getPrices } from '@/lib/market'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const symbols: string[] = body.symbols || []
    const priceMap = await getPrices(symbols)
    const prices = symbols.map((symbol) => priceMap[symbol.toUpperCase()] ?? {
      symbol: symbol.toUpperCase(),
      price: null,
      change24h: null,
      status: 'missing' as const,
    })

    const response: PriceResponse = {
      prices,
      status: prices.some((price) => price.status !== 'live') ? 'partial' : 'success',
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
