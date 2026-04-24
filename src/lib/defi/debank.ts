import type { DefiPosition, DefiProtocolSummary, DefiSnapshot } from '@/types'
import { getDebankChainId } from '@/lib/defi/chains'

const DEBANK_PUBLIC_PROFILE_BASE = 'https://r.jina.ai/http://debank.com/profile'
const DEBANK_TIMEOUT_MS = 12_000

interface DebankProtocolBlock {
  protocolId?: string
  chainId?: string
  protocolName: string
  totalValue: number
}

function toNumber(value: string) {
  const normalized = value.replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseUsdValue(line: string) {
  const trimmed = line.trim()

  if (trimmed.startsWith('<$')) {
    return 0.01
  }

  const match = trimmed.match(/\$([0-9][0-9,]*(?:\.\d+)?)/)
  return match ? toNumber(match[1]) : 0
}

function isImageLine(line: string) {
  return /^!\[[^\]]*]\(([^)]+)\)$/.test(line)
}

function getImageUrl(line: string) {
  const match = line.match(/^!\[[^\]]*]\(([^)]+)\)$/)
  return match?.[1]
}

function getProtocolIdFromImage(url: string | undefined) {
  const match = url?.match(/\/image\/project\/logo_url\/([^/]+)\//)
  return match?.[1]
}

function getChainIdFromImage(url: string | undefined) {
  const match = url?.match(/\/image\/chain\/logo_url\/([^/]+)\//)
  return match?.[1]
}

function normalizeLines(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseProtocolBlocks(markdown: string) {
  const lines = normalizeLines(markdown)
  const blocks: DebankProtocolBlock[] = []

  for (let index = 0; index < lines.length - 3; index += 1) {
    const projectImageUrl = getImageUrl(lines[index])
    const chainImageUrl = getImageUrl(lines[index + 1])

    if (!projectImageUrl || !chainImageUrl) {
      continue
    }

    const protocolId = getProtocolIdFromImage(projectImageUrl)
    const chainId = getChainIdFromImage(chainImageUrl)
    const protocolName = lines[index + 2]
    const valueLine = lines[index + 3]

    if (!protocolId || !chainId || isImageLine(protocolName)) {
      continue
    }

    const totalValue = parseUsdValue(valueLine)
    if (!valueLine.includes('$')) {
      continue
    }

    blocks.push({
      protocolId,
      chainId,
      protocolName,
      totalValue,
    })
  }

  return blocks
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildSyntheticPosition(
  walletId: string,
  address: string,
  chainKey: string,
  protocol: DebankProtocolBlock,
  index: number
): DefiPosition {
  const protocolId = protocol.protocolId || `${chainKey}-${protocol.protocolName}-${index}`

  return {
    id: `${walletId}-${chainKey}-${protocolId}-${index}`,
    walletId,
    chainKey,
    protocolId,
    protocolName: protocol.protocolName,
    protocolUrl: `https://debank.com/profile/${address}?chain=${getDebankChainId(chainKey) ?? chainKey}`,
    protocolCategory: 'public-page-fallback',
    type: 'unknown',
    name: protocol.protocolName,
    value: protocol.totalValue,
    tokens: [],
    rewards: [],
    metadata: {
      provider: 'debank',
      synthetic: true,
    },
  }
}

export async function getDebankFallbackSnapshot({
  walletId,
  address,
  chainKey,
}: {
  walletId: string
  address: string
  chainKey: string
}): Promise<DefiSnapshot | null> {
  const debankChainId = getDebankChainId(chainKey)
  if (!debankChainId) {
    return null
  }

  const url = `${DEBANK_PUBLIC_PROFILE_BASE}/${address}?chain=${debankChainId}`

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'text/plain, text/markdown;q=0.9, */*;q=0.8',
          'User-Agent': 'Mozilla/5.0 Crypto-Insight/1.0',
        },
      },
      DEBANK_TIMEOUT_MS
    )

    if (!response.ok) {
      throw new Error(`DeBank 公共页兜底失败（HTTP ${response.status}）`)
    }

    const markdown = await response.text()
    const protocolBlocks = parseProtocolBlocks(markdown)
      .filter((block) => block.chainId === debankChainId)
      .filter((block) => block.totalValue > 0)

    if (protocolBlocks.length === 0) {
      return null
    }

    const protocols: DefiProtocolSummary[] = protocolBlocks.map((block, index) => ({
      walletId,
      chainKey,
      protocolId: block.protocolId || `${chainKey}-${index}`,
      protocolName: block.protocolName,
      protocolCategory: 'public-page-fallback',
      totalValue: block.totalValue,
      positionCount: 1,
    }))

    const positions = protocolBlocks.map((block, index) => buildSyntheticPosition(walletId, address, chainKey, block, index))
    const totalValue = protocolBlocks.reduce((sum, block) => sum + block.totalValue, 0)

    return {
      source: `${walletId}:${chainKey}`,
      walletId,
      chainKey,
      provider: 'debank',
      positions,
      protocols,
      totalValue,
      totalDepositedValue: totalValue,
      totalBorrowedValue: 0,
      totalRewardsValue: 0,
      updatedAt: new Date().toISOString(),
      status: 'partial',
    }
  } catch {
    return null
  }
}
