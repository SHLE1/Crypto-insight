import type { DefiPosition, DefiProtocolSummary, DefiSnapshot, DefiTokenBalance, ManualDefiSource, WalletInput, WalletQuoteInput } from '@/types'
import { getBitwayEarnSnapshot } from '@/lib/defi/bitway'
import { getDebankFallbackSnapshot } from '@/lib/defi/debank'
import { getManualDefiSnapshots } from '@/lib/defi/manual'
import {
  getDefiChainKeyFromZapperChainId,
  getDefiChains,
  getMoralisChainId,
  getZapperChainIds,
} from '@/lib/defi/chains'

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql'
const MORALIS_API_URL = 'https://deep-index.moralis.io/api/v2.2'
const ZAPPER_TIMEOUT_MS = 15_000
const MORALIS_TIMEOUT_MS = 15_000
const ZAPPER_PAGE_SIZE = 50
const ZAPPER_POSITION_PAGE_SIZE = 100
const ZAPPER_MIN_BALANCE_USD = 0.01

interface ZapperGraphqlResponse {
  data?: {
    portfolioV2?: {
      appBalances?: {
        totalBalanceUSD?: number
        byApp?: {
          totalCount?: number
          pageInfo?: {
            hasNextPage?: boolean
            endCursor?: string | null
          }
          edges?: ZapperAppBalanceEdge[]
        }
      }
    }
  }
  errors?: Array<{ message?: string }>
}

interface ZapperAppBalanceEdge {
  node?: {
    balanceUSD?: number
    app?: {
      displayName?: string
      slug?: string
      url?: string
      category?: {
        name?: string
      }
    }
    network?: {
      name?: string
      slug?: string
      chainId?: number
    }
    positionBalances?: {
      totalCount?: number
      edges?: Array<{
        node?: ZapperPositionNode
      }>
    }
  }
}

type ZapperPositionNode = ZapperAppTokenPosition | ZapperContractPosition

interface ZapperDisplayProps {
  label?: string
  images?: string[]
  balanceDisplayMode?: string | null
}

interface ZapperAbstractToken {
  __typename?: 'BaseTokenPositionBalance' | 'AppTokenPositionBalance' | 'NonFungiblePositionBalance'
  type?: string
  address?: string
  network?: string
  balance?: string
  balanceUSD?: number
  price?: number
  symbol?: string
  decimals?: number
  tokens?: ZapperAbstractToken[]
  appId?: string
  supply?: number
  pricePerShare?: number[]
  assets?: Array<{
    balance?: number
    balanceUSD?: number
    assetImg?: string
    assetName?: string
    tokenId?: string
  }>
}

interface ZapperTokenWithMetaType {
  metaType?: 'WALLET' | 'SUPPLIED' | 'BORROWED' | 'CLAIMABLE' | 'VESTING' | 'LOCKED' | 'NFT'
  token?: ZapperAbstractToken
}

interface ZapperAppTokenPosition {
  __typename?: 'AppTokenPositionBalance'
  type?: string
  address?: string
  network?: string
  symbol?: string
  decimals?: number
  balance?: string
  balanceUSD?: number
  price?: number
  appId?: string
  groupId?: string
  groupLabel?: string
  displayProps?: ZapperDisplayProps
  tokens?: ZapperAbstractToken[]
}

interface ZapperContractPosition {
  __typename?: 'ContractPositionBalance'
  type?: string
  key?: string
  address?: string
  network?: string
  appId?: string
  groupId?: string
  groupLabel?: string
  displayProps?: ZapperDisplayProps
  balanceUSD?: number
  tokens?: ZapperTokenWithMetaType[]
}

interface MoralisToken {
  contract_address?: string
  name?: string
  symbol?: string
  balance_formatted?: string | number
  usd_price?: string | number
  usd_value?: string | number
}

interface MoralisPositionDetails {
  is_debt?: boolean
  is_variable_debt?: boolean
  is_stable_debt?: boolean
}

interface MoralisPositionItem {
  protocol_name?: string
  protocol_id?: string
  protocol_url?: string
  protocol_logo?: string
  position?: {
    label?: string
    tokens?: MoralisToken[]
    balance_usd?: string | number
    total_unclaimed_usd_value?: string | number
    address?: string
    position_details?: MoralisPositionDetails
  }
}

const ZAPPER_DEFI_QUERY = `
  query WalletDefi(
    $addresses: [Address!]!
    $chainIds: [Int!]
    $first: Int!
    $after: String
    $minBalanceUSD: Float
    $positionsFirst: Int!
  ) {
    portfolioV2(addresses: $addresses, chainIds: $chainIds) {
      appBalances {
        totalBalanceUSD
        byApp(first: $first, after: $after, filters: { minBalanceUSD: $minBalanceUSD }) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              balanceUSD
              app {
                displayName
                slug
                url
                category {
                  name
                }
              }
              network {
                name
                slug
                chainId
              }
              positionBalances(first: $positionsFirst) {
                totalCount
                edges {
                  node {
                    __typename
                    ... on AppTokenPositionBalance {
                      type
                      address
                      network
                      symbol
                      decimals
                      balance
                      balanceUSD
                      price
                      appId
                      groupId
                      groupLabel
                      displayProps {
                        label
                        images
                        balanceDisplayMode
                      }
                      tokens {
                        __typename
                        ... on BaseTokenPositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                        }
                        ... on AppTokenPositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                          appId
                          supply
                          pricePerShare
                          tokens {
                            __typename
                            ... on BaseTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                            }
                            ... on AppTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                              appId
                              supply
                              pricePerShare
                            }
                          }
                        }
                        ... on NonFungiblePositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                        }
                      }
                    }
                    ... on ContractPositionBalance {
                      type
                      key
                      address
                      network
                      appId
                      groupId
                      groupLabel
                      balanceUSD
                      displayProps {
                        label
                        images
                        balanceDisplayMode
                      }
                      tokens {
                        metaType
                        token {
                          __typename
                          ... on BaseTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                          }
                          ... on AppTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                            appId
                            supply
                            pricePerShare
                            tokens {
                              __typename
                              ... on BaseTokenPositionBalance {
                                type
                                address
                                network
                                balance
                                balanceUSD
                                price
                                symbol
                                decimals
                              }
                              ... on AppTokenPositionBalance {
                                type
                                address
                                network
                                balance
                                balanceUSD
                                price
                                symbol
                                decimals
                                appId
                                supply
                                pricePerShare
                              }
                            }
                          }
                          ... on NonFungiblePositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

function toNumber(value: string | number | undefined | null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function buildEmptySnapshot(
  walletId: string,
  chainKey: string,
  provider: 'zapper' | 'moralis',
  status: 'success' | 'error' = 'success',
  error?: string
): DefiSnapshot {
  return {
    source: `${walletId}:${chainKey}`,
    walletId,
    chainKey,
    provider,
    positions: [],
    protocols: [],
    totalValue: 0,
    totalDepositedValue: 0,
    totalBorrowedValue: 0,
    totalRewardsValue: 0,
    updatedAt: new Date().toISOString(),
    status,
    error,
  }
}

function isEmptySnapshot(snapshot: DefiSnapshot) {
  return snapshot.positions.length === 0 && snapshot.totalValue === 0
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

function normalizeDefiToken(token: {
  address?: string
  symbol?: string
  name?: string
  amount?: string | number
  price?: number
  value?: number
}): DefiTokenBalance {
  return {
    address: token.address,
    symbol: token.symbol || 'UNKNOWN',
    name: token.name || token.symbol || 'Unknown token',
    amount: toNumber(token.amount),
    price: typeof token.price === 'number' && Number.isFinite(token.price) ? token.price : null,
    value: typeof token.value === 'number' && Number.isFinite(token.value) ? token.value : null,
  }
}

function flattenZapperToken(token: ZapperAbstractToken | undefined, bucket: DefiTokenBalance[]) {
  if (!token) {
    return
  }

  bucket.push(
    normalizeDefiToken({
      address: token.address,
      symbol: token.symbol,
      name: token.symbol,
      amount: token.balance,
      price: typeof token.price === 'number' && Number.isFinite(token.price) ? token.price : undefined,
      value: typeof token.balanceUSD === 'number' && Number.isFinite(token.balanceUSD) ? token.balanceUSD : undefined,
    })
  )

  ;(token.tokens ?? []).forEach((child) => flattenZapperToken(child, bucket))
}

function dedupeDefiTokens(tokens: DefiTokenBalance[]) {
  const aggregated = new Map<string, DefiTokenBalance>()

  tokens.forEach((token, index) => {
    const key = `${token.address ?? token.symbol}:${token.name}:${index}`
    const existing = aggregated.get(key)
    if (existing) {
      existing.amount += token.amount
      existing.value = (existing.value ?? 0) + (token.value ?? 0)
      return
    }

    aggregated.set(key, { ...token })
  })

  return Array.from(aggregated.values())
}

function normalizeZapperPositionType(
  node: ZapperPositionNode,
  protocolCategory?: string,
  metaTypes: Array<ZapperTokenWithMetaType['metaType']> = []
): DefiPosition['type'] {
  const text = `${protocolCategory ?? ''} ${'groupLabel' in node ? node.groupLabel ?? '' : ''} ${node.type ?? ''}`.toLowerCase()

  if (metaTypes.includes('CLAIMABLE')) {
    return 'reward'
  }
  if (text.includes('restak')) {
    return 'restaking'
  }
  if (text.includes('stake')) {
    return 'stake'
  }
  if (text.includes('perp') || text.includes('leverag')) {
    return 'perp'
  }
  if (text.includes('liquidity') || text.includes('pool') || text.includes('lp') || text.includes('amm')) {
    return 'liquidity'
  }
  if (metaTypes.includes('BORROWED') || text.includes('lend') || text.includes('borrow')) {
    return 'lending'
  }

  return 'unknown'
}

function buildZapperPosition({
  walletId,
  chainKey,
  protocolId,
  protocolName,
  protocolUrl,
  protocolCategory,
  node,
  index,
}: {
  walletId: string
  chainKey: string
  protocolId: string
  protocolName: string
  protocolUrl?: string
  protocolCategory?: string
  node: ZapperPositionNode
  index: number
}): {
  position: DefiPosition
  depositedValue: number
  borrowedValue: number
  rewardsValue: number
} {
  if (node.__typename === 'ContractPositionBalance') {
    const contractNode = node as ZapperContractPosition
    const tokens = dedupeDefiTokens(
      (contractNode.tokens ?? [])
        .filter((item) => item.metaType !== 'CLAIMABLE')
        .flatMap((item) => {
          const flattened: DefiTokenBalance[] = []
          flattenZapperToken(item.token, flattened)
          return flattened
        })
    )

    const rewards = dedupeDefiTokens(
      (contractNode.tokens ?? [])
        .filter((item) => item.metaType === 'CLAIMABLE')
        .flatMap((item) => {
          const flattened: DefiTokenBalance[] = []
          flattenZapperToken(item.token, flattened)
          return flattened
        })
    )

    const borrowedValue = (contractNode.tokens ?? [])
      .filter((item) => item.metaType === 'BORROWED')
      .reduce((sum, item) => sum + toNumber(item.token?.balanceUSD), 0)

    const rewardsValue = (contractNode.tokens ?? [])
      .filter((item) => item.metaType === 'CLAIMABLE')
      .reduce((sum, item) => sum + toNumber(item.token?.balanceUSD), 0)

    const depositedValue = (contractNode.tokens ?? [])
      .filter((item) => !item.metaType || ['SUPPLIED', 'WALLET', 'LOCKED', 'VESTING', 'NFT'].includes(item.metaType))
      .reduce((sum, item) => sum + toNumber(item.token?.balanceUSD), 0)

    return {
      position: {
        id: contractNode.key || `${walletId}-${protocolId}-${index}`,
        walletId,
        chainKey,
        protocolId,
        protocolName,
        protocolUrl,
        protocolCategory,
        type: normalizeZapperPositionType(
          contractNode,
          protocolCategory,
          (contractNode.tokens ?? []).map((item) => item.metaType)
        ),
        name: contractNode.displayProps?.label || contractNode.groupLabel || protocolName,
        value: toNumber(contractNode.balanceUSD),
        tokens,
        rewards,
        metadata: {
          provider: 'zapper',
          kind: 'contract-position',
          appId: contractNode.appId,
          groupId: contractNode.groupId,
          groupLabel: contractNode.groupLabel,
        },
      },
      depositedValue: depositedValue > 0 ? depositedValue : Math.max(0, toNumber(contractNode.balanceUSD) - borrowedValue),
      borrowedValue,
      rewardsValue,
    }
  }

  const appTokenNode = node as ZapperAppTokenPosition
  const flattenedTokens: DefiTokenBalance[] = []
  ;(appTokenNode.tokens ?? []).forEach((token) => flattenZapperToken(token, flattenedTokens))

  return {
    position: {
      id: `${walletId}-${protocolId}-${appTokenNode.address ?? index}`,
      walletId,
      chainKey,
      protocolId,
      protocolName,
      protocolUrl,
      protocolCategory,
      type: normalizeZapperPositionType(appTokenNode, protocolCategory),
      name: appTokenNode.displayProps?.label || appTokenNode.groupLabel || appTokenNode.symbol || protocolName,
      value: toNumber(appTokenNode.balanceUSD),
      tokens: dedupeDefiTokens(flattenedTokens),
      rewards: [],
      metadata: {
        provider: 'zapper',
        kind: 'app-token-position',
        appId: appTokenNode.appId,
        groupId: appTokenNode.groupId,
        groupLabel: appTokenNode.groupLabel,
      },
    },
    depositedValue: toNumber(appTokenNode.balanceUSD),
    borrowedValue: 0,
    rewardsValue: 0,
  }
}

async function getZapperSnapshots(wallet: WalletQuoteInput) {
  const chainKeys = getDefiChains(wallet.chainType, wallet.evmChains)
  const chainIds = getZapperChainIds(chainKeys)
  const apiKey = process.env.ZAPPER_API_KEY?.trim()

  if (!apiKey) {
    return new Map<string, DefiSnapshot>(
      chainKeys.map((chainKey) => [
        chainKey,
        buildEmptySnapshot(wallet.id, chainKey, 'zapper', 'error', '尚未配置 ZAPPER_API_KEY'),
      ])
    )
  }

  let after: string | null = null
  const edges: ZapperAppBalanceEdge[] = []

  for (let page = 0; page < 10; page += 1) {
    const response = await fetchWithTimeout(
      ZAPPER_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-zapper-api-key': apiKey,
        },
        body: JSON.stringify({
          query: ZAPPER_DEFI_QUERY,
          variables: {
            addresses: [wallet.address],
            chainIds,
            first: ZAPPER_PAGE_SIZE,
            after,
            minBalanceUSD: ZAPPER_MIN_BALANCE_USD,
            positionsFirst: ZAPPER_POSITION_PAGE_SIZE,
          },
        }),
      },
      ZAPPER_TIMEOUT_MS
    )

    if (response.status === 401 || response.status === 403) {
      throw new Error('Zapper 鉴权失败')
    }
    if (response.status === 429) {
      throw new Error('Zapper 额度或速率受限')
    }
    if (response.status >= 500) {
      throw new Error(`Zapper 服务暂时不可用（HTTP ${response.status}）`)
    }
    if (!response.ok) {
      throw new Error(`Zapper 请求失败（HTTP ${response.status}）`)
    }

    const payload = (await response.json()) as ZapperGraphqlResponse
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((item) => item.message).filter(Boolean).join('；') || 'Zapper 查询失败')
    }

    const pageData = payload.data?.portfolioV2?.appBalances?.byApp
    edges.push(...(pageData?.edges ?? []))

    if (!pageData?.pageInfo?.hasNextPage || !pageData.pageInfo.endCursor) {
      break
    }

    after = pageData.pageInfo.endCursor
  }

  const protocolMap = new Map<string, DefiProtocolSummary>()
  const snapshotMap = new Map(
    chainKeys.map((chainKey) => [
      chainKey,
      buildEmptySnapshot(wallet.id, chainKey, 'zapper'),
    ])
  )

  edges.forEach((edge, edgeIndex) => {
    const node = edge.node
    const chainKey = getDefiChainKeyFromZapperChainId(node?.network?.chainId ?? 0)
    if (!node || !chainKey || !snapshotMap.has(chainKey)) {
      return
    }

    const snapshot = snapshotMap.get(chainKey)
    if (!snapshot) {
      return
    }

    const protocolId = node.app?.slug || `${chainKey}-protocol-${edgeIndex}`
    const protocolName = node.app?.displayName || 'Unknown protocol'
    const protocolCategory = node.app?.category?.name
    const protocolUrl = node.app?.url
    const protocolSummaryKey = `${chainKey}:${protocolId}`

    const existingProtocol = protocolMap.get(protocolSummaryKey)
    const positionNodes =
      node.positionBalances?.edges
        ?.map((positionEdge) => positionEdge.node)
        .filter((positionNode): positionNode is ZapperPositionNode => Boolean(positionNode)) ?? []

    if (existingProtocol) {
      existingProtocol.totalValue += toNumber(node.balanceUSD)
      existingProtocol.positionCount += positionNodes.length
    } else {
      protocolMap.set(protocolSummaryKey, {
        walletId: wallet.id,
        chainKey,
        protocolId,
        protocolName,
        protocolCategory,
        totalValue: toNumber(node.balanceUSD),
        positionCount: positionNodes.length,
      })
    }

    positionNodes.forEach((positionNode, positionIndex) => {
      const { position, depositedValue, borrowedValue, rewardsValue } = buildZapperPosition({
        walletId: wallet.id,
        chainKey,
        protocolId,
        protocolName,
        protocolUrl,
        protocolCategory,
        node: positionNode,
        index: positionIndex,
      })

      snapshot.positions.push(position)
      snapshot.totalValue += position.value
      snapshot.totalDepositedValue += depositedValue
      snapshot.totalBorrowedValue += borrowedValue
      snapshot.totalRewardsValue += rewardsValue
    })
  })

  snapshotMap.forEach((snapshot, chainKey) => {
    snapshot.protocols = Array.from(protocolMap.values()).filter((protocol) => protocol.chainKey === chainKey)
    snapshot.updatedAt = new Date().toISOString()
  })

  return snapshotMap
}

function normalizeMoralisPositionType(label?: string, details?: MoralisPositionDetails): DefiPosition['type'] {
  const text = (label ?? '').toLowerCase()

  if (details?.is_debt || text.includes('borrow') || text.includes('lend')) {
    return 'lending'
  }
  if (text.includes('restak')) {
    return 'restaking'
  }
  if (text.includes('stake')) {
    return 'stake'
  }
  if (text.includes('liquidity') || text.includes('lp') || text.includes('pool')) {
    return 'liquidity'
  }
  if (text.includes('reward')) {
    return 'reward'
  }
  if (text.includes('perp') || text.includes('leverag')) {
    return 'perp'
  }

  return 'unknown'
}

async function getMoralisSnapshot(wallet: Pick<WalletInput, 'id' | 'address'>, chainKey: string): Promise<DefiSnapshot> {
  const moralisChain = getMoralisChainId(chainKey)
  const apiKey = process.env.MORALIS_API_KEY?.trim()

  if (!moralisChain) {
    return buildEmptySnapshot(wallet.id, chainKey, 'moralis')
  }

  if (!apiKey) {
    return buildEmptySnapshot(wallet.id, chainKey, 'moralis', 'error', '尚未配置 MORALIS_API_KEY')
  }

  const url = new URL(`${MORALIS_API_URL}/wallets/${wallet.address}/defi/positions`)
  url.searchParams.set('chain', moralisChain)

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
      },
      MORALIS_TIMEOUT_MS
    )

    if (response.status === 401 || response.status === 403) {
      throw new Error('Moralis 鉴权失败')
    }
    if (response.status === 429) {
      throw new Error('Moralis 额度或速率受限')
    }
    if (response.status >= 500) {
      throw new Error(`Moralis 服务暂时不可用（HTTP ${response.status}）`)
    }
    if (!response.ok) {
      throw new Error(`Moralis 请求失败（HTTP ${response.status}）`)
    }

    const payload = (await response.json()) as MoralisPositionItem[]
    const protocolMap = new Map<string, DefiProtocolSummary>()
    const positions: DefiPosition[] = []
    let totalValue = 0
    let totalDepositedValue = 0
    let totalBorrowedValue = 0
    let totalRewardsValue = 0

    payload.forEach((item, index) => {
      const protocolId = item.protocol_id || `${chainKey}-moralis-${index}`
      const protocolName = item.protocol_name || 'Unknown protocol'
      const position = item.position
      const positionValue = toNumber(position?.balance_usd)
      const rewardsValue = toNumber(position?.total_unclaimed_usd_value)
      const isDebt = Boolean(position?.position_details?.is_debt)

      const normalizedPosition: DefiPosition = {
        id: `${wallet.id}-${protocolId}-${index}`,
        walletId: wallet.id,
        chainKey,
        protocolId,
        protocolName,
        protocolUrl: item.protocol_url,
        type: normalizeMoralisPositionType(position?.label, position?.position_details),
        name: position?.label || protocolName,
        value: positionValue,
        tokens: (position?.tokens ?? []).map((token) =>
          normalizeDefiToken({
            address: token.contract_address,
            symbol: token.symbol,
            name: token.name,
            amount: token.balance_formatted,
            price: toNumber(token.usd_price),
            value: toNumber(token.usd_value),
          })
        ),
        rewards: [],
        metadata: {
          provider: 'moralis',
          protocolLogo: item.protocol_logo,
          positionAddress: position?.address,
          positionDetails: position?.position_details,
        },
      }

      positions.push(normalizedPosition)
      totalValue += positionValue
      totalRewardsValue += rewardsValue
      if (isDebt) {
        totalBorrowedValue += positionValue
      } else {
        totalDepositedValue += positionValue
      }

      const existingProtocol = protocolMap.get(protocolId)
      if (existingProtocol) {
        existingProtocol.totalValue += positionValue
        existingProtocol.positionCount += 1
      } else {
        protocolMap.set(protocolId, {
          walletId: wallet.id,
          chainKey,
          protocolId,
          protocolName,
          totalValue: positionValue,
          positionCount: 1,
        })
      }
    })

    return {
      source: `${wallet.id}:${chainKey}`,
      walletId: wallet.id,
      chainKey,
      provider: 'moralis',
      positions,
      protocols: Array.from(protocolMap.values()),
      totalValue,
      totalDepositedValue,
      totalBorrowedValue,
      totalRewardsValue,
      updatedAt: new Date().toISOString(),
      status: 'success',
    }
  } catch (error) {
    return buildEmptySnapshot(
      wallet.id,
      chainKey,
      'moralis',
      'error',
      error instanceof Error ? error.message : 'Moralis 查询失败'
    )
  }
}

function decorateFallbackSnapshot(snapshot: DefiSnapshot, message: string): DefiSnapshot {
  return {
    ...snapshot,
    status: 'partial',
    error: message,
  }
}

function mergeDefiSnapshots(primary: DefiSnapshot, supplemental: DefiSnapshot): DefiSnapshot {
  const existingPositionIds = new Set(primary.positions.map((position) => position.id))
  const positionsToAdd = supplemental.positions.filter((position) => !existingPositionIds.has(position.id))

  if (positionsToAdd.length === 0) {
    return primary
  }

  const protocolMap = new Map<string, DefiProtocolSummary>(
    primary.protocols.map((protocol) => [protocol.protocolId, { ...protocol }])
  )

  supplemental.protocols.forEach((protocol) => {
    const existing = protocolMap.get(protocol.protocolId)
    if (existing) {
      existing.totalValue += protocol.totalValue
      existing.positionCount += protocol.positionCount
      return
    }

    protocolMap.set(protocol.protocolId, { ...protocol })
  })

  return {
    ...primary,
    positions: [...primary.positions, ...positionsToAdd],
    protocols: Array.from(protocolMap.values()),
    totalValue: primary.totalValue + supplemental.totalValue,
    totalDepositedValue: primary.totalDepositedValue + supplemental.totalDepositedValue,
    totalBorrowedValue: primary.totalBorrowedValue + supplemental.totalBorrowedValue,
    totalRewardsValue: primary.totalRewardsValue + supplemental.totalRewardsValue,
    updatedAt: new Date().toISOString(),
  }
}

function buildFallbackMessage(
  source: 'zapper-empty' | 'zapper-error',
  fallback: 'moralis' | 'debank',
  detail?: string
) {
  const prefix =
    source === 'zapper-empty'
      ? 'Zapper 未识别到该链 DeFi 仓位'
      : `Zapper 查询失败${detail ? `（${detail}）` : ''}`

  if (fallback === 'moralis') {
    return `${prefix}，已回退到 Moralis。`
  }

  return `${prefix}，Moralis 未返回可用结果，已回退到 DeBank 公共页面兜底。`
}

async function resolveChainSnapshot(
  wallet: Pick<WalletInput, 'id' | 'address'>,
  chainKey: string,
  zapperSnapshot: DefiSnapshot,
  manualSources: ManualDefiSource[] = []
): Promise<DefiSnapshot> {
  const zapperFailed = zapperSnapshot.status === 'error'
  const zapperEmpty = isEmptySnapshot(zapperSnapshot)
  const bitwaySnapshot = await getBitwayEarnSnapshot(wallet, chainKey)
  const manualSnapshot = await getManualDefiSnapshots(wallet, chainKey, manualSources)

  if (!zapperFailed && !zapperEmpty) {
    const withBitway = bitwaySnapshot ? mergeDefiSnapshots(zapperSnapshot, bitwaySnapshot) : zapperSnapshot
    return manualSnapshot ? mergeDefiSnapshots(withBitway, manualSnapshot) : withBitway
  }

  if (chainKey === 'solana') {
    return zapperSnapshot
  }

  if (bitwaySnapshot) {
    const withManual = manualSnapshot ? mergeDefiSnapshots(bitwaySnapshot, manualSnapshot) : bitwaySnapshot
    return decorateFallbackSnapshot(
      withManual,
      'Zapper 未识别到该链 DeFi 仓位，已补充 Bitway Earn 链上读取结果。'
    )
  }

  if (manualSnapshot) {
    return decorateFallbackSnapshot(
      manualSnapshot,
      'Zapper 未识别到该链 DeFi 仓位，已补充手动链上读取结果。'
    )
  }

  const moralisSnapshot = await getMoralisSnapshot(wallet, chainKey)
  if (!isEmptySnapshot(moralisSnapshot) && moralisSnapshot.status !== 'error') {
    return decorateFallbackSnapshot(
      moralisSnapshot,
      buildFallbackMessage(zapperFailed ? 'zapper-error' : 'zapper-empty', 'moralis', zapperSnapshot.error)
    )
  }

  const debankFallback = await getDebankFallbackSnapshot({
    walletId: wallet.id,
    address: wallet.address,
    chainKey,
  })

  if (debankFallback) {
    return {
      ...debankFallback,
      error: buildFallbackMessage(zapperFailed ? 'zapper-error' : 'zapper-empty', 'debank', zapperSnapshot.error),
    }
  }

  if (zapperFailed && moralisSnapshot.status === 'error') {
    return {
      ...moralisSnapshot,
      error: `Zapper 查询失败（${zapperSnapshot.error ?? '未知错误'}）；Moralis 查询失败（${moralisSnapshot.error ?? '未知错误'}）。`,
    }
  }

  if (zapperFailed && moralisSnapshot.status === 'success') {
    return decorateFallbackSnapshot(
      moralisSnapshot,
      `Zapper 查询失败（${zapperSnapshot.error ?? '未知错误'}），Moralis 未识别到该链可计价 DeFi 仓位。`
    )
  }

  return zapperSnapshot
}

export async function getDefiSnapshots(wallet: WalletQuoteInput, manualSources: ManualDefiSource[] = []): Promise<DefiSnapshot[]> {
  const chainKeys = Array.from(
    new Set([
      ...getDefiChains(wallet.chainType, wallet.evmChains),
      ...manualSources.filter((source) => source.enabled).map((source) => source.chainKey),
    ])
  )

  if (wallet.chainType === 'btc' || chainKeys.length === 0) {
    return []
  }

  let zapperSnapshots: Map<string, DefiSnapshot>
  try {
    zapperSnapshots = await getZapperSnapshots(wallet)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Zapper 查询失败'
    zapperSnapshots = new Map(
      chainKeys.map((chainKey) => [
        chainKey,
        buildEmptySnapshot(wallet.id, chainKey, 'zapper', 'error', message),
      ])
    )
  }

  return Promise.all(
    chainKeys.map(async (chainKey) => {
      const zapperSnapshot = zapperSnapshots.get(chainKey) ?? buildEmptySnapshot(wallet.id, chainKey, 'zapper')
      return resolveChainSnapshot(wallet, chainKey, zapperSnapshot, manualSources)
    })
  )
}
