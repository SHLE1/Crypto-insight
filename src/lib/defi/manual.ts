import type { DefiPosition, DefiProtocolSummary, DefiSnapshot, ManualDefiSource, WalletInput } from '@/types'
import { EVM_CHAINS } from '@/lib/evm-chains'
import { getEvmTokenPrices } from '@/lib/market'

const MANUAL_DEFI_TIMEOUT_MS = 12_000

function addressToAbi(address: string) {
  return address.toLowerCase().replace('0x', '').padStart(64, '0')
}

function encodeBalanceOf(address: string) {
  return '0x70a08231' + addressToAbi(address)
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

function decodeAbiString(hex: string | undefined) {
  if (!hex || hex === '0x') {
    return null
  }

  try {
    const body = hex.replace(/^0x/, '')
    const offset = Number.parseInt(body.slice(0, 64), 16)
    const length = Number.parseInt(body.slice(offset * 2, offset * 2 + 64), 16)
    const valueHex = body.slice(offset * 2 + 64, offset * 2 + 64 + length * 2)
    const value = Buffer.from(valueHex, 'hex').toString('utf8').replace(/\0/g, '').trim()
    return value || null
  } catch {
    return null
  }
}

function decodeBytes32String(hex: string | undefined) {
  if (!hex || hex === '0x') {
    return null
  }

  try {
    const value = Buffer.from(hex.replace(/^0x/, '').slice(0, 64), 'hex').toString('utf8').replace(/\0/g, '').trim()
    return value || null
  } catch {
    return null
  }
}

async function rpcCall(rpcUrl: string, to: string, data: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), MANUAL_DEFI_TIMEOUT_MS)

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
      throw new Error(`链上读取失败（HTTP ${response.status}）`)
    }

    const payload = (await response.json()) as { result?: string; error?: { message?: string } }
    if (payload.error) {
      throw new Error(payload.error.message || '链上读取失败')
    }

    return payload.result
  } finally {
    clearTimeout(timeoutId)
  }
}

async function readTokenText(rpcUrl: string, contractAddress: string, selector: string) {
  const result = await rpcCall(rpcUrl, contractAddress, selector)
  return decodeAbiString(result) ?? decodeBytes32String(result)
}

async function getManualSourcePosition(
  wallet: Pick<WalletInput, 'id' | 'address'>,
  source: ManualDefiSource
) {
  const chain = EVM_CHAINS[source.chainKey]
  if (!chain || !source.enabled) {
    return null
  }

  const contractAddress = source.contractAddress.toLowerCase()
  const [balanceHex, decimalsHex, symbolResult, nameResult] = await Promise.allSettled([
    rpcCall(chain.rpcUrl, contractAddress, encodeBalanceOf(wallet.address)),
    rpcCall(chain.rpcUrl, contractAddress, '0x313ce567'),
    readTokenText(chain.rpcUrl, contractAddress, '0x95d89b41'),
    readTokenText(chain.rpcUrl, contractAddress, '0x06fdde03'),
  ])

  if (balanceHex.status !== 'fulfilled') {
    throw balanceHex.reason
  }

  const rawBalance = decodeUint256(balanceHex.value)
  if (rawBalance === BigInt(0)) {
    return null
  }

  const decimals = decimalsHex.status === 'fulfilled' ? Number(decodeUint256(decimalsHex.value)) : 18
  const safeDecimals = Number.isFinite(decimals) && decimals >= 0 && decimals <= 36 ? decimals : 18
  const symbol =
    symbolResult.status === 'fulfilled' && symbolResult.value
      ? symbolResult.value
      : contractAddress.slice(2, 6).toUpperCase()
  const name = nameResult.status === 'fulfilled' && nameResult.value ? nameResult.value : source.label || symbol
  const amount = formatUnits(rawBalance, safeDecimals)
  const prices = await getEvmTokenPrices([{ address: contractAddress, symbol }], source.chainKey)
  const priceInfo = prices.get(contractAddress)
  const price = priceInfo?.price ?? null
  const value = price !== null ? amount * price : 0
  const protocolId = `manual-${source.chainKey}-${contractAddress}`
  const protocolName = source.label?.trim() || `手动补充 · ${symbol}`

  const position: DefiPosition = {
    id: `${wallet.id}-${source.chainKey}-${protocolId}`,
    walletId: wallet.id,
    chainKey: source.chainKey,
    protocolId,
    protocolName,
    protocolCategory: 'manual',
    type: 'unknown',
    name,
    value,
    tokens: [
      {
        address: contractAddress,
        symbol,
        name,
        amount,
        price,
        value,
      },
    ],
    rewards: [],
    metadata: {
      provider: 'manual',
      contractAddress,
      priceStatus: priceInfo?.status ?? 'missing',
    },
  }

  return position
}

export async function getManualDefiSnapshots(
  wallet: Pick<WalletInput, 'id' | 'address'>,
  chainKey: string,
  manualSources: ManualDefiSource[]
): Promise<DefiSnapshot | null> {
  const chainSources = manualSources.filter((source) => source.enabled && source.chainKey === chainKey)
  if (chainSources.length === 0) {
    return null
  }

  const results = await Promise.allSettled(chainSources.map((source) => getManualSourcePosition(wallet, source)))
  const positions = results
    .filter((result): result is PromiseFulfilledResult<DefiPosition> => result.status === 'fulfilled' && Boolean(result.value))
    .map((result) => result.value)

  if (positions.length === 0) {
    return null
  }

  const protocolMap = new Map<string, DefiProtocolSummary>()
  positions.forEach((position) => {
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
    provider: 'manual',
    positions,
    protocols: Array.from(protocolMap.values()),
    totalValue: positions.reduce((sum, position) => sum + position.value, 0),
    totalDepositedValue: positions.reduce((sum, position) => sum + position.value, 0),
    totalBorrowedValue: 0,
    totalRewardsValue: 0,
    updatedAt: new Date().toISOString(),
    status: 'success',
  }
}
