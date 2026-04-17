import { NextRequest, NextResponse } from 'next/server'
import { getMobulaDefiSnapshot } from '@/lib/defi/mobula'
import type { ChainType, DefiQuoteResponse } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallets: { id: string; chainType: ChainType; address: string; evmChains?: string[] }[] = body.wallets || []
    const defiWallets = wallets.filter((wallet) => wallet.chainType === 'evm' || wallet.chainType === 'solana')
    const results = await Promise.all(defiWallets.map((wallet) => getMobulaDefiSnapshot(wallet)))

    const hasSuccess = results.some((result) => result.status === 'success')
    const hasNonSuccess = results.some((result) => result.status !== 'success')
    const response: DefiQuoteResponse = {
      results,
      status: hasSuccess ? (hasNonSuccess ? 'partial' : 'success') : results.length > 0 ? 'error' : 'success',
      updatedAt: new Date().toISOString(),
      provider: 'mobula',
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        results: [],
        status: 'error',
        updatedAt: new Date().toISOString(),
        provider: 'mobula',
        message: error instanceof Error ? error.message : 'DeFi 报价请求失败',
      },
      { status: 400 }
    )
  }
}
