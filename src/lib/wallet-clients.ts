import type { AssetBalance, ChainType, PortfolioSnapshot } from '@/types'
import { getPrices } from '@/lib/market'

interface WalletQuoteInput {
  id: string
  chainType: ChainType
  address: string
}

const ETH_RPC_URL = 'https://ethereum-rpc.publicnode.com'
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const BTC_API_URL = 'https://blockstream.info/api'

function buildSnapshot(
  wallet: WalletQuoteInput,
  assets: AssetBalance[],
  error?: string
): PortfolioSnapshot {
  const pricedAssets = assets.filter((asset) => asset.value !== null)
  const hasAnyPrice = pricedAssets.length > 0
  const hasMissingPrice = assets.some((asset) => asset.price === null)

  return {
    source: wallet.id,
    sourceType: 'wallet',
    assets,
    totalValue: pricedAssets.reduce((sum, asset) => sum + (asset.value ?? 0), 0),
    updatedAt: new Date().toISOString(),
    status: error ? 'error' : hasMissingPrice ? 'partial' : hasAnyPrice ? 'success' : 'partial',
    error,
  }
}

async function fetchEthereumBalance(address: string) {
  const response = await fetch(ETH_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  })

  if (!response.ok) {
    throw new Error('Ethereum 节点不可用')
  }

  const data = (await response.json()) as { result?: string }

  if (!data.result) {
    throw new Error('未返回 Ethereum 余额')
  }

  return Number(BigInt(data.result)) / 1e18
}

async function fetchSolanaBalance(address: string) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address, { commitment: 'finalized' }],
    }),
  })

  if (!response.ok) {
    throw new Error('Solana 节点不可用')
  }

  const data = (await response.json()) as { result?: { value?: number } }
  const lamports = data.result?.value

  if (typeof lamports !== 'number') {
    throw new Error('未返回 Solana 余额')
  }

  return lamports / 1e9
}

async function fetchBitcoinBalance(address: string) {
  const response = await fetch(`${BTC_API_URL}/address/${address}`, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error('Bitcoin 地址查询失败')
  }

  const data = (await response.json()) as {
    chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number }
    mempool_stats?: { funded_txo_sum?: number; spent_txo_sum?: number }
  }

  const confirmed =
    (data.chain_stats?.funded_txo_sum ?? 0) - (data.chain_stats?.spent_txo_sum ?? 0)
  const pending =
    (data.mempool_stats?.funded_txo_sum ?? 0) - (data.mempool_stats?.spent_txo_sum ?? 0)

  return (confirmed + pending) / 1e8
}

export async function getWalletSnapshot(wallet: WalletQuoteInput): Promise<PortfolioSnapshot> {
  try {
    const symbol = wallet.chainType === 'evm' ? 'ETH' : wallet.chainType === 'solana' ? 'SOL' : 'BTC'
    const balance =
      wallet.chainType === 'evm'
        ? await fetchEthereumBalance(wallet.address)
        : wallet.chainType === 'solana'
        ? await fetchSolanaBalance(wallet.address)
        : await fetchBitcoinBalance(wallet.address)

    const prices = await getPrices([symbol])
    const priceInfo = prices[symbol]

    const assets: AssetBalance[] = [
      {
        symbol,
        name: symbol === 'ETH' ? 'Ethereum' : symbol === 'SOL' ? 'Solana' : 'Bitcoin',
        balance,
        price: priceInfo?.price ?? null,
        value: priceInfo?.price !== null && priceInfo?.price !== undefined ? balance * priceInfo.price : null,
        change24h: priceInfo?.change24h ?? null,
      },
    ]

    return buildSnapshot(wallet, assets)
  } catch (error) {
    return buildSnapshot(wallet, [], error instanceof Error ? error.message : '查询失败')
  }
}
