import type { AssetBalance, ChainType, PortfolioSnapshot } from '@/types'
import { getEvmTokenPrices, getPrices, getSolanaTokenMarketData } from '@/lib/market'
import { DEFAULT_EVM_CHAINS, EVM_CHAINS } from '@/lib/evm-chains'

interface WalletQuoteInput {
  id: string
  chainType: ChainType
  address: string
  evmChains?: string[]
}

interface WalletQuoteResult {
  assets: AssetBalance[]
  warning?: string
  error?: string
}

interface UniswapTokenEntry {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
}

interface SolanaTokenBalance {
  mint: string
  balance: number
}

interface EvmAssetCandidate {
  symbol: string
  balance: number
  contractAddress?: string
  chainKey: string
}

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const SOLANA_RPC_FALLBACK_URLS = ['https://solana.publicnode.com']
const BTC_API_URL = 'https://blockstream.info/api'
const SOLANA_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const SOLANA_TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
const EVM_CHAIN_TIMEOUT_MS = 20_000

let uniswapTokenCache: UniswapTokenEntry[] | null = null

async function fetchUniswapTokenList() {
  if (uniswapTokenCache) {
    return uniswapTokenCache
  }

  try {
    const response = await fetch('https://tokens.uniswap.org', { cache: 'force-cache' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = (await response.json()) as { tokens?: UniswapTokenEntry[] }
    uniswapTokenCache = data.tokens ?? []
    return uniswapTokenCache
  } catch {
    uniswapTokenCache = []
    return uniswapTokenCache
  }
}

function getUniswapTokensForChain(chainId: number) {
  if (!uniswapTokenCache) return []
  return uniswapTokenCache.filter((token) => token.chainId === chainId)
}

function addressToAbi(address: string) {
  return address.toLowerCase().replace('0x', '').padStart(64, '0')
}

function encodeBalanceOf(address: string) {
  return '0x70a08231' + addressToAbi(address)
}

function buildSnapshot(
  wallet: WalletQuoteInput,
  result: WalletQuoteResult
): PortfolioSnapshot {
  const hasNonLivePrice = result.assets.some((asset) => asset.priceStatus && asset.priceStatus !== 'live')

  return {
    source: wallet.id,
    sourceType: 'wallet',
    assets: result.assets,
    totalValue: result.assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0),
    updatedAt: new Date().toISOString(),
    status: result.error ? 'error' : result.warning || hasNonLivePrice ? 'partial' : 'success',
    error: result.error ?? result.warning,
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

interface CoinGeckoListItem {
  id: string
  symbol: string
  name: string
  platforms?: Record<string, string>
}

let solanaMintMetadataCache: Map<string, { name: string; symbol: string }> | null = null
let solanaMintMetadataFetchedAt = 0
const SOLANA_MINT_METADATA_TTL = 24 * 60 * 60 * 1000

async function getSolanaMintMetadataLookup(): Promise<Map<string, { name: string; symbol: string }>> {
  if (solanaMintMetadataCache && Date.now() - solanaMintMetadataFetchedAt < SOLANA_MINT_METADATA_TTL) {
    return solanaMintMetadataCache
  }

  try {
    const demoApiKey = process.env.COINGECKO_DEMO_API_KEY?.trim()
    const headers = demoApiKey ? { 'x-cg-demo-api-key': demoApiKey } : undefined
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/list?include_platform=true`,
      { cache: 'force-cache', headers }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const coins = (await response.json()) as CoinGeckoListItem[]
    const lookup = new Map<string, { name: string; symbol: string }>()

    for (const coin of coins) {
      const solanaMint = coin.platforms?.['solana']
      if (solanaMint && !lookup.has(solanaMint)) {
        lookup.set(solanaMint, { name: coin.name, symbol: coin.symbol.toUpperCase() })
      }
    }

    solanaMintMetadataCache = lookup
    solanaMintMetadataFetchedAt = Date.now()
    return lookup
  } catch {
    solanaMintMetadataCache = solanaMintMetadataCache ?? new Map()
    return solanaMintMetadataCache
  }
}

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

function getSolanaRpcUrls() {
  const envUrl = process.env.SOLANA_RPC_URL?.trim()
  return Array.from(
    new Set(
      [envUrl, SOLANA_RPC_URL, ...SOLANA_RPC_FALLBACK_URLS].filter(
        (url): url is string => typeof url === 'string' && url.length > 0
      )
    )
  )
}

async function callSolanaRpc<T>(body: Record<string, unknown>, errorMessage: string) {
  const rpcUrls = getSolanaRpcUrls()
  let lastError: Error | null = null

  for (const rpcUrl of rpcUrls) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as T & { error?: { message?: string } }
      if (data.error) {
        throw new Error(data.error.message || errorMessage)
      }

      return data
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(errorMessage)
    }
  }

  throw new Error(lastError?.message || errorMessage)
}

async function fetchSolanaBalance(address: string) {
  const data = await callSolanaRpc<{ result?: { value?: number } }>(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address, { commitment: 'finalized' }],
    },
    'Solana 节点不可用'
  )

  const lamports = data.result?.value
  if (typeof lamports !== 'number') throw new Error('未返回 Solana 余额')
  return lamports / 1e9
}

async function fetchSolanaTokenBalancesByProgram(address: string, programId: string) {
  const data = await callSolanaRpc<{
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
  }>(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [address, { programId }, { encoding: 'jsonParsed', commitment: 'finalized' }],
    },
    'Solana Token 查询失败'
  )

  return (data.result?.value ?? [])
    .map((item) => {
      const info = item.account?.data?.parsed?.info
      const mint = info?.mint
      const decimals = info?.tokenAmount?.decimals
      const balance = Number(info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.uiAmount ?? 0)

      if (!mint || !Number.isFinite(balance) || balance <= 0 || typeof decimals !== 'number' || decimals <= 0) {
        return null
      }

      return { mint, balance } satisfies SolanaTokenBalance
    })
    .filter((item): item is SolanaTokenBalance => item !== null)
}

async function fetchSolanaTokenBalances(address: string) {
  const tokenSets = await Promise.allSettled([
    fetchSolanaTokenBalancesByProgram(address, SOLANA_TOKEN_PROGRAM_ID),
    fetchSolanaTokenBalancesByProgram(address, SOLANA_TOKEN_2022_PROGRAM_ID),
  ])

  const fulfilledSets = tokenSets
    .filter((result): result is PromiseFulfilledResult<SolanaTokenBalance[]> => result.status === 'fulfilled')
    .map((result) => result.value)

  if (fulfilledSets.length === 0) {
    throw new Error('Solana Token 查询失败')
  }

  const mergedBalances = new Map<string, number>()
  fulfilledSets.flat().forEach((token) => {
    mergedBalances.set(token.mint, (mergedBalances.get(token.mint) ?? 0) + token.balance)
  })

  return Array.from(mergedBalances.entries()).map(([mint, balance]) => ({ mint, balance }))
}

async function batchEthCallBalances(
  rpcUrl: string,
  tokenAddresses: string[],
  holderAddress: string
) {
  const results = new Map<string, bigint>()
  if (tokenAddresses.length === 0) return results

  const callData = encodeBalanceOf(holderAddress)

  for (let index = 0; index < tokenAddresses.length; index += 20) {
    const batch = tokenAddresses.slice(index, index + 20)
    const responses = await Promise.allSettled(
      batch.map((address, offset) =>
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: index + offset + 1,
            method: 'eth_call',
            params: [{ to: address, data: callData }, 'latest'],
          }),
        }).then(async (response) => {
          const data = (await response.json()) as { result?: string }
          if (!data.result || data.result === '0x') return null

          try {
            const balance = BigInt(data.result)
            return balance > BigInt(0) ? balance : null
          } catch {
            return null
          }
        })
      )
    )

    responses.forEach((response, batchIndex) => {
      if (response.status === 'fulfilled' && response.value !== null) {
        results.set(batch[batchIndex].toLowerCase(), response.value)
      }
    })
  }

  return results
}

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

async function discoverTokensViaLogs(rpcUrl: string, address: string, blockRange: number) {
  const paddedAddr = address.toLowerCase().replace('0x', '').padStart(64, '0')
  const blockResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
  })
  const blockData = (await blockResponse.json()) as { result?: string }
  if (!blockData.result) return []

  const latestBlock = Number(BigInt(blockData.result))
  const fromBlock = Math.max(0, latestBlock - blockRange)
  const toHex = `0x${latestBlock.toString(16)}`
  const fromHex = `0x${fromBlock.toString(16)}`

  const [toResponse, fromResponse] = await Promise.all([
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getLogs',
        params: [{ topics: [ERC20_TRANSFER_TOPIC, null, `0x${paddedAddr}`], fromBlock: fromHex, toBlock: toHex }],
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
        params: [{ topics: [ERC20_TRANSFER_TOPIC, `0x${paddedAddr}`, null], fromBlock: fromHex, toBlock: toHex }],
      }),
    }),
  ])

  const toData = (await toResponse.json()) as { result?: Array<{ address: string }> }
  const fromData = (await fromResponse.json()) as { result?: Array<{ address: string }> }
  const tokenSet = new Set<string>()

  for (const log of [...(toData.result ?? []), ...(fromData.result ?? [])]) {
    tokenSet.add(log.address.toLowerCase())
  }

  return Array.from(tokenSet)
}

async function fetchTokenDecimals(rpcUrl: string, tokenAddress: string) {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'eth_call',
        params: [{ to: tokenAddress, data: '0x313ce567' }, 'latest'],
      }),
    })
    const data = (await response.json()) as { result?: string }
    return data.result ? Number(BigInt(data.result)) : 18
  } catch {
    return 18
  }
}

async function fetchTokenSymbol(rpcUrl: string, tokenAddress: string) {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 100,
        method: 'eth_call',
        params: [{ to: tokenAddress, data: '0x95d89b41' }, 'latest'],
      }),
    })
    const data = (await response.json()) as { result?: string }
    if (!data.result || data.result === '0x') {
      return tokenAddress.slice(2, 6).toUpperCase()
    }

    const hex = data.result.replace('0x', '')
    if (hex.length >= 128) {
      const stringLength = parseInt(hex.slice(64, 128), 16)
      const stringHex = hex.slice(128, 128 + stringLength * 2)
      const symbol = stringHex
        .match(/.{2}/g)
        ?.map((pair) => String.fromCharCode(parseInt(pair, 16)))
        .join('')
        .replace(/\0/g, '')
        .trim()

      if (symbol) {
        return symbol
      }
    }
  } catch {
    // ignore
  }

  return tokenAddress.slice(2, 6).toUpperCase()
}

async function fetchEvmChainBalances(chainKey: string, address: string) {
  const chain = EVM_CHAINS[chainKey]
  if (!chain) return []

  const assets: Array<{ symbol: string; balance: number; contractAddress?: string }> = []

  try {
    const nativeResponse = await fetch(chain.rpcUrl, {
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
    const nativeData = (await nativeResponse.json()) as { result?: string }
    if (nativeData.result) {
      const balance = Number(BigInt(nativeData.result)) / 1e18
      if (balance > 0) {
        assets.push({ symbol: chain.symbol, balance })
      }
    }
  } catch {
    // keep going
  }

  const checkedAddresses = new Set<string>()

  if (chain.tokens.length > 0) {
    const results = await batchEthCallBalances(
      chain.rpcUrl,
      chain.tokens.map((token) => token.address),
      address
    )

    chain.tokens.forEach((token) => {
      const rawBalance = results.get(token.address.toLowerCase())
      if (!rawBalance || rawBalance <= BigInt(0)) return

      const balance = Number(rawBalance) / 10 ** token.decimals
      if (balance <= 0) return

      const normalizedAddress = token.address.toLowerCase()
      checkedAddresses.add(normalizedAddress)
      assets.push({
        symbol: token.symbol,
        balance,
        contractAddress: normalizedAddress,
      })
    })
  }

  try {
    const [uniswapTokens, logDiscoveredAddresses] = await Promise.all([
      Promise.resolve(
        getUniswapTokensForChain(chain.chainId).filter((token) => !checkedAddresses.has(token.address.toLowerCase()))
      ),
      discoverTokensViaLogs(chain.rpcUrl, address, chain.logBlockRange),
    ])

    const uniswapAddresses = uniswapTokens.map((token) => token.address.toLowerCase())
    const unknownFromLogs = logDiscoveredAddresses.filter(
      (tokenAddress) => !checkedAddresses.has(tokenAddress) && !uniswapAddresses.includes(tokenAddress)
    )
    const allAddressesToCheck = [...uniswapAddresses, ...unknownFromLogs]

    if (allAddressesToCheck.length > 0) {
      const balances = await batchEthCallBalances(chain.rpcUrl, allAddressesToCheck, address)
      const uniswapLookup = new Map(uniswapTokens.map((token) => [token.address.toLowerCase(), token]))

      for (const [tokenAddress, rawBalance] of Array.from(balances.entries())) {
        const knownToken = uniswapLookup.get(tokenAddress)
        const decimals = knownToken ? knownToken.decimals : await fetchTokenDecimals(chain.rpcUrl, tokenAddress)
        const symbol = knownToken ? knownToken.symbol : await fetchTokenSymbol(chain.rpcUrl, tokenAddress)
        const balance = Number(rawBalance) / 10 ** decimals

        if (balance <= 0) continue

        assets.push({
          symbol,
          balance,
          contractAddress: tokenAddress,
        })
      }
    }
  } catch {
    // discovery is best-effort
  }

  return assets
}

async function quoteBitcoinWallet(wallet: WalletQuoteInput): Promise<WalletQuoteResult> {
  const balance = await fetchBitcoinBalance(wallet.address)
  const btcPrice = (await getPrices(['BTC'])).BTC

  return {
    assets: [
      {
        assetId: 'native:btc:BTC',
        symbol: 'BTC',
        name: 'Bitcoin',
        balance,
        price: btcPrice?.price ?? null,
        value: btcPrice?.price !== null && btcPrice?.price !== undefined ? balance * btcPrice.price : null,
        change24h: btcPrice?.change24h ?? null,
        priceStatus: btcPrice?.status ?? 'missing',
        chainKey: 'btc',
      },
    ],
  }
}

async function quoteSolanaWallet(wallet: WalletQuoteInput): Promise<WalletQuoteResult> {
  const nativeBalance = await fetchSolanaBalance(wallet.address)
  const solPrice = (await getPrices(['SOL'])).SOL

  let tokenBalances: SolanaTokenBalance[] = []
  let warning: string | undefined

  try {
    tokenBalances = await fetchSolanaTokenBalances(wallet.address)
  } catch {
    warning = 'SPL Token 查询失败，当前仅返回 SOL 余额。'
  }

  const tokenMarketData = tokenBalances.length > 0 ? await getSolanaTokenMarketData(tokenBalances.map((token) => token.mint)) : {}
  const mintMetadata = tokenBalances.length > 0 ? await getSolanaMintMetadataLookup() : new Map()
  const assets: AssetBalance[] = [
    {
      assetId: 'native:solana:SOL',
      symbol: 'SOL',
      name: 'Solana',
      balance: nativeBalance,
      price: solPrice?.price ?? null,
      value: solPrice?.price !== null && solPrice?.price !== undefined ? nativeBalance * solPrice.price : null,
      change24h: solPrice?.change24h ?? null,
      priceStatus: solPrice?.status ?? 'missing',
      chainKey: 'solana',
    },
    ...tokenBalances.map((token) => {
      const marketData = tokenMarketData[token.mint]
      const cgMeta = mintMetadata.get(token.mint)
      const price = marketData?.price ?? null

      const marketSymbol = marketData?.symbol
      const marketName = marketData?.name
      const hasMarketSymbol = marketSymbol && marketSymbol.length < 20 && !marketSymbol.startsWith(token.mint.slice(0, 4))
      const hasMarketName = marketName && marketName.length < 40 && !marketName.startsWith(token.mint.slice(0, 4))

      return {
        assetId: `spl:${token.mint}`,
        symbol: hasMarketSymbol ? marketSymbol : cgMeta?.symbol ?? `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`,
        name: hasMarketName ? marketName : cgMeta?.name ?? `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`,
        balance: token.balance,
        price,
        value: price !== null ? token.balance * price : null,
        change24h: marketData?.change24h ?? null,
        priceStatus: marketData?.status ?? 'missing',
        chainKey: 'solana',
        contractAddress: token.mint,
      } satisfies AssetBalance
    }),
  ].filter((asset) => asset.balance > 0)

  return {
    assets,
    warning,
  }
}

async function quoteEvmWallet(wallet: WalletQuoteInput): Promise<WalletQuoteResult> {
  await fetchUniswapTokenList()

  const chains = wallet.evmChains?.length ? wallet.evmChains : DEFAULT_EVM_CHAINS
  const chainResults = await Promise.allSettled(
    chains.map((chainKey) =>
      withTimeout(
        fetchEvmChainBalances(chainKey, wallet.address),
        EVM_CHAIN_TIMEOUT_MS,
        `${EVM_CHAINS[chainKey]?.name ?? chainKey} 查询超时`
      )
    )
  )

  const failedChains: string[] = []
  const allAssets: EvmAssetCandidate[] = []

  chainResults.forEach((result, index) => {
    const chainKey = chains[index]
    if (result.status === 'fulfilled') {
      result.value.forEach((asset) => {
        allAssets.push({ ...asset, chainKey })
      })
      return
    }

    failedChains.push(EVM_CHAINS[chainKey]?.name ?? chainKey)
  })

  if (allAssets.length === 0 && failedChains.length > 0) {
    return {
      assets: [],
      error: `EVM 查询失败：${failedChains.join('、')}`,
    }
  }

  const tokensByChain = new Map<string, Array<{ address: string; symbol: string }>>()
  allAssets.forEach((asset) => {
    if (!asset.contractAddress) return
    const current = tokensByChain.get(asset.chainKey) ?? []
    current.push({ address: asset.contractAddress, symbol: asset.symbol })
    tokensByChain.set(asset.chainKey, current)
  })

  const tokenPriceMap = new Map<string, { price: number | null; change24h: number | null; status: AssetBalance['priceStatus'] }>()
  const tokenPriceResults = await Promise.all(
    Array.from(tokensByChain.entries()).map(async ([chainKey, tokens]) => ({
      chainKey,
      prices: await getEvmTokenPrices(tokens, chainKey),
    }))
  )

  tokenPriceResults.forEach(({ prices }) => {
    prices.forEach((price, address) => {
      tokenPriceMap.set(address, {
        price: price.price,
        change24h: price.change24h,
        status: price.status,
      })
    })
  })

  const nativeSymbols = Array.from(new Set(allAssets.filter((asset) => !asset.contractAddress).map((asset) => asset.symbol)))
  const nativePrices = nativeSymbols.length > 0 ? await getPrices(nativeSymbols) : {}

  const merged = new Map<
    string,
    AssetBalance & {
      _chainBreakdowns: { chainKey: string; balance: number }[]
    }
  >()

  allAssets.forEach((asset) => {
    const assetId = asset.contractAddress
      ? `erc20:${asset.chainKey}:${asset.contractAddress}`
      : `native:${asset.chainKey}:${asset.symbol}`
    const priceInfo = asset.contractAddress
      ? tokenPriceMap.get(asset.contractAddress)
      : nativePrices[asset.symbol]
    const existing = merged.get(assetId)

    if (existing) {
      existing.balance += asset.balance
      existing.value = existing.price !== null ? existing.balance * existing.price : null
      existing._chainBreakdowns.push({ chainKey: asset.chainKey, balance: asset.balance })
      return
    }

    merged.set(assetId, {
      assetId,
      symbol: asset.symbol,
      name: asset.symbol,
      balance: asset.balance,
      price: priceInfo?.price ?? null,
      value: priceInfo?.price !== null && priceInfo?.price !== undefined ? asset.balance * priceInfo.price : null,
      change24h: priceInfo?.change24h ?? null,
      priceStatus: priceInfo?.status ?? 'missing',
      chainKey: asset.chainKey,
      contractAddress: asset.contractAddress,
      _chainBreakdowns: [{ chainKey: asset.chainKey, balance: asset.balance }],
    })
  })

  return {
    assets: Array.from(merged.values())
      .filter((asset) => asset.balance > 0)
      .map((asset) => ({
        ...asset,
        _chainBreakdowns: asset._chainBreakdowns.filter((item) => item.balance > 0),
      })),
    warning: failedChains.length > 0 ? `部分链未完成：${failedChains.join('、')}` : undefined,
  }
}

export async function getWalletSnapshot(wallet: WalletQuoteInput): Promise<PortfolioSnapshot> {
  try {
    const result =
      wallet.chainType === 'evm'
        ? await quoteEvmWallet(wallet)
        : wallet.chainType === 'solana'
          ? await quoteSolanaWallet(wallet)
          : await quoteBitcoinWallet(wallet)

    return buildSnapshot(wallet, result)
  } catch (error) {
    return buildSnapshot(wallet, {
      assets: [],
      error: error instanceof Error ? error.message : '查询失败',
    })
  }
}
