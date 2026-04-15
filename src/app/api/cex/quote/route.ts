import { NextRequest, NextResponse } from 'next/server'
import type { CexAccountInput, QuoteResponse } from '@/types'
import { getCexSnapshot } from '@/lib/cex-clients'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const accounts: CexAccountInput[] = body.accounts || []
    const results = await Promise.all(accounts.map((account) => getCexSnapshot(account)))

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
