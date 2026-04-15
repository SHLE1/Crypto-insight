import { NextRequest, NextResponse } from 'next/server'
import type { QuoteResponse, PortfolioSnapshot, AssetBalance } from '@/types'

// 模拟钱包余额 — 第一版用静态数据演示流程
function mockEvmAssets(): AssetBalance[] {
  return [
    { symbol: 'ETH', name: 'Ethereum', balance: 2.5, price: 3200.5, value: 8001.25, change24h: 2.35 },
    { symbol: 'USDT', name: 'Tether', balance: 5000, price: 1.0, value: 5000, change24h: 0.01 },
    { symbol: 'LINK', name: 'Chainlink', balance: 150, price: 14.82, value: 2223, change24h: 1.89 },
  ]
}

function mockSolanaAssets(): AssetBalance[] {
  return [
    { symbol: 'SOL', name: 'Solana', balance: 30, price: 178.3, value: 5349, change24h: 5.12 },
  ]
}

function mockBtcAssets(): AssetBalance[] {
  return [
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.15, price: 68500, value: 10275, change24h: -0.82 },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallets: { id: string; chainType: string; address: string }[] = body.wallets || []

    const results: PortfolioSnapshot[] = wallets.map((w) => {
      let assets: AssetBalance[]
      switch (w.chainType) {
        case 'evm':
          assets = mockEvmAssets()
          break
        case 'solana':
          assets = mockSolanaAssets()
          break
        case 'btc':
          assets = mockBtcAssets()
          break
        default:
          return {
            source: w.id,
            sourceType: 'wallet' as const,
            assets: [],
            totalValue: 0,
            updatedAt: new Date().toISOString(),
            status: 'error' as const,
            error: `不支持的链类型: ${w.chainType}`,
          }
      }

      const totalValue = assets.reduce((sum, a) => sum + (a.value ?? 0), 0)
      return {
        source: w.id,
        sourceType: 'wallet' as const,
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
