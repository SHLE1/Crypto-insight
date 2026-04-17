import type { DefiPosition, DefiProtocolSummary, DefiSnapshot, WalletInput } from '@/types'
import { getMobulaChains } from '@/lib/defi/chains'

interface MobulaToken {
  address?: string
  symbol?: string
  name?: string
  amountFormatted?: number
  priceUSD?: number
  valueUSD?: number
}

interface MobulaProtocolMeta {
  id?: string
  name?: string
  url?: string
  category?: string
}

interface MobulaPosition {
  id?: string
  type?: string
  name?: string
  valueUSD?: number
  tokens?: MobulaToken[]
  rewards?: MobulaToken[]
  metadata?: Record<string, unknown>
}

interface MobulaProtocol {
  protocol?: MobulaProtocolMeta
  totalValueUSD?: string | number
  positions?: MobulaPosition[]
}

interface MobulaResponse {
  data?: {
    wallet?: string
    fetchedAt?: string
    totalValueUSD?: string | number
    totalDepositedUSD?: string | number
    totalBorrowedUSD?: string | number
    totalRewardsUSD?: string | number
    protocols?: MobulaProtocol[]
  }
}

const MOBULA_API_URL = 'https://api.mobula.io/api/2/wallet/defi-positions'
const MOBULA_DEMO_API_URL = 'https://demo-api.mobula.io/api/2/wallet/defi-positions'
const MOBULA_TIMEOUT_MS = 15_000

function toNumber(value: string | number | undefined | null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizePositionType(value?: string): DefiPosition['type'] {
  switch (value) {
    case 'lending':
      return 'lending'
    case 'liquidity':
      return 'liquidity'
    case 'stake':
      return 'stake'
    case 'restaking':
      return 'restaking'
    case 'reward':
      return 'reward'
    case 'leverage':
    case 'perp':
      return 'perp'
    default:
      return 'unknown'
  }
}

function normalizeTokens(tokens: MobulaToken[] | undefined) {
  return (tokens ?? []).map((token) => ({
    address: token.address,
    symbol: token.symbol || 'UNKNOWN',
    name: token.name || token.symbol || 'Unknown token',
    amount: toNumber(token.amountFormatted),
    price: typeof token.priceUSD === 'number' && Number.isFinite(token.priceUSD) ? token.priceUSD : null,
    value: typeof token.valueUSD === 'number' && Number.isFinite(token.valueUSD) ? token.valueUSD : null,
  }))
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timeoutId)
  }
}

function getMobulaEndpoint(): {
  url: string
  headers: Record<string, string>
  usingDemo: boolean
} {
  const key = process.env.MOBULA_API_KEY?.trim()
  if (key) {
    return {
      url: MOBULA_API_URL,
      headers: { Authorization: key },
      usingDemo: false,
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return {
      url: MOBULA_DEMO_API_URL,
      headers: {},
      usingDemo: true,
    }
  }

  throw new Error('尚未配置 MOBULA_API_KEY')
}

function buildPosition(
  walletId: string,
  chainKey: string,
  protocol: MobulaProtocol,
  position: MobulaPosition,
  index: number
): DefiPosition {
  const protocolMeta = protocol.protocol ?? {}
  const protocolId = protocolMeta.id || `${chainKey}-${protocolMeta.name || 'protocol'}`

  return {
    id: position.id || `${walletId}-${protocolId}-${index}`,
    walletId,
    chainKey,
    protocolId,
    protocolName: protocolMeta.name || 'Unknown protocol',
    protocolUrl: protocolMeta.url,
    protocolCategory: protocolMeta.category,
    type: normalizePositionType(position.type),
    name: position.name || protocolMeta.name || 'Unnamed position',
    value: toNumber(position.valueUSD),
    tokens: normalizeTokens(position.tokens),
    rewards: normalizeTokens(position.rewards),
    metadata: position.metadata,
  }
}

export async function getMobulaDefiSnapshots(wallet: Pick<WalletInput, 'id' | 'chainType' | 'address' | 'evmChains'>): Promise<DefiSnapshot[]> {
  const chains = getMobulaChains(wallet.chainType, wallet.evmChains)

  if (wallet.chainType === 'btc' || chains.length === 0) {
    return []
  }

  const endpoint = getMobulaEndpoint()
  const results = await Promise.all(
    chains.map(async (chainKey) => {
      const url = new URL(endpoint.url)
      url.searchParams.set('wallet', wallet.address)
      url.searchParams.set('blockchains', chainKey)

      try {
        const response = await fetchWithTimeout(
          url,
          {
            method: 'GET',
            headers: endpoint.headers,
          },
          MOBULA_TIMEOUT_MS
        )

        if (response.status === 401 || response.status === 403) {
          throw new Error('DeFi 数据源鉴权失败')
        }
        if (response.status === 429) {
          throw new Error('DeFi 数据源额度或速率受限')
        }
        if (response.status >= 500) {
          throw new Error(`Mobula 服务暂时不可用（HTTP ${response.status}）`)
        }
        if (!response.ok) {
          throw new Error(`Mobula 请求失败（HTTP ${response.status}）`)
        }

        const payload = (await response.json()) as MobulaResponse
        const data = payload.data
        const warningMessage = endpoint.usingDemo ? '当前使用 Mobula demo API，数据仅供本地调试。' : null
        const protocols: DefiProtocolSummary[] = []
        const positions: DefiPosition[] = []

        ;(data?.protocols ?? []).forEach((protocol, protocolIndex) => {
          const protocolMeta = protocol.protocol ?? {}
          const protocolId = protocolMeta.id || `${chainKey}-${protocolMeta.name || protocolIndex}`
          const protocolName = protocolMeta.name || 'Unknown protocol'
          const protocolPositions = protocol.positions ?? []

          protocols.push({
            walletId: wallet.id,
            chainKey,
            protocolId,
            protocolName,
            protocolCategory: protocolMeta.category,
            totalValue: toNumber(protocol.totalValueUSD),
            positionCount: protocolPositions.length,
          })

          protocolPositions.forEach((position, positionIndex) => {
            positions.push(buildPosition(wallet.id, chainKey, protocol, position, positionIndex))
          })
        })

        return {
          source: `${wallet.id}:${chainKey}`,
          walletId: wallet.id,
          chainKey,
          provider: 'mobula',
          positions,
          protocols,
          totalValue: toNumber(data?.totalValueUSD),
          totalDepositedValue: toNumber(data?.totalDepositedUSD),
          totalBorrowedValue: toNumber(data?.totalBorrowedUSD),
          totalRewardsValue: toNumber(data?.totalRewardsUSD),
          updatedAt: data?.fetchedAt ?? new Date().toISOString(),
          status: warningMessage ? 'partial' : 'success',
          error: warningMessage ?? undefined,
        } satisfies DefiSnapshot
      } catch (error) {
        const message = error instanceof Error ? error.message : 'DeFi 查询失败'
        return {
          source: `${wallet.id}:${chainKey}`,
          walletId: wallet.id,
          chainKey,
          provider: 'mobula',
          positions: [],
          protocols: [],
          totalValue: 0,
          totalDepositedValue: 0,
          totalBorrowedValue: 0,
          totalRewardsValue: 0,
          updatedAt: new Date().toISOString(),
          status: 'error',
          error: message,
        } satisfies DefiSnapshot
      }
    })
  )

  return results
}
