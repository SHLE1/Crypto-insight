import { NextRequest, NextResponse } from 'next/server'
import type { ChainType, QuoteResponse } from '@/types'
import { getWalletSnapshot } from '@/lib/wallet-clients'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallets: { id: string; chainType: ChainType; address: string; evmChains?: string[] }[] = body.wallets || []
    const results = await Promise.all(wallets.map((wallet) => getWalletSnapshot(wallet)))

    const hasNonSuccess = results.some((result) => result.status !== 'success')
    const response: QuoteResponse = {
      results,
      status: hasNonSuccess ? 'partial' : 'success',
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
