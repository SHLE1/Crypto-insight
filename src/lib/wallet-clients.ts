import type { AssetBalance, ChainType, PortfolioSnapshot } from '@/types'
import { getPrices, getSolanaTokenMarketData, getEvmTokenPrices } from '@/lib/market'
import { EVM_CHAINS, DEFAULT_EVM_CHAINS } from '@/lib/evm-chains'

interface WalletQuoteInput {
  id: string
  chainType: ChainType
  address: string
  evmChains?: string[]
}

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const BTC_API_URL = 'https://blockstream.info/api'
const SOLANA_TOKEN_PROGRAM_ID = 'Tokenk...Q5DA'
const SOLANA_TOKEN_2022_PROGRAM_ID = 'Tokenz...xuEb'

// ---------------------------------------------------------------------------
// Uniswap community token list — free, no API key, 700+ verified tokens
// ---------------------------------------------------------------------------

interface UniswapTokenEntry {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
}

let _uniswapTokenCache: UniswapTokenEntry[] | null = null

async function fetchUniswapTokenList(): Promise<UniswapTokenEntry[]> {
  if (_uniswapTokenCache) return _uniswapTokenCache
  try {
    const res = await fetch('https://tokens.uniswap.org', { cache: 'force-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { tokens?: UniswapTokenEntry[] }
    _uniswapTokenCache = data.tokens ?? []
    return _uniswapTokenCache
  } catch {
    _uniswapTokenCache = []
    return []
  }
}

function getUniswapTokensForChain(chainId: number): UniswapTokenEntry[] {
  if (!_uniswapTokenCache) return []
  return _uniswapTokenCache.filter((t) => t.chainId === chainId)
}

interface SolanaTokenBalance {
  mint: string
  balance: number
}

// ---------------------------------------------------------------------------
// ABI encoding helpers
// ---------------------------------------------------------------------------

function addressToAbi(address: string): string {
  return address.toLowerCase().replace('0x', '').padStart(64, '0')
}

function encodeBalanceOf(address: string): string {
  // balanceOf(address) selector = 0x70a08231
  return '0x70a08231' + addressToAbi(address)
}

function decodeUint256(hex: string): bigint {
  return BigInt(hex)
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

// ---------------------------------------------------------------------------
// BTC & Solana (unchanged)
// ---------------------------------------------------------------------------

async function fetchBitcoinBalance(address: string) {
  const response = await fetch(`${BTC_API_URL}/address/${address}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Bitcoin 地址查询失败')

  const data = (await response.json()) as {
    chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number }
    mempool_stats?: { funded_txo_sum?: number; spent_txo_sum?: number }
  }

  const confirmed = (data.chain_stats?.funded_txo_sum ?? 0) - (data.chain_stats?.spent_txo_sum ?? 0)
  const pending = (data.mempool_stats?.funded_txo_sum ?? 0) - (data.mempool_stats?.spent_txo_sum ?? 0)
  return (confirmed + pending) / 1e8
}

async function fetchSolanaBalance(address: string) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address, { commitment: 'finalized' }] }),
  })
  if (!response.ok) throw new Error('Solana 节点不可用')

  const data = (await response.json()) as { result?: { value?: number } }
  const lamports = data.result?.value
  if (typeof lamports !== 'number') throw new Error('未返回 Solana 余额')
  return lamports / 1e9
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
  if (!response.ok) throw new Error('Solana Token 查询失败')

  const data = (await response.json()) as {
    result?: {
      value?: Array<{
        account?: {
          data?: {
            parsed?: {
              info?: {
                mint?: string
                tokenAmount?: { uiAmount?: number | null; uiAmountString?: string; decimals?: number }
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
      if (!mint || !Number.isFinite(balance) || balance <= 0 || typeof decimals !== 'number' || decimals <= 0) return null
      return { mint, balance } satisfies SolanaTokenBalance
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
  return Array.from(mergedBalances.entries()).map(([mint, balance]) => ({ mint, balance }))
}

// ---------------------------------------------------------------------------
// EVM batch balanceOf
// ---------------------------------------------------------------------------

interface Multicall3Call {
  target: string
  allowFailure: boolean
  callData: string
}

interface Multicall3Result {
  success: boolean
  returnData: string
}

async function multicallAggregate3(rpcUrl: string, calls: Multicall3Call[]): Promise<Multicall3Result[]> {
  const results: Multicall3Result[] = []

  for (let i = 0; i < calls.length; i += 10) {
    const batch = calls.slice(i, i + 10)
    const responses = await Promise.allSettled(
      batch.map((call, idx) =>
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i + idx + 1,
            method: 'eth_call',
            params: [{ to: call.target, data: call.callData }, 'latest'],
          }),
        }).then(async (r) => {
          const d = (await r.json()) as { result?: string; error?: { message?: string } }
          if (d.error || !d.result || d.result === '0x') return { success: false, returnData: '0x' }
          return { success: true, returnData: d.result }
        })
      )
    )
    for (const r of responses) {
      results.push(r.status === 'fulfilled' ? r.value : { success: false, returnData: '0x' })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// EVM token discovery via Transfer event logs
// ---------------------------------------------------------------------------

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function discoverTokensViaLogs(
  rpcUrl: string,
  address: string,
  blockRange: number
): Promise<string[]> {
  const paddedAddr = address.toLowerCase().replace('0x', '').padStart(64, '0')

  // Get latest block number
  const blockRes = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
  })
  const blockData = (await blockRes.json()) as { result?: string }
  if (!blockData.result) return []

  const latestBlock = Number(BigInt(blockData.result))
  const fromBlock = Math.max(0, latestBlock - blockRange)
  const toHex = '0x' + latestBlock.toString(16)
  const fromHex = '0x' + fromBlock.toString(16)

  // Query Transfer events TO and FROM the address
  const [toRes, fromRes] = await Promise.all([
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getLogs',
        params: [{ topics: [ERC20_TRANSFER_TOPIC, null, '0x' + paddedAddr], fromBlock: fromHex, toBlock: toHex }],
      }),
    }),
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_getLogs',
        params: [{ topics: [ERC20_TRANSFER_TOPIC, '0x' + paddedAddr, null], fromBlock: fromHex, toBlock: toHex }],
      }),
    }),
  ])

  const toData = (await toRes.json()) as { result?: Array<{ address: string }> }
  const fromData = (await fromRes.json()) as { result?: Array<{ address: string }> }

  const tokenSet = new Set<string>()
  for (const log of [...(toData.result ?? []), ...(fromData.result ?? [])]) {
    tokenSet.add(log.address.toLowerCase())
  }

  return Array.from(tokenSet)
}

async function batchCheckBalances(
  rpcUrl: string,
  tokenAddresses: string[],
  holderAddress: string
): Promise<Map<string, bigint>> {
  const results = new Map<string, bigint>()
  if (tokenAddresses.length === 0) return results

  const data = encodeBalanceOf(holderAddress)

  // Batch 20 at a time
  for (let i = 0; i < tokenAddresses.length; i += 20) {
    const batch = tokenAddresses.slice(i, i + 20)
    const responses = await Promise.allSettled(
      batch.map((addr, idx) =>
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i + idx + 1,
            method: 'eth_call',
            params: [{ to: addr, data }, 'latest'],
          }),
        }).then(async (r) => {
          const d = (await r.json()) as { result?: string }
          if (!d.result || d.result === '0x') return null
          try {
            const bal = BigInt(d.result)
            return bal > BigInt(0) ? bal : null
          } catch {
            return null
          }
        })
      )
    )
    responses.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value !== null) {
        results.set(batch[idx].toLowerCase(), r.value)
      }
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// EVM multi-chain fetcher
// ---------------------------------------------------------------------------

async function fetchEvmChainBalances(
  chainKey: string,
  address: string
): Promise<{ symbol: string; balance: number; contractAddress?: string }[]> {
  const chain = EVM_CHAINS[chainKey]
  if (!chain) return []

  const assets: { symbol: string; balance: number; contractAddress?: string }[] = []

  // 1) Native token balance
  try {
    const nativeRes = await fetch(chain.rpcUrl, {
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
    const nativeData = (await nativeRes.json()) as { result?: string }
    if (nativeData.result) {
      const balance = Number(BigInt(nativeData.result)) / 1e18
      if (balance > 0) {
        assets.push({ symbol: chain.symbol, balance })
      }
    }
  } catch {
    // native fetch failed, continue with tokens
  }

  // 2) Known popular tokens (fast, reliable)
  if (chain.tokens.length > 0) {
    const calls: Multicall3Call[] = chain.tokens.map((token) => ({
      target: token.address,
      allowFailure: true,
      callData: encodeBalanceOf(address),
    }))

    try {
      const results = await multicallAggregate3(chain.rpcUrl, calls)
      results.forEach((result, idx) => {
        if (!result.success) return
        try {
          const raw = decodeUint256(result.returnData)
          if (raw > BigInt(0)) {
            const token = chain.tokens[idx]
            const balance = Number(raw) / 10 ** token.decimals
            if (balance > 0) {
              assets.push({ symbol: token.symbol, balance, contractAddress: token.address.toLowerCase() })
            }
          }
        } catch {
          // skip malformed result
        }
      })
    } catch {
      // multicall failed, continue
    }
  }

  // 3) Discover additional tokens via Uniswap list + Transfer logs (parallel)
  try {
    const checkedAddresses = new Set(
      assets.map((a) => a.contractAddress?.toLowerCase()).filter((a): a is string => a != null)
    )

    // Run both discovery methods in parallel
    const [uniswapTokens, logDiscovered] = await Promise.all([
      (async () => {
        const all = getUniswapTokensForChain(chain.chainId)
        return all.filter((t) => !checkedAddresses.has(t.address.toLowerCase()))
      })(),
      discoverTokensViaLogs(chain.rpcUrl, address, chain.logBlockRange),
    ])

    // Collect addresses to check: Uniswap tokens + log-discovered (deduplicated)
    const uniswapAddresses = uniswapTokens.map((t) => t.address.toLowerCase())
    const unknownFromLogs = logDiscovered.filter(
      (a) => !checkedAddresses.has(a) && !uniswapAddresses.includes(a)
    )
    const allToCheck = [...uniswapAddresses, ...unknownFromLogs]

    if (allToCheck.length > 0) {
      const balances = await batchCheckBalances(chain.rpcUrl, allToCheck, address)
      const uniswapMap = new Map(uniswapTokens.map((t) => [t.address.toLowerCase(), t]))

      for (const [tokenAddr, rawBalance] of Array.from(balances.entries())) {
        const uniEntry = uniswapMap.get(tokenAddr)
        const decimals = uniEntry
          ? uniEntry.decimals
          : await getTokenDecimals(chain.rpcUrl, tokenAddr)
        const symbol = uniEntry
          ? uniEntry.symbol
          : await getTokenSymbol(chain.rpcUrl, tokenAddr)
        const balance = Number(rawBalance) / 10 ** decimals
        if (balance > 0) {
          assets.push({ symbol, balance, contractAddress: tokenAddr })
        }
      }
    }
  } catch {
    // discovery failed, continue with what we have
  }

  return assets
}

// ---------------------------------------------------------------------------
// Token metadata helpers
// ---------------------------------------------------------------------------

async function getTokenDecimals(rpcUrl: string, tokenAddr: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'eth_call',
        params: [{ to: tokenAddr, data: '0x313ce567' }, 'latest'],
      }),
    })
    const data = (await res.json()) as { result?: string }
    return data.result ? Number(BigInt(data.result)) : 18
  } catch {
    return 18
  }
}

async function getTokenSymbol(rpcUrl: string, tokenAddr: string): Promise<string> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 100,
        method: 'eth_call',
        params: [{ to: tokenAddr, data: '0x95d89b41' }, 'latest'],
      }),
    })
    const data = (await res.json()) as { result?: string }
    if (data.result && data.result !== '0x') {
      const hex = data.result.replace('0x', '')
      if (hex.length >= 128) {
        const strLen = parseInt(hex.slice(64, 128), 16)
        const strHex = hex.slice(128, 128 + strLen * 2)
        const sym = strHex
          .match(/.{2}/g)
          ?.map((b) => String.fromCharCode(parseInt(b, 16)))
          .join('')
          .replace(/\0/g, '')
          .trim()
        if (sym) return sym
      }
    }
  } catch {
    // ignore
  }
  return tokenAddr.slice(2, 6).toUpperCase()
}

// ---------------------------------------------------------------------------
// Main snapshot builder
// ---------------------------------------------------------------------------

export async function getWalletSnapshot(wallet: WalletQuoteInput): Promise<PortfolioSnapshot> {
  try {
    let rawAssets: { symbol: string; balance: number }[] = []

    if (wallet.chainType === 'solana') {
      const [nativeBalance, tokenBalances] = await Promise.all([
        fetchSolanaBalance(wallet.address),
        fetchSolanaTokenBalances(wallet.address),
      ])
      const tokenMarketData = await getSolanaTokenMarketData(tokenBalances.map((t) => t.mint))

      rawAssets = [
        { symbol: 'SOL', balance: nativeBalance },
        ...tokenBalances.map((t) => ({
          symbol: tokenMarketData[t.mint]?.symbol ?? `${t.mint.slice(0, 4)}...${t.mint.slice(-4)}`,
          balance: t.balance,
        })),
      ]
    } else if (wallet.chainType === 'evm') {
      const chains = (wallet.evmChains?.length ? wallet.evmChains : DEFAULT_EVM_CHAINS)
      const chainResults = await Promise.allSettled(
        chains.map((chainKey) => fetchEvmChainBalances(chainKey, wallet.address))
      )

      // Collect all assets with contract addresses for price lookup
      type EvmAsset = { symbol: string; balance: number; contractAddress?: string; chainKey: string }
      const allEvmAssets: EvmAsset[] = []
      for (let ci = 0; ci < chainResults.length; ci++) {
        const result = chainResults[ci]
        if (result.status !== 'fulfilled') continue
        const chainKey = chains[ci]
        for (const asset of result.value) {
          allEvmAssets.push({ ...asset, chainKey })
        }
      }

      // Price ERC-20 tokens by contract address (per chain)
      const priceMap = new Map<string, { price: number | null; change24h: number | null }>()
      const tokensByChain = new Map<string, Array<{ address: string; symbol: string }>>()

      for (const asset of allEvmAssets) {
        if (asset.contractAddress) {
          if (!tokensByChain.has(asset.chainKey)) tokensByChain.set(asset.chainKey, [])
          tokensByChain.get(asset.chainKey)!.push({ address: asset.contractAddress, symbol: asset.symbol })
        }
      }

      const chainPriceResults = await Promise.all(
        Array.from(tokensByChain.entries()).map(async ([chainKey, tokens]) => {
          const result = await getEvmTokenPrices(tokens, chainKey)
          return { chainKey, prices: result }
        })
      )

      for (const { prices } of chainPriceResults) {
        for (const [addr, data] of prices) {
          priceMap.set(addr, { price: data.price, change24h: data.change24h })
        }
      }

      // Price native tokens by symbol
      const nativeSymbols = allEvmAssets.filter((a) => !a.contractAddress).map((a) => a.symbol)
      const nativePrices = nativeSymbols.length > 0 ? await getPrices(nativeSymbols) : {}

      // Merge and deduplicate, tracking per-chain breakdown
      const merged = new Map<string, {
        balance: number
        price: number | null
        change24h: number | null
        chainBreakdowns: { chainKey: string; balance: number }[]
      }>()
      for (const asset of allEvmAssets) {
        const key = asset.symbol
        const existing = merged.get(key)
        const priceInfo = asset.contractAddress
          ? priceMap.get(asset.contractAddress)
          : nativePrices[asset.symbol]

        if (existing) {
          // Update chain breakdown
          const chainEntry = existing.chainBreakdowns.find((c) => c.chainKey === asset.chainKey)
          if (chainEntry) {
            chainEntry.balance += asset.balance
          } else {
            existing.chainBreakdowns.push({ chainKey: asset.chainKey, balance: asset.balance })
          }
          merged.set(key, {
            balance: existing.balance + asset.balance,
            price: existing.price ?? priceInfo?.price ?? null,
            change24h: existing.change24h ?? priceInfo?.change24h ?? null,
            chainBreakdowns: existing.chainBreakdowns,
          })
        } else {
          merged.set(key, {
            balance: asset.balance,
            price: priceInfo?.price ?? null,
            change24h: priceInfo?.change24h ?? null,
            chainBreakdowns: [{ chainKey: asset.chainKey, balance: asset.balance }],
          })
        }
      }

      rawAssets = Array.from(merged.entries())
        .filter(([, data]) => data.balance > 0)
        .map(([symbol, data]) => ({
          symbol,
          balance: data.balance,
          price: data.price,
          change24h: data.change24h,
          chainBreakdowns: data.chainBreakdowns.filter((c) => c.balance > 0),
        }))
    } else {
      // BTC
      const balance = await fetchBitcoinBalance(wallet.address)
      rawAssets = [{ symbol: 'BTC', balance }]
    }

    // Fetch prices for assets that don't already have them
    const symbolsNeedingPrice = rawAssets
      .filter((a) => !('price' in a))
      .map((a) => a.symbol)

    const fetchedPrices = symbolsNeedingPrice.length > 0 ? await getPrices(symbolsNeedingPrice) : {}

    const assets: AssetBalance[] = rawAssets.map((asset) => {
      const withPrice = asset as {
        symbol: string
        balance: number
        price?: number | null
        change24h?: number | null
        chainBreakdowns?: { chainKey: string; balance: number }[]
      }
      const fetchedPriceInfo = fetchedPrices[asset.symbol]
      const price = withPrice.price !== undefined ? withPrice.price : (fetchedPriceInfo?.price ?? null)
      const change24h = withPrice.change24h !== undefined ? withPrice.change24h : (fetchedPriceInfo?.change24h ?? null)
      return {
        symbol: asset.symbol,
        name: asset.symbol,
        balance: asset.balance,
        price,
        value: price !== null ? asset.balance * price : null,
        change24h,
        _chainBreakdowns: withPrice.chainBreakdowns,
      }
    })

    return buildSnapshot(wallet, assets)
  } catch (error) {
    return buildSnapshot(wallet, [], error instanceof Error ? error.message : '查询失败')
  }
}
