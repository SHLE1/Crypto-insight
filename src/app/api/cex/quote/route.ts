import { NextRequest, NextResponse } from 'next/server'
import type { QuoteResponse, PortfolioSnapshot, AssetBalance } from '@/types'

// 模拟 CEX 资产 — 第一版用静态数据
function mockBinanceAssets(): AssetBalance[] {
  return [
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.5, price: 68500, value: 34250, change24h: -0.82 },
    { symbol: 'ETH', name: 'Ethereum', balance: 10, price: 3200.5, value: 32005, change24h: 2.35 },
    { symbol: 'USDT', name: 'Tether', balance: 15000, price: 1.0, value: 15000, change24h: 0.01 },
    { symbol: 'BNB', name: 'BNB', balance: 20, price: 605.2, value: 12104, change24h: 1.45 },
  ]
}

function mockOkxAssets(): AssetBalance[] {
  return [
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.2, price: 68500, value: 13700, change24h: -0.82 },
    { symbol: 'ETH', name: 'Ethereum', balance: 5, price: 3200.5, value: 16002.5, change24h: 2.35 },
    { symbol: 'SOL', name: 'Solana', balance: 100, price: 178.3, value: 17830, change24h: 5.12 },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const accounts: { id: string; exchange: string }[] = body.accounts || []

    const results: PortfolioSnapshot[] = accounts.map((a) => {
      let assets: AssetBalance[]
      switch (a.exchange) {
        case 'binance':
          assets = mockBinanceAssets()
          break
        case 'okx':
          assets = mockOkxAssets()
          break
        default:
          return {
            source: a.id,
            sourceType: 'cex' as const,
            assets: [],
            totalValue: 0,
            updatedAt: new Date().toISOString(),
            status: 'error' as const,
            error: `不支持的交易所: ${a.exchange}`,
          }
      }

      const totalValue = assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0)
      return {
        source: a.id,
        sourceType: 'cex' as const,
        assets,
        totalValue,
        updatedAt: new Date().toISOString(),
        status: 'success' as const,
      }
    })

    const hasError = results.some((r) => r.status === 'error')
    const response: QuoteResponse = {
      results,
      status: hasError ? 'partial' : 'success',
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        results: [],
        status: 'error',
        updatedAt: new Date().toISOString(),
      } satisfies QuoteResponse,
      { status: 400 }
    )
  }
}
