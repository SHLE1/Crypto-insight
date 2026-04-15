import { NextRequest, NextResponse } from 'next/server'
import type { CexAccountInput, QuoteResponse } from '@/types'
import { getCexSnapshot } from '@/lib/cex-clients'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const accounts: CexAccountInput[] = body.accounts || []
    const results = await Promise.all(accounts.map((account) => getCexSnapshot(account)))

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
