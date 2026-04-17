import type {
  AssetBalance,
  AssetSourceDetail,
  CexAccountInput,
  PortfolioSnapshot,
  PriceStatus,
} from '@/types'
import { getPrices } from '@/lib/market'

interface BinanceUserAssetResponseItem {
  asset: string
  free?: string
  locked?: string
  freeze?: string
  withdrawing?: string
  ipoable?: string
}

interface BinanceWalletBalanceResponseItem {
  activate?: boolean
  balance?: string
  walletName?: string
}

interface BinanceAccountInfoResponse {
  isMarginEnabled?: boolean
  isFutureEnabled?: boolean
  isOptionsEnabled?: boolean
  isPortfolioMarginRetailEnabled?: boolean
}

interface BinanceCrossMarginAccountResponse {
  userAssets?: Array<{
    asset: string
    netAsset?: string
  }>
}

interface BinanceIsolatedMarginAccountResponse {
  assets?: Array<{
    baseAsset?: {
      asset: string
      netAsset?: string
    }
    quoteAsset?: {
      asset: string
      netAsset?: string
    }
  }>
}

interface BinanceOptionsMarginAccountResponse {
  asset?: Array<{
    asset: string
    equity?: string
    marginBalance?: string
  }>
}

interface BinanceApiErrorResponse {
  code?: number
  msg?: string
}

interface OkxBalanceResponse {
  code: string
  msg: string
  data?: Array<{
    details?: Array<{
      ccy: string
      cashBal?: string
      availBal?: string
      eq?: string
    }>
  }>
}

type BinanceWalletName =
  | 'Spot'
  | 'Funding'
  | 'Earn'
  | 'Cross Margin'
  | 'Isolated Margin'
  | 'USDⓈ-M Futures'
  | 'COIN-M Futures'
  | 'Options'
  | 'Trading Bots'
  | 'Copy Trading'

interface BinanceWalletMeta {
  key: string
  label: string
  expandable: boolean
}

interface BinanceWalletAssetEntry {
  symbol: string
  balance: number
  walletName: string
  walletKey: string
  walletLabel: string
  assetId?: string
  name?: string
  priceOverride?: number
}

interface PricedBinanceWalletAssetEntry extends BinanceWalletAssetEntry {
  price: number | null
  value: number | null
  change24h: number | null
  priceStatus: PriceStatus
}

interface BinanceWalletFetchResult {
  walletName: string
  items: BinanceWalletAssetEntry[]
  warnings: string[]
  queryAttempted: boolean
}

const BINANCE_WALLET_META: Record<BinanceWalletName, BinanceWalletMeta> = {
  Spot: { key: 'spot', label: '现货', expandable: true },
  Funding: { key: 'funding', label: '资金账户', expandable: true },
  Earn: { key: 'earn', label: '理财', expandable: true },
  'Cross Margin': { key: 'cross-margin', label: '全仓杠杆', expandable: true },
  'Isolated Margin': { key: 'isolated-margin', label: '逐仓杠杆', expandable: true },
  'USDⓈ-M Futures': { key: 'usdm-futures', label: 'U 本位合约', expandable: true },
  'COIN-M Futures': { key: 'coinm-futures', label: '币本位合约', expandable: true },
  Options: { key: 'options', label: '期权', expandable: true },
  'Trading Bots': { key: 'trading-bots', label: '交易机器人', expandable: false },
  'Copy Trading': { key: 'copy-trading', label: '跟单', expandable: false },
}

class BinanceRequestError extends Error {
  code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'BinanceRequestError'
    this.code = code
  }
}

function normalizeCexError(exchange: CexAccountInput['exchange'], message: string) {
  if (
    exchange === 'binance' &&
    message.includes('Service unavailable from a restricted location')
  ) {
    return 'Binance 拒绝了当前服务器所在地区的访问。线上部署需要切到 Binance 允许的地区，或改用 OKX。'
  }

  if (
    exchange === 'binance' &&
    message.includes('Invalid API-key, IP, or permissions for action')
  ) {
    return 'Binance API Key 无效、IP 白名单不匹配，或缺少读取权限。请检查 Key 是否启用只读权限，以及白名单设置是否包含当前请求来源。'
  }

  if (
    exchange === 'binance' &&
    message.includes('Signature for this request is not valid')
  ) {
    return 'Binance API Secret 不正确，签名校验失败。请重新填写 API Key 与 Secret。'
  }

  return message
}

function isBinanceApiErrorResponse(value: unknown): value is BinanceApiErrorResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ('code' in value || 'msg' in value)
  )
}

function toPositiveNumber(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatUsdValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function mergeBalances(items: Array<{ symbol: string; balance: number }>) {
  const merged = new Map<string, number>()

  items.forEach((item) => {
    merged.set(item.symbol, (merged.get(item.symbol) ?? 0) + item.balance)
  })

  return Array.from(merged.entries())
    .map(([symbol, balance]) => ({ symbol, balance }))
    .filter((asset) => asset.balance > 0)
}

function mergeBinanceWalletEntries(items: BinanceWalletAssetEntry[]) {
  const merged = new Map<string, BinanceWalletAssetEntry>()

  items.forEach((item) => {
    const key = `${item.walletKey}:${item.symbol}:${item.assetId ?? ''}`
    const existing = merged.get(key)

    if (existing) {
      existing.balance += item.balance
      return
    }

    merged.set(key, { ...item })
  })

  return Array.from(merged.values()).filter((asset) => asset.balance > 0)
}

function getBinancePricingSymbol(symbol: string) {
  return symbol.startsWith('LD') && symbol.length > 2 ? symbol.slice(2) : symbol
}

function getBinanceWalletMeta(walletName: string): BinanceWalletMeta {
  return BINANCE_WALLET_META[walletName as BinanceWalletName] ?? {
    key: `wallet-${walletName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: walletName,
    expandable: false,
  }
}

function getBinanceWalletLabel(walletName: string) {
  return getBinanceWalletMeta(walletName).label
}

function getBinanceWalletKey(walletName: string) {
  return getBinanceWalletMeta(walletName).key
}

function buildBinanceSourceId(accountId: string, walletKey: string) {
  return `${accountId}:${walletKey}`
}

function buildBinanceSourceLabel(accountLabel: string, walletLabel: string) {
  return `${accountLabel} · ${walletLabel}`
}

function createBinanceWalletEntries(
  walletName: string,
  items: Array<{ symbol: string; balance: number; assetId?: string; name?: string; priceOverride?: number }>
): BinanceWalletAssetEntry[] {
  const walletKey = getBinanceWalletKey(walletName)
  const walletLabel = getBinanceWalletLabel(walletName)

  return items
    .filter((item) => item.balance > 0)
    .map((item) => ({
      ...item,
      walletName,
      walletKey,
      walletLabel,
    }))
}

function formatBinanceWalletQueryWarning(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : '请求失败'
  const code = error instanceof BinanceRequestError ? error.code : undefined

  if (message.includes('Service unavailable from a restricted location')) {
    return `${scope} 查询被 Binance 地域限制拦截。`
  }

  if (code === -2015 || message.includes('Invalid API-key, IP, or permissions for action')) {
    return `${scope} 查询失败：API Key 权限不足、IP 白名单不匹配，或 Key 无效。`
  }

  if (code === -3003 || message.includes('Margin account does not exist')) {
    return `${scope} 未开通，当前无法查询明细。`
  }

  if (message.includes('Signature for this request is not valid')) {
    return `${scope} 查询失败：API Secret 不正确。`
  }

  return `${scope} 查询失败：${message}`
}

function dedupeWarnings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

async function signHmac(secret: string, payload: string, encoding: 'hex' | 'base64') {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const bytes = Array.from(new Uint8Array(signature))

  if (encoding === 'hex') {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return btoa(String.fromCharCode(...bytes))
}

async function fetchBinanceSigned<T>(
  account: CexAccountInput,
  options: {
    path: string
    method?: 'GET' | 'POST'
    params?: Record<string, string | undefined>
    baseUrl?: string
  }
) {
  const params = new URLSearchParams()

  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, value)
    }
  })

  params.set('recvWindow', '5000')
  params.set('timestamp', Date.now().toString())

  const signature = await signHmac(account.apiSecret, params.toString(), 'hex')
  const baseUrl = options.baseUrl ?? 'https://api.binance.com'
  const response = await fetch(
    `${baseUrl}${options.path}?${params.toString()}&signature=${signature}`,
    {
      method: options.method ?? 'GET',
      cache: 'no-store',
      headers: {
        'X-MBX-APIKEY': account.apiKey,
      },
    }
  )

  let data: unknown = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new BinanceRequestError(`Binance 接口请求失败：${options.path}`)
    }
  }

  if (!response.ok || isBinanceApiErrorResponse(data)) {
    throw new BinanceRequestError(
      (isBinanceApiErrorResponse(data) && data.msg) || `Binance 接口请求失败：${options.path}`,
      isBinanceApiErrorResponse(data) ? data.code : undefined
    )
  }

  return data as T
}

function buildSnapshot(
  account: Pick<CexAccountInput, 'id'>,
  assets: AssetBalance[],
  options?: { error?: string; warning?: string }
): PortfolioSnapshot {
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0)
  const hasNonLivePrice = assets.some((asset) => asset.priceStatus && asset.priceStatus !== 'live')
  const status = options?.error ? 'error' : hasNonLivePrice || options?.warning ? 'partial' : 'success'

  return {
    source: account.id,
    sourceType: 'cex',
    assets,
    totalValue,
    updatedAt: new Date().toISOString(),
    status,
    error: options?.error ?? options?.warning,
  }
}

async function fetchBinanceAccountInfo(account: CexAccountInput) {
  return fetchBinanceSigned<BinanceAccountInfoResponse>(account, {
    path: '/sapi/v1/account/info',
  })
}

async function fetchBinanceUserAssets(account: CexAccountInput) {
  const data = await fetchBinanceSigned<BinanceUserAssetResponseItem[]>(account, {
    path: '/sapi/v3/asset/getUserAsset',
    method: 'POST',
  })

  return createBinanceWalletEntries(
    'Spot',
    data
      .map((balance) => ({
        symbol: balance.asset,
        balance:
          toPositiveNumber(balance.free) +
          toPositiveNumber(balance.locked) +
          toPositiveNumber(balance.freeze) +
          toPositiveNumber(balance.withdrawing) +
          toPositiveNumber(balance.ipoable),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceWalletBalances(account: CexAccountInput) {
  return fetchBinanceSigned<BinanceWalletBalanceResponseItem[]>(account, {
    path: '/sapi/v1/asset/wallet/balance',
    params: {
      quoteAsset: 'USDT',
    },
  })
}

async function fetchBinanceSimpleEarnFlexible(account: CexAccountInput) {
  const assets: Array<{ symbol: string; balance: number }> = []
  let current = 1
  const size = 100

  for (;;) {
    const data = await fetchBinanceSigned<{ rows?: Array<{ asset: string; totalAmount?: string }> }>(
      account,
      {
        path: '/sapi/v1/simple-earn/flexible/position',
        params: {
          current: current.toString(),
          size: size.toString(),
        },
      }
    )

    if (!data.rows) {
      throw new Error('Binance 理财活期返回格式异常')
    }

    for (const row of data.rows) {
      const amount = toPositiveNumber(row.totalAmount)
      if (amount > 0) {
        assets.push({ symbol: row.asset, balance: amount })
      }
    }

    if (data.rows.length < size) break
    current += 1
  }

  return createBinanceWalletEntries('Earn', assets)
}

async function fetchBinanceSimpleEarnLocked(account: CexAccountInput) {
  const assets: Array<{ symbol: string; balance: number }> = []
  let current = 1
  const size = 100

  for (;;) {
    const data = await fetchBinanceSigned<{ rows?: Array<{ asset: string; amount?: string }> }>(
      account,
      {
        path: '/sapi/v1/simple-earn/locked/position',
        params: {
          current: current.toString(),
          size: size.toString(),
        },
      }
    )

    if (!data.rows) {
      throw new Error('Binance 理财定期返回格式异常')
    }

    for (const row of data.rows) {
      const amount = toPositiveNumber(row.amount)
      if (amount > 0) {
        assets.push({ symbol: row.asset, balance: amount })
      }
    }

    if (data.rows.length < size) break
    current += 1
  }

  return createBinanceWalletEntries('Earn', assets)
}

async function fetchBinanceBfUsdAccount(account: CexAccountInput) {
  const data = await fetchBinanceSigned<{ bfusdAmount?: string }>(account, {
    path: '/sapi/v1/bfusd/account',
  })
  const amount = toPositiveNumber(data.bfusdAmount)

  return createBinanceWalletEntries('Earn', [
    {
      symbol: 'BFUSD',
      balance: amount,
      priceOverride: 1,
    },
  ])
}

async function fetchBinanceRwUsdAccount(account: CexAccountInput) {
  const data = await fetchBinanceSigned<{ rwusdAmount?: string }>(account, {
    path: '/sapi/v1/rwusd/account',
  })
  const amount = toPositiveNumber(data.rwusdAmount)

  return createBinanceWalletEntries('Earn', [
    {
      symbol: 'RWUSD',
      balance: amount,
      priceOverride: 1,
    },
  ])
}

async function fetchBinanceFundingAsset(account: CexAccountInput) {
  const data = await fetchBinanceSigned<
    Array<{ asset: string; free?: string; locked?: string; freeze?: string; withdrawing?: string }>
  >(account, {
    path: '/sapi/v1/asset/get-funding-asset',
    method: 'POST',
  })

  return createBinanceWalletEntries(
    'Funding',
    data
      .map((item) => ({
        symbol: item.asset,
        balance:
          toPositiveNumber(item.free) +
          toPositiveNumber(item.locked) +
          toPositiveNumber(item.freeze) +
          toPositiveNumber(item.withdrawing),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceCrossMarginAssets(account: CexAccountInput) {
  const data = await fetchBinanceSigned<BinanceCrossMarginAccountResponse>(account, {
    path: '/sapi/v1/margin/account',
  })

  if (!Array.isArray(data.userAssets)) {
    throw new Error('Binance 全仓杠杆返回格式异常')
  }

  return createBinanceWalletEntries(
    'Cross Margin',
    data.userAssets
      .map((item) => ({
        symbol: item.asset,
        balance: toPositiveNumber(item.netAsset),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceIsolatedMarginAssets(account: CexAccountInput) {
  const data = await fetchBinanceSigned<BinanceIsolatedMarginAccountResponse>(account, {
    path: '/sapi/v1/margin/isolated/account',
  })

  if (!Array.isArray(data.assets)) {
    throw new Error('Binance 逐仓杠杆返回格式异常')
  }

  const assets: Array<{ symbol: string; balance: number }> = []

  data.assets.forEach((item) => {
    const baseAmount = toPositiveNumber(item.baseAsset?.netAsset)
    if (baseAmount > 0 && item.baseAsset?.asset) {
      assets.push({ symbol: item.baseAsset.asset, balance: baseAmount })
    }

    const quoteAmount = toPositiveNumber(item.quoteAsset?.netAsset)
    if (quoteAmount > 0 && item.quoteAsset?.asset) {
      assets.push({ symbol: item.quoteAsset.asset, balance: quoteAmount })
    }
  })

  return createBinanceWalletEntries('Isolated Margin', mergeBalances(assets))
}

async function fetchBinanceUsdmFuturesBalance(account: CexAccountInput) {
  const data = await fetchBinanceSigned<
    Array<{ asset: string; balance?: string; crossWalletBalance?: string }>
  >(account, {
    path: '/fapi/v3/balance',
    baseUrl: 'https://fapi.binance.com',
  })

  return createBinanceWalletEntries(
    'USDⓈ-M Futures',
    data
      .map((item) => ({
        symbol: item.asset,
        balance: toPositiveNumber(item.balance),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceCoinmFuturesBalance(account: CexAccountInput) {
  const data = await fetchBinanceSigned<
    Array<{ asset: string; balance?: string; crossWalletBalance?: string }>
  >(account, {
    path: '/dapi/v1/balance',
    baseUrl: 'https://dapi.binance.com',
  })

  return createBinanceWalletEntries(
    'COIN-M Futures',
    data
      .map((item) => ({
        symbol: item.asset,
        balance: toPositiveNumber(item.balance),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceOptionsAssets(account: CexAccountInput) {
  const data = await fetchBinanceSigned<BinanceOptionsMarginAccountResponse>(account, {
    path: '/eapi/v1/marginAccount',
    baseUrl: 'https://eapi.binance.com',
  })

  if (!Array.isArray(data.asset)) {
    throw new Error('Binance 期权账户返回格式异常')
  }

  return createBinanceWalletEntries(
    'Options',
    data.asset
      .map((item) => ({
        symbol: item.asset,
        balance: toPositiveNumber(item.equity) || toPositiveNumber(item.marginBalance),
      }))
      .filter((asset) => asset.balance > 0)
  )
}

async function fetchBinanceEarnAssets(account: CexAccountInput): Promise<BinanceWalletFetchResult> {
  const subtasks = await Promise.allSettled([
    fetchBinanceSimpleEarnFlexible(account),
    fetchBinanceSimpleEarnLocked(account),
    fetchBinanceBfUsdAccount(account),
    fetchBinanceRwUsdAccount(account),
  ])

  const items: BinanceWalletAssetEntry[] = []
  const warnings: string[] = []
  const labels = ['理财活期', '理财定期', 'BFUSD', 'RWUSD']

  subtasks.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value)
      return
    }

    warnings.push(formatBinanceWalletQueryWarning(labels[index], result.reason))
  })

  return {
    walletName: 'Earn',
    items: mergeBinanceWalletEntries(items),
    warnings: dedupeWarnings(warnings),
    queryAttempted: true,
  }
}

async function resolveBinanceWalletQuery(
  walletName: string,
  scopeLabel: string,
  query: () => Promise<BinanceWalletAssetEntry[]>
): Promise<BinanceWalletFetchResult> {
  try {
    return {
      walletName,
      items: mergeBinanceWalletEntries(await query()),
      warnings: [],
      queryAttempted: true,
    }
  } catch (error) {
    return {
      walletName,
      items: [],
      warnings: [formatBinanceWalletQueryWarning(scopeLabel, error)],
      queryAttempted: true,
    }
  }
}

async function priceBinanceWalletEntries(entries: BinanceWalletAssetEntry[]) {
  const uniqueSymbols = Array.from(
    new Set(
      entries
        .filter((entry) => entry.priceOverride === undefined)
        .map((entry) => getBinancePricingSymbol(entry.symbol))
    )
  )
  const prices = uniqueSymbols.length > 0 ? await getPrices(uniqueSymbols) : {}

  return entries.map<PricedBinanceWalletAssetEntry>((entry) => {
    if (entry.priceOverride !== undefined) {
      return {
        ...entry,
        price: entry.priceOverride,
        value: entry.balance * entry.priceOverride,
        change24h: 0,
        priceStatus: 'live',
      }
    }

    const pricingSymbol = getBinancePricingSymbol(entry.symbol)
    const priceInfo = prices[pricingSymbol]
    const price = priceInfo?.price ?? null

    return {
      ...entry,
      price,
      value: price !== null ? entry.balance * price : null,
      change24h: priceInfo?.change24h ?? null,
      priceStatus: priceInfo?.status ?? 'missing',
    }
  })
}

function buildBinanceAssets(
  account: CexAccountInput,
  entries: PricedBinanceWalletAssetEntry[]
): AssetBalance[] {
  const aggregated = new Map<string, AssetBalance & { sources: AssetSourceDetail[] }>()

  entries.forEach((entry) => {
    const assetId = entry.assetId ?? `cex:${entry.symbol.toUpperCase()}`
    const sourceDetail: AssetSourceDetail = {
      sourceId: buildBinanceSourceId(account.id, entry.walletKey),
      sourceType: 'cex',
      sourceLabel: buildBinanceSourceLabel(account.label || account.exchange.toUpperCase(), entry.walletLabel),
      assetId,
      balance: entry.balance,
    }
    const existing = aggregated.get(assetId)

    if (existing) {
      existing.balance += entry.balance
      existing.value =
        existing.value !== null || entry.value !== null
          ? (existing.value ?? 0) + (entry.value ?? 0)
          : null
      existing.change24h = entry.change24h ?? existing.change24h
      existing.price = entry.price ?? existing.price
      existing.priceStatus =
        existing.priceStatus === 'missing' || entry.priceStatus === 'missing'
          ? 'missing'
          : existing.priceStatus === 'stale' || entry.priceStatus === 'stale'
            ? 'stale'
            : 'live'
      existing.sources.push(sourceDetail)
      return
    }

    aggregated.set(assetId, {
      assetId,
      symbol: entry.symbol,
      name: entry.name ?? entry.symbol,
      balance: entry.balance,
      price: entry.price,
      value: entry.value,
      change24h: entry.change24h,
      priceStatus: entry.priceStatus,
      sources: [sourceDetail],
    })
  })

  return Array.from(aggregated.values()).map((asset) => ({
    ...asset,
    sources: asset.sources,
  }))
}

async function fetchBinanceSnapshot(account: CexAccountInput): Promise<{
  assets: AssetBalance[]
  warning?: string
}> {
  const [walletBalances, accountInfo] = await Promise.all([
    fetchBinanceWalletBalances(account),
    fetchBinanceAccountInfo(account).catch(() => null),
  ])

  const officialWalletTotals = new Map<string, number>()
  walletBalances.forEach((wallet) => {
    if (!wallet.activate || !wallet.walletName) return
    officialWalletTotals.set(wallet.walletName, toPositiveNumber(wallet.balance))
  })

  const shouldQueryWallet = (walletName: string) => (officialWalletTotals.get(walletName) ?? 0) > 0

  const tasks: Promise<BinanceWalletFetchResult>[] = [
    resolveBinanceWalletQuery('Spot', '现货账户', () => fetchBinanceUserAssets(account)),
    resolveBinanceWalletQuery('Funding', '资金账户', () => fetchBinanceFundingAsset(account)),
  ]

  if (shouldQueryWallet('Earn')) {
    tasks.push(fetchBinanceEarnAssets(account))
  }

  if (shouldQueryWallet('Cross Margin')) {
    tasks.push(resolveBinanceWalletQuery('Cross Margin', '全仓杠杆', () => fetchBinanceCrossMarginAssets(account)))
  }

  if (shouldQueryWallet('Isolated Margin')) {
    tasks.push(
      resolveBinanceWalletQuery('Isolated Margin', '逐仓杠杆', () => fetchBinanceIsolatedMarginAssets(account))
    )
  }

  if (shouldQueryWallet('USDⓈ-M Futures')) {
    tasks.push(
      resolveBinanceWalletQuery('USDⓈ-M Futures', 'U 本位合约', () => fetchBinanceUsdmFuturesBalance(account))
    )
  }

  if (shouldQueryWallet('COIN-M Futures')) {
    tasks.push(
      resolveBinanceWalletQuery('COIN-M Futures', '币本位合约', () => fetchBinanceCoinmFuturesBalance(account))
    )
  }

  if (shouldQueryWallet('Options')) {
    tasks.push(resolveBinanceWalletQuery('Options', '期权账户', () => fetchBinanceOptionsAssets(account)))
  }

  const walletResults = await Promise.all(tasks)
  const warnings = dedupeWarnings(walletResults.flatMap((result) => result.warnings))
  const resultMap = new Map(walletResults.map((result) => [result.walletName, result]))

  if (accountInfo?.isPortfolioMarginRetailEnabled) {
    warnings.push('当前 Binance 账户已启用组合保证金，杠杆与合约资产若和标准接口口径不一致，将按钱包总额补齐。')
  }

  const pricedEntries = await priceBinanceWalletEntries(
    mergeBinanceWalletEntries(walletResults.flatMap((result) => result.items))
  )
  const pricedValueByWallet = new Map<string, number>()

  pricedEntries.forEach((entry) => {
    pricedValueByWallet.set(
      entry.walletName,
      (pricedValueByWallet.get(entry.walletName) ?? 0) + (entry.value ?? 0)
    )
  })

  const fallbackEntries: BinanceWalletAssetEntry[] = []

  officialWalletTotals.forEach((officialTotal, walletName) => {
    if (officialTotal <= 0) return

    const detailedValue = pricedValueByWallet.get(walletName) ?? 0
    const tolerance = Math.max(1, officialTotal * 0.02)
    const reconciliationGap = officialTotal - detailedValue
    const walletMeta = getBinanceWalletMeta(walletName)
    const result = resultMap.get(walletName)

    if (reconciliationGap <= tolerance) {
      return
    }

    fallbackEntries.push(
      ...createBinanceWalletEntries(walletName, [
        {
          symbol: `${walletMeta.label}未展开资产`,
          name: `Binance ${walletMeta.label}未展开资产`,
          balance: reconciliationGap,
          assetId: `cex:binance:wallet-gap:${walletMeta.key}`,
          priceOverride: 1,
        },
      ])
    )

    if (!walletMeta.expandable) {
      warnings.push(
        `${walletMeta.label} 暂不支持币种级展开，已先按钱包总额保留 ${formatUsdValue(reconciliationGap)}。`
      )
      return
    }

    if (!result?.queryAttempted) {
      warnings.push(
        `${walletMeta.label} 当前未接入明细查询，已先按钱包总额保留 ${formatUsdValue(reconciliationGap)}。`
      )
      return
    }

    if (result.warnings.length > 0) {
      warnings.push(
        `${walletMeta.label} 明细查询未完整返回，已按钱包总额补齐 ${formatUsdValue(reconciliationGap)}。`
      )
      return
    }

    warnings.push(
      `${walletMeta.label} 仍有 ${formatUsdValue(reconciliationGap)} 未能按币种或价格完全展开，已按钱包总额补齐。`
    )
  })

  const assets = buildBinanceAssets(
    account,
    pricedEntries.concat(await priceBinanceWalletEntries(fallbackEntries))
  )

  return {
    assets,
    warning: dedupeWarnings(warnings).join('；') || undefined,
  }
}

async function fetchOkxBalances(account: CexAccountInput) {
  const requestPath = '/api/v5/account/balance'
  const timestamp = new Date().toISOString()
  const payload = `${timestamp}GET${requestPath}`
  const signature = await signHmac(account.apiSecret, payload, 'base64')

  const response = await fetch(`https://www.okx.com${requestPath}`, {
    cache: 'no-store',
    headers: {
      'OK-ACCESS-KEY': account.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': account.passphrase ?? '',
    },
  })

  const data = (await response.json()) as OkxBalanceResponse

  if (!response.ok || data.code !== '0') {
    throw new Error(data.msg || 'OKX 账户查询失败')
  }

  return (data.data?.[0]?.details ?? [])
    .map((detail) => ({
      symbol: detail.ccy,
      balance: toPositiveNumber(detail.cashBal) || toPositiveNumber(detail.availBal) || toPositiveNumber(detail.eq),
    }))
    .filter((asset) => asset.balance > 0)
}

export async function getCexSnapshot(account: CexAccountInput): Promise<PortfolioSnapshot> {
  try {
    if (account.exchange === 'binance') {
      const { assets, warning } = await fetchBinanceSnapshot(account)
      return buildSnapshot(account, assets, { warning })
    }

    const rawAssets = await fetchOkxBalances(account)
    const prices = await getPrices(Array.from(new Set(rawAssets.map((asset) => asset.symbol))))
    const assets: AssetBalance[] = rawAssets.map((asset) => {
      const priceInfo = prices[asset.symbol]
      const price = priceInfo?.price ?? null

      return {
        assetId: `cex:${asset.symbol.toUpperCase()}`,
        symbol: asset.symbol,
        name: asset.symbol,
        balance: asset.balance,
        price,
        value: price !== null ? asset.balance * price : null,
        change24h: priceInfo?.change24h ?? null,
        priceStatus: priceInfo?.status ?? 'missing',
      }
    })

    return buildSnapshot(account, assets)
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询失败'
    return buildSnapshot(account, [], { error: normalizeCexError(account.exchange, message) })
  }
}
