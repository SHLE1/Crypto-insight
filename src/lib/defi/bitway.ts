import type { DefiPosition, DefiProtocolSummary, DefiSnapshot, WalletInput } from '@/types'
import { EVM_CHAINS } from '@/lib/evm-chains'

const BITWAY_EARN_TIMEOUT_MS = 12_000
const BSC_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'

const BITWAY_EARN_PRODUCTS = [
  {
    protocolId: 'bitway-earn-core-alpha',
    protocolName: 'Bitway Earn',
    protocolCategory: 'yield',
    protocolUrl: 'https://docs.bitway.com/bitway-earn/staking-contracts',
    strategyName: 'Bitway Core Alpha',
    vaultAddress: '0xb82E32062C773c7748776C06FdB11B92EDAE3B63',
    lpTokenAddress: '0x73af543D809C8D3414e5B92b3aa2c25b182Ba3A1',
    tokenAddress: BSC_USDT_ADDRESS,
    tokenSymbol: 'USDT',
    tokenName: 'Binance-Peg BSC-USD',
    tokenDecimals: 18,
  },
] as const

function addressToAbi(address: string) {
  return address.toLowerCase().replace('0x', '').padStart(64, '0')
}

function encodeAddressAddress(selector: string, user: string, token: string) {
  return selector + addressToAbi(user) + addressToAbi(token)
}

function decodeUint256(hex: string | undefined) {
  if (!hex || hex === '0x') {
    return BigInt(0)
  }

  return BigInt(hex)
}

function formatUnits(value: bigint, decimals: number) {
  const divisor = BigInt(10) ** BigInt(decimals)
  const whole = value / divisor
  const fraction = value % divisor
  return Number(whole) + Number(fraction) / Number(divisor)
}

async function rpcCall(rpcUrl: string, to: string, data: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), BITWAY_EARN_TIMEOUT_MS)

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Bitway Earn 链上读取失败（HTTP ${response.status}）`)
    }

    const payload = (await response.json()) as { result?: string; error?: { message?: string } }
    if (payload.error) {
      throw new Error(payload.error.message || 'Bitway Earn 链上读取失败')
    }

    return payload.result
  } finally {
    clearTimeout(timeoutId)
  }
}

async function getBitwayProductPosition(
  wallet: Pick<WalletInput, 'id' | 'address'>,
  rpcUrl: string,
  product: (typeof BITWAY_EARN_PRODUCTS)[number]
) {
  const [claimableAssetsHex, claimableRewardsHex, stakedAmountHex] = await Promise.all([
    rpcCall(rpcUrl, product.vaultAddress, encodeAddressAddress('0x32cf58c4', wallet.address, product.tokenAddress)),
    rpcCall(rpcUrl, product.vaultAddress, encodeAddressAddress('0xf56f4f0f', wallet.address, product.tokenAddress)),
    rpcCall(rpcUrl, product.vaultAddress, encodeAddressAddress('0x0db14e95', wallet.address, product.tokenAddress)),
  ])

  const claimableAssetsRaw = decodeUint256(claimableAssetsHex)
  const claimableRewardsRaw = decodeUint256(claimableRewardsHex)
  const stakedAmountRaw = decodeUint256(stakedAmountHex)

  if (claimableAssetsRaw === BigInt(0) && claimableRewardsRaw === BigInt(0) && stakedAmountRaw === BigInt(0)) {
    return null
  }

  const amount = formatUnits(claimableAssetsRaw, product.tokenDecimals)
  const rewardsAmount = formatUnits(claimableRewardsRaw, product.tokenDecimals)
  const stakedAmount = formatUnits(stakedAmountRaw, product.tokenDecimals)
  const value = amount
  const rewardsValue = rewardsAmount

  const position: DefiPosition = {
    id: `${wallet.id}-bsc-${product.protocolId}-${product.lpTokenAddress.toLowerCase()}`,
    walletId: wallet.id,
    chainKey: 'bsc',
    protocolId: product.protocolId,
    protocolName: product.protocolName,
    protocolUrl: product.protocolUrl,
    protocolCategory: product.protocolCategory,
    type: 'stake',
    name: product.strategyName,
    value,
    tokens: [
      {
        address: product.tokenAddress.toLowerCase(),
        symbol: product.tokenSymbol,
        name: product.tokenName,
        amount,
        price: 1,
        value,
      },
    ],
    rewards:
      rewardsAmount > 0
        ? [
            {
              address: product.tokenAddress.toLowerCase(),
              symbol: product.tokenSymbol,
              name: product.tokenName,
              amount: rewardsAmount,
              price: 1,
              value: rewardsValue,
            },
          ]
        : [],
    metadata: {
      provider: 'bitway',
      vaultAddress: product.vaultAddress,
      tokenAddress: product.tokenAddress,
      lpTokenAddress: product.lpTokenAddress,
    },
  }

  return {
    position,
    depositedValue: Math.max(0, stakedAmount),
    rewardsValue,
  }
}

export async function getBitwayEarnSnapshot(
  wallet: Pick<WalletInput, 'id' | 'address'>,
  chainKey: string
): Promise<DefiSnapshot | null> {
  if (chainKey !== 'bsc') {
    return null
  }

  const chain = EVM_CHAINS.bsc
  const results = await Promise.allSettled(
    BITWAY_EARN_PRODUCTS.map((product) => getBitwayProductPosition(wallet, chain.rpcUrl, product))
  )
  const positions = results
    .filter((result): result is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof getBitwayProductPosition>>>> =>
      result.status === 'fulfilled' && Boolean(result.value)
    )
    .map((result) => result.value)

  if (positions.length === 0) {
    return null
  }

  const protocolMap = new Map<string, DefiProtocolSummary>()

  positions.forEach(({ position }) => {
    const existing = protocolMap.get(position.protocolId)
    if (existing) {
      existing.totalValue += position.value
      existing.positionCount += 1
      return
    }

    protocolMap.set(position.protocolId, {
      walletId: wallet.id,
      chainKey,
      protocolId: position.protocolId,
      protocolName: position.protocolName,
      protocolCategory: position.protocolCategory,
      totalValue: position.value,
      positionCount: 1,
    })
  })

  return {
    source: `${wallet.id}:${chainKey}`,
    walletId: wallet.id,
    chainKey,
    provider: 'bitway',
    positions: positions.map((item) => item.position),
    protocols: Array.from(protocolMap.values()),
    totalValue: positions.reduce((sum, item) => sum + item.position.value, 0),
    totalDepositedValue: positions.reduce((sum, item) => sum + item.depositedValue, 0),
    totalBorrowedValue: 0,
    totalRewardsValue: positions.reduce((sum, item) => sum + item.rewardsValue, 0),
    updatedAt: new Date().toISOString(),
    status: 'success',
  }
}
