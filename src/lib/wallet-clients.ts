import type { AssetBalance, ChainType, PortfolioSnapshot } from '@/types'
import { getPrices, getSolanaTokenMarketData } from '@/lib/market'

interface WalletQuoteInput {
  id: string
  chainType: ChainType
  address: string
}

const ETH_RPC_URL = 'https://ethereum-rpc.publicnode.com'
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const BTC_API_URL = 'https://blockstream.info/api'
const SOLANA_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const SOLANA_TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

interface SolanaTokenBalance {
  mint: string
  balance: number
}

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

async function fetchSolanaTokenBalancesByProgram(address: string, programId: string) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [address, { programId }, { encoding: 'jsonParsed', commitment: 'finalized' }],
    }),
  })

  if (!response.ok) {
    throw new Error('Solana Token 查询失败')
  }

  const data = (await response.json()) as {
    result?: {
      value?: Array<{
        account?: {
          data?: {
            parsed?: {
              info?: {
                mint?: string
                tokenAmount?: {
                  uiAmount?: number | null
                  uiAmountString?: string
                  decimals?: number
                }
              }
            }
          }
        }
      }>
    }
  }

  return (data.result?.value ?? [])
    .map((item) => {
      const info = item.account?.data?.parsed?.info
      const mint = info?.mint
      const decimals = info?.tokenAmount?.decimals
      const balance = Number(info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.uiAmount ?? 0)

      if (!mint || !Number.isFinite(balance) || balance <= 0 || typeof decimals !== 'number' || decimals <= 0) {
        return null
      }

      return {
        mint,
        balance,
      } satisfies SolanaTokenBalance
    })
    .filter((item): item is SolanaTokenBalance => item !== null)
}

async function fetchSolanaTokenBalances(address: string) {
  const tokenSets = await Promise.all([
    fetchSolanaTokenBalancesByProgram(address, SOLANA_TOKEN_PROGRAM_ID),
    fetchSolanaTokenBalancesByProgram(address, SOLANA_TOKEN_2022_PROGRAM_ID),
  ])

  const mergedBalances = new Map<string, number>()

  tokenSets.flat().forEach((token) => {
    mergedBalances.set(token.mint, (mergedBalances.get(token.mint) ?? 0) + token.balance)
  })

  return Array.from(mergedBalances.entries()).map(([mint, balance]) => ({
    mint,
    balance,
  }))
}

export async function getWalletSnapshot(wallet: WalletQuoteInput): Promise<PortfolioSnapshot> {
  try {
    let assets: AssetBalance[] = []

    if (wallet.chainType === 'solana') {
      const [nativeBalance, tokenBalances, nativePrices] = await Promise.all([
        fetchSolanaBalance(wallet.address),
        fetchSolanaTokenBalances(wallet.address),
        getPrices(['SOL']),
      ])
      const tokenMarketData = await getSolanaTokenMarketData(tokenBalances.map((token) => token.mint))
      const nativePrice = nativePrices.SOL

      assets = [
        {
          symbol: 'SOL',
          name: 'Solana',
          balance: nativeBalance,
          price: nativePrice?.price ?? null,
          value:
            nativePrice?.price !== null && nativePrice?.price !== undefined
              ? nativeBalance * nativePrice.price
              : null,
          change24h: nativePrice?.change24h ?? null,
        },
        ...tokenBalances.map((token) => {
          const market = tokenMarketData[token.mint]
          const price = market?.price ?? null

          return {
            symbol: market?.symbol ?? `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`,
            name: market?.name ?? token.mint,
            balance: token.balance,
            price,
            value: price !== null ? token.balance * price : null,
            change24h: market?.change24h ?? null,
          }
        }),
      ]
    } else {
      const symbol = wallet.chainType === 'evm' ? 'ETH' : 'BTC'
      const balance =
        wallet.chainType === 'evm'
          ? await fetchEthereumBalance(wallet.address)
          : await fetchBitcoinBalance(wallet.address)
      const prices = await getPrices([symbol])
      const priceInfo = prices[symbol]

      assets = [
        {
          symbol,
          name: symbol === 'ETH' ? 'Ethereum' : 'Bitcoin',
          balance,
          price: priceInfo?.price ?? null,
          value: priceInfo?.price !== null && priceInfo?.price !== undefined ? balance * priceInfo.price : null,
          change24h: priceInfo?.change24h ?? null,
        },
      ]
    }

    return buildSnapshot(wallet, assets)
  } catch (error) {
    return buildSnapshot(wallet, [], error instanceof Error ? error.message : '查询失败')
  }
}
