import { NextRequest, NextResponse } from 'next/server'
import { getDefiSnapshots } from '@/lib/defi/providers'
import type { DefiQuoteResponse, DefiSnapshot, ManualDefiSource, WalletQuoteInput } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const wallets: WalletQuoteInput[] = body.wallets || []
    const manualSources: ManualDefiSource[] = Array.isArray(body.manualSources) ? body.manualSources : []
    const cursor = typeof body.cursor === 'number' ? body.cursor : 0
    const mode = body.mode === 'full' ? 'full' : 'single'
    const maxWalletsPerRequest = 1
    const defiWallets = wallets.filter((wallet) => wallet.chainType === 'evm' || wallet.chainType === 'solana')

    if (defiWallets.length === 0) {
      return NextResponse.json({
        results: [],
        status: 'success',
        updatedAt: new Date().toISOString(),
        provider: 'zerion',
        cursor,
        nextCursor: null,
        hasMore: false,
      })
    }

    const startIndex = Math.max(0, Math.min(cursor, Math.max(defiWallets.length - 1, 0)))
    const walletChunk =
      mode === 'full'
        ? [...defiWallets.slice(startIndex), ...defiWallets.slice(0, startIndex)]
        : defiWallets.slice(startIndex, startIndex + maxWalletsPerRequest)

    const chunkResults: DefiSnapshot[][] = []
    for (const wallet of walletChunk) {
      chunkResults.push(await getDefiSnapshots(wallet, manualSources))
    }
    const results = chunkResults.flat()

    const successCount = results.filter((result) => result.status === 'success').length
    const partialCount = results.filter((result) => result.status === 'partial').length
    const hasGoodResult = successCount > 0 || partialCount > 0
    const nextCursor =
      mode === 'full'
        ? 0
        : startIndex + walletChunk.length < defiWallets.length
          ? startIndex + walletChunk.length
          : 0

    const response: DefiQuoteResponse & {
      cursor: number
      nextCursor: number | null
      hasMore: boolean
      processedWalletIds: string[]
      summary: { successCount: number; partialCount: number; errorCount: number }
    } = {
      results: results as DefiSnapshot[],
      status: hasGoodResult ? (results.some((result) => result.status !== 'success') ? 'partial' : 'success') : 'error',
      updatedAt: new Date().toISOString(),
      provider: 'zerion',
      cursor: startIndex,
      nextCursor,
      hasMore: mode === 'full' ? false : startIndex + walletChunk.length < defiWallets.length,
      processedWalletIds: walletChunk.map((wallet) => wallet.id),
      summary: {
        successCount,
        partialCount,
        errorCount: results.filter((result) => result.status === 'error').length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        results: [],
        status: 'error',
        updatedAt: new Date().toISOString(),
        provider: 'zerion',
        message: error instanceof Error ? error.message : 'DeFi 报价请求失败',
        cursor: 0,
        nextCursor: null,
        hasMore: false,
      },
      { status: 400 }
    )
  }
}
