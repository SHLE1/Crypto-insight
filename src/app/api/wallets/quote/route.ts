import { NextRequest, NextResponse } from 'next/server'
import type { ChainType, QuoteResponse } from '@/types'
import { getWalletSnapshot } from '@/lib/wallet-clients'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallets: { id: string; chainType: ChainType; address: string }[] = body.wallets || []
    const results = await Promise.all(wallets.map((wallet) => getWalletSnapshot(wallet)))

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
