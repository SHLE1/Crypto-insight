import type {
  AssetBalance,
  AssetSourceDetail,
  CexAccountInput,
  PortfolioSnapshot,
  PriceStatus,
} from '@/types'
import { getPrices } from '@/lib/market'
import { formatCurrency } from '@/lib/validators'

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

interface BinancePortfolioMarginBalanceItem {
  asset: string
  crossMarginAsset?: string
  crossMarginFree?: string
  crossMarginInterest?: string
  crossMarginLocked?: string
  crossMarginBorrowed?: string
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

interface BitgetApiResponse<T> {
  code?: string
  msg?: string
  message?: string
  data?: T
}

interface BitgetSpotAssetResponseItem {
  coin?: string
  available?: string
  frozen?: string
  locked?: string
  limitAvailable?: string
}

interface BitgetMixAssetListItem {
  coin?: string
  available?: string
}

interface BitgetMixAccountResponseItem {
  marginCoin?: string
  available?: string
  locked?: string
  accountEquity?: string
  assetMode?: string
  assetList?: BitgetMixAssetListItem[]
}

interface BitgetAllAccountBalanceResponseItem {
  accountType?: string
  usdtBalance?: string
}

interface BitgetUnifiedAssetItem {
  coin?: string
  equity?: string
  usdValue?: string
  balance?: string
  available?: string
  locked?: string
}

interface BitgetUnifiedAssetsResponse {
  accountEquity?: string
  assets?: BitgetUnifiedAssetItem[]
}

interface BitgetFundingAssetItem {
  coin?: string
  available?: string
  frozen?: string
  balance?: string
}

type BitgetLooseRecord = Record<string, unknown>

interface GateApiErrorResponse {
  label?: string
  message?: string
}

interface GateSpotAccountResponseItem {
  currency?: string
  available?: string
  locked?: string
}

interface GateTotalBalanceDetail {
  amount?: string
  currency?: string
  borrowed?: string
  unrealised_pnl?: string
}

interface GateTotalBalanceResponse {
  total?: GateTotalBalanceDetail
  details?: Record<string, GateTotalBalanceDetail | undefined>
}

interface GateStakingAssetResponseItem {
  mortgage_coin?: string
  mortgage_amount?: string
  freeze_amount?: string
  defi_income?: {
    total?: Array<{
      coin?: string
      amount?: string
    }>
  }
}

type BinanceWalletName =
  | 'Spot'
  | 'Funding'
  | 'Earn'
  | 'Cross Margin'
  | 'Cross Margin (PM)'
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

interface ExchangeAssetEntry {
  symbol: string
  balance: number
  sourceKey: string
  sourceLabel: string
  reconciliationGroup: string
  assetId?: string
  name?: string
  priceOverride?: number
}

interface PricedExchangeAssetEntry extends ExchangeAssetEntry {
  price: number | null
  value: number | null
  change24h: number | null
  priceStatus: PriceStatus
}

const BINANCE_WALLET_META: Record<BinanceWalletName, BinanceWalletMeta> = {
  Spot: { key: 'spot', label: '现货', expandable: true },
  Funding: { key: 'funding', label: '资金账户', expandable: true },
  Earn: { key: 'earn', label: '理财', expandable: true },
  'Cross Margin': { key: 'cross-margin', label: '全仓杠杆', expandable: true },
  'Cross Margin (PM)': { key: 'cross-margin-pm', label: '全仓杠杆 (PM)', expandable: true },
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

class BitgetRequestError extends Error {
  code?: string
  status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'BitgetRequestError'
    this.code = options?.code
    this.status = options?.status
  }
}

class GateRequestError extends Error {
  label?: string
  status?: number

  constructor(message: string, options?: { label?: string; status?: number }) {
    super(message)
    this.name = 'GateRequestError'
    this.label = options?.label
    this.status = options?.status
  }
}

function assertCexCredentials(account: CexAccountInput) {
  const missingFields: string[] = []

  if (!account.apiKey.trim()) {
    missingFields.push('API Key')
  }

  if (!account.apiSecret.trim()) {
    missingFields.push('API Secret')
  }

  if ((account.exchange === 'okx' || account.exchange === 'bitget') && !account.passphrase?.trim()) {
    missingFields.push('Passphrase')
  }

  if (missingFields.length > 0) {
    throw new Error(`缺少 ${missingFields.join('、')}。出于安全考虑，交易所密钥不会长期保存，请重新填写后再刷新。`)
  }
}

function normalizeCexError(account: CexAccountInput, error: unknown) {
  const message = error instanceof Error ? error.message : '查询失败'
  const exchange = account.exchange

  if (message.includes('Zero-length key is not supported')) {
    return 'API Secret 为空。出于安全考虑，交易所密钥不会长期保存，请重新填写后再刷新。'
  }

  if (message.startsWith('缺少 ')) {
    return message
  }

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

  if (exchange === 'bitget') {
    const code = error instanceof BitgetRequestError ? error.code : undefined
    const status = error instanceof BitgetRequestError ? error.status : undefined

    if (status === 429 || code === '429' || message.includes('Too many requests')) {
      return 'Bitget 请求过于频繁，请稍后重试。'
    }

    if (code === '40011' || code === '40036') {
      return 'Bitget Passphrase 缺失或不正确，请重新填写 Bitget Passphrase。'
    }

    if (code === '40038' || code === '22010' || message.toLowerCase().includes('whitelist')) {
      return 'Bitget API Key 权限不足，或 IP 白名单不匹配。请检查只读权限和 IP 白名单。'
    }

    if (message.includes('Unified Account mode') || message.includes('Classic Account API is not supported')) {
      return 'Bitget 账号是 Unified Account，请确认 API Key 已开启 Unified Account Management Read 权限。'
    }

    if (message.toLowerCase().includes('uta') || message.includes('Unified Account')) {
      return 'Bitget Unified Account 查询失败，请确认 API Key 已开启 Unified Account Management Read 权限。'
    }

    if (code === '40006' || message.includes('Invalid ACCESS_KEY')) {
      return 'Bitget API Key 无效，或读取权限不足。请检查只读权限和 IP 白名单。'
    }

    if (code === '40012' || message.includes('passphrase is error') || message.includes('apikey/password is incorrect')) {
      return 'Bitget Passphrase 缺失或不正确，请重新填写 Bitget Passphrase。'
    }

    if (code === '40002' || message.toLowerCase().includes('signature')) {
      return 'Bitget API Secret 不正确，签名校验失败。请重新填写 API Key、API Secret 和 Passphrase。'
    }

    if (message.includes('返回格式异常')) {
      return 'Bitget 返回数据无法识别，请稍后重试。'
    }

    if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('network')) {
      return 'Bitget 当前请求失败，请检查网络后重试。'
    }
  }

  if (exchange === 'gate') {
    const label = error instanceof GateRequestError ? error.label : undefined
    const status = error instanceof GateRequestError ? error.status : undefined

    if (status === 429 || label === 'TOO_MANY_REQUESTS') {
      return 'Gate 请求过于频繁，请稍后重试。'
    }

    if (label === 'REQUEST_EXPIRED') {
      return 'Gate 请求时间戳无效，本机或服务器时间可能不准确，请稍后重试。'
    }

    if (label === 'INVALID_SIGNATURE') {
      return 'Gate API Secret 不正确，签名校验失败。请重新填写 API Key 与 API Secret。'
    }

    if (
      label === 'INVALID_KEY' ||
      label === 'INVALID_CREDENTIALS' ||
      label === 'IP_FORBIDDEN' ||
      label === 'FORBIDDEN' ||
      label === 'MISSING_REQUIRED_HEADER'
    ) {
      return 'Gate API v4 Key 无效、权限不足，或 IP 白名单不匹配。请检查 API v4 Key 权限和 IP 白名单。'
    }

    if (message.includes('返回格式异常')) {
      return 'Gate 返回数据无法识别，请稍后重试。'
    }

    if (message.toLowerCase().includes('fetch failed') || message.toLowerCase().includes('network')) {
      return 'Gate 当前请求失败，请检查网络后重试。'
    }
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

function isGateApiErrorResponse(value: unknown): value is GateApiErrorResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ('label' in value || 'message' in value)
  )
}

function toPositiveNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function isLooseRecord(value: unknown): value is BitgetLooseRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getStringFromRecord(record: BitgetLooseRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return ''
}

function getPositiveNumberFromRecord(record: BitgetLooseRecord, keys: string[]) {
  for (const key of keys) {
    const value = toPositiveNumber(record[key])

    if (value > 0) {
      return value
    }
  }

  return 0
}

const BITGET_EARN_LIST_KEYS = [
  'assets',
  'assetList',
  'list',
  'items',
  'productList',
  'resultList',
  'savingsList',
  'holdingList',
  'coinList',
]

const BITGET_EARN_SYMBOL_KEYS = [
  'coin',
  'asset',
  'currency',
  'baseCoin',
  'productCoin',
  'subscribeCoin',
  'redeemCoin',
]

const BITGET_EARN_BALANCE_KEYS = [
  'totalAmount',
  'amount',
  'balance',
  'holdingAmount',
  'currentAmount',
  'assetAmount',
  'assetsAmount',
  'subscribeAmount',
  'availableAmount',
  'principal',
  'capitalAmount',
  'quantity',
  'coinAmount',
  'productAmount',
]

const BITGET_EARN_VALUE_KEYS = [
  'value',
  'usdtAmount',
  'usdAmount',
  'usdValue',
  'assetUsdtAmount',
  'usdtBalance',
  'assetValue',
]

function collectBitgetEarnRecords(value: unknown, depth = 0): BitgetLooseRecord[] {
  if (depth > 4 || value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectBitgetEarnRecords(item, depth + 1))
  }

  if (!isLooseRecord(value)) {
    return []
  }

  const nestedRecords = BITGET_EARN_LIST_KEYS.flatMap((key) =>
    collectBitgetEarnRecords(value[key], depth + 1)
  )

  if (nestedRecords.length > 0) {
    return nestedRecords
  }

  const symbol = getStringFromRecord(value, BITGET_EARN_SYMBOL_KEYS)
  const balance = getPositiveNumberFromRecord(value, BITGET_EARN_BALANCE_KEYS)
  const usdValue = getPositiveNumberFromRecord(value, BITGET_EARN_VALUE_KEYS)

  if (!symbol || (balance <= 0 && usdValue <= 0)) {
    return []
  }

  return [value]
}

function parseBitgetEarnEntries(payload: unknown) {
  const records = collectBitgetEarnRecords(payload)
  const entries: ExchangeAssetEntry[] = []
  let unresolvedUsdValue = 0

  records.forEach((record) => {
    const symbol = getStringFromRecord(record, BITGET_EARN_SYMBOL_KEYS).trim().toUpperCase()
    const balance = getPositiveNumberFromRecord(record, BITGET_EARN_BALANCE_KEYS)
    const usdValue = getPositiveNumberFromRecord(record, BITGET_EARN_VALUE_KEYS)

    if (!symbol) {
      return
    }

    if (balance <= 0) {
      unresolvedUsdValue += usdValue
      return
    }

    const name = getStringFromRecord(record, ['productName', 'assetName']).trim()

    entries.push({
      symbol,
      balance,
      name: name || undefined,
      sourceKey: 'earn',
      sourceLabel: '理财',
      reconciliationGroup: 'earn',
      priceOverride: usdValue > 0 ? usdValue / balance : undefined,
    })
  })

  if (entries.length === 0 && unresolvedUsdValue > 0) {
    entries.push({
      symbol: '理财未展开资产',
      name: 'Bitget 理财未展开资产',
      balance: unresolvedUsdValue,
      assetId: 'cex:bitget:earn-unparsed',
      sourceKey: 'earn-unparsed',
      sourceLabel: '理财',
      reconciliationGroup: 'earn',
      priceOverride: 1,
    })
  }

  return mergeExchangeEntries(entries)
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
  return signHmacWithHash(secret, payload, { encoding, hash: 'SHA-256' })
}

async function signHmacWithHash(
  secret: string,
  payload: string,
  options: { encoding: 'hex' | 'base64'; hash: 'SHA-256' | 'SHA-512' }
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: options.hash },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const bytes = Array.from(new Uint8Array(signature))

  if (options.encoding === 'hex') {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return Buffer.from(bytes).toString('base64')
}

async function sha512Hex(payload: string) {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
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

function mergeExchangeEntries(entries: ExchangeAssetEntry[]) {
  const merged = new Map<string, ExchangeAssetEntry>()

  entries.forEach((entry) => {
    const key = `${entry.sourceKey}:${entry.symbol}:${entry.assetId ?? ''}`
    const existing = merged.get(key)

    if (existing) {
      existing.balance += entry.balance
      return
    }

    merged.set(key, { ...entry })
  })

  return Array.from(merged.values()).filter((entry) => entry.balance > 0)
}

async function priceExchangeEntries(entries: ExchangeAssetEntry[]) {
  const uniqueSymbols = Array.from(
    new Set(
      entries
        .filter((entry) => entry.priceOverride === undefined)
        .map((entry) => entry.symbol.trim().toUpperCase())
    )
  )
  const prices = uniqueSymbols.length > 0 ? await getPrices(uniqueSymbols) : {}

  return entries.map<PricedExchangeAssetEntry>((entry) => {
    if (entry.priceOverride !== undefined) {
      return {
        ...entry,
        price: entry.priceOverride,
        value: entry.balance * entry.priceOverride,
        change24h: 0,
        priceStatus: 'live',
      }
    }

    const priceInfo = prices[entry.symbol.trim().toUpperCase()]
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

function buildExchangeAssets(
  account: Pick<CexAccountInput, 'id' | 'label' | 'exchange'>,
  entries: PricedExchangeAssetEntry[]
): AssetBalance[] {
  const aggregated = new Map<string, AssetBalance & { sources: AssetSourceDetail[] }>()
  const accountLabel = account.label || account.exchange.toUpperCase()

  entries.forEach((entry) => {
    const assetId = entry.assetId ?? `cex:${entry.symbol.toUpperCase()}`
    const sourceDetail: AssetSourceDetail = {
      sourceId: `${account.id}:${entry.sourceKey}`,
      sourceType: 'cex',
      sourceLabel: `${accountLabel} · ${entry.sourceLabel}`,
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

async function fetchBinancePortfolioMarginCrossMarginAssets(account: CexAccountInput) {
  const data = await fetchBinanceSigned<BinancePortfolioMarginBalanceItem[] | BinancePortfolioMarginBalanceItem>(
    account,
    {
      path: '/papi/v1/balance',
      baseUrl: 'https://papi.binance.com',
    }
  )
  const items = Array.isArray(data) ? data : [data]

  return createBinanceWalletEntries(
    'Cross Margin (PM)',
    items
      .map((item) => ({
        symbol: item.asset,
        balance:
          toPositiveNumber(item.crossMarginAsset) ||
          toPositiveNumber(item.crossMarginFree) +
            toPositiveNumber(item.crossMarginLocked) -
            toPositiveNumber(item.crossMarginBorrowed) -
            toPositiveNumber(item.crossMarginInterest),
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

  if (shouldQueryWallet('Cross Margin (PM)')) {
    tasks.push(
      resolveBinanceWalletQuery('Cross Margin (PM)', '全仓杠杆 (PM)', () =>
        fetchBinancePortfolioMarginCrossMarginAssets(account)
      )
    )
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
        `${walletMeta.label} 暂不支持币种级展开，已先按钱包总额保留 ${formatCurrency(reconciliationGap)}。`
      )
      return
    }

    if (!result?.queryAttempted) {
      warnings.push(
        `${walletMeta.label} 当前未接入明细查询，已先按钱包总额保留 ${formatCurrency(reconciliationGap)}。`
      )
      return
    }

    if (result.warnings.length > 0) {
      warnings.push(
        `${walletMeta.label} 明细查询未完整返回，已按钱包总额补齐 ${formatCurrency(reconciliationGap)}。`
      )
      return
    }

    warnings.push(
      `${walletMeta.label} 仍有 ${formatCurrency(reconciliationGap)} 未能按币种或价格完全展开，已按钱包总额补齐。`
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

async function fetchBitgetSigned<T>(
  account: CexAccountInput,
  options: {
    path: string
    method?: 'GET' | 'POST'
    params?: Record<string, string | undefined>
    body?: unknown
  }
) {
  const method = options.method ?? 'GET'
  const searchParams = new URLSearchParams()

  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  const requestBody = options.body ? JSON.stringify(options.body) : ''
  const timestamp = Date.now().toString()
  const prehash = `${timestamp}${method}${options.path}${queryString ? `?${queryString}` : ''}${requestBody}`
  const signature = await signHmac(account.apiSecret, prehash, 'base64')
  const response = await fetch(
    `https://api.bitget.com${options.path}${queryString ? `?${queryString}` : ''}`,
    {
      method,
      cache: 'no-store',
      headers: {
        'ACCESS-KEY': account.apiKey,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': account.passphrase ?? '',
        'Content-Type': 'application/json',
        locale: 'en-US',
      },
      body: requestBody || undefined,
    }
  )

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    throw new BitgetRequestError('Bitget 返回格式异常', { status: response.status })
  }

  const result = payload as BitgetApiResponse<T>
  const successCode = result.code === '00000' || result.code === '0'

  if (!response.ok || !successCode) {
    throw new BitgetRequestError(
      result.msg || result.message || 'Bitget 请求失败',
      { code: result.code, status: response.status }
    )
  }

  return result.data as T
}

async function fetchBitgetSpotAssets(account: CexAccountInput) {
  const data = await fetchBitgetSigned<BitgetSpotAssetResponseItem[]>(account, {
    path: '/api/v2/spot/account/assets',
    params: {
      assetType: 'hold_only',
    },
  })

  if (!Array.isArray(data)) {
    throw new Error('Bitget 现货账户返回格式异常')
  }

  return data
    .map<ExchangeAssetEntry | null>((item) => {
      const symbol = item.coin?.trim().toUpperCase()
      if (!symbol) return null

      const balance =
        toPositiveNumber(item.available) +
        toPositiveNumber(item.frozen) +
        toPositiveNumber(item.locked) +
        toPositiveNumber(item.limitAvailable)

      if (balance <= 0) return null

      return {
        symbol,
        balance,
        sourceKey: 'spot',
        sourceLabel: '现货账户',
        reconciliationGroup: 'spot',
      }
    })
    .filter((item): item is ExchangeAssetEntry => Boolean(item))
}

async function fetchBitgetMixAccounts(account: CexAccountInput, productType: 'USDT-FUTURES' | 'USDC-FUTURES' | 'COIN-FUTURES') {
  const data = await fetchBitgetSigned<BitgetMixAccountResponseItem[]>(account, {
    path: '/api/v2/mix/account/accounts',
    params: {
      productType,
    },
  })

  if (!Array.isArray(data)) {
    throw new Error('Bitget 合约账户返回格式异常')
  }

  return data.flatMap<ExchangeAssetEntry>((item) => {
    const entries: ExchangeAssetEntry[] = []

    if (Array.isArray(item.assetList) && item.assetList.length > 0) {
      item.assetList.forEach((asset) => {
        const symbol = asset.coin?.trim().toUpperCase()
        const balance = toPositiveNumber(asset.available)

        if (!symbol || balance <= 0) return

        entries.push({
          symbol,
          balance,
          sourceKey: `futures-${productType.toLowerCase()}`,
          sourceLabel: `${productType} 合约`,
          reconciliationGroup: 'futures',
        })
      })
      return entries
    }

    const symbol = item.marginCoin?.trim().toUpperCase()
    const balance = toPositiveNumber(item.accountEquity) || toPositiveNumber(item.available) + toPositiveNumber(item.locked)

    if (!symbol || balance <= 0) {
      return entries
    }

    entries.push({
      symbol,
      balance,
      sourceKey: `futures-${productType.toLowerCase()}`,
      sourceLabel: `${productType} 合约`,
      reconciliationGroup: 'futures',
    })

    return entries
  })
}

async function fetchBitgetAllAccountBalances(account: CexAccountInput) {
  const data = await fetchBitgetSigned<BitgetAllAccountBalanceResponseItem[]>(account, {
    path: '/api/v2/account/all-account-balance',
  })

  if (!Array.isArray(data)) {
    throw new Error('Bitget 账户总额返回格式异常')
  }

  return data
}

async function fetchBitgetUnifiedAssets(account: CexAccountInput) {
  const data = await fetchBitgetSigned<BitgetUnifiedAssetsResponse>(account, {
    path: '/api/v3/account/assets',
  })

  if (!data || !Array.isArray(data.assets)) {
    throw new Error('Bitget Unified Account 返回格式异常')
  }

  return data.assets
    .map<ExchangeAssetEntry | null>((item) => {
      const symbol = item.coin?.trim().toUpperCase()
      const balance = toPositiveNumber(item.equity) || toPositiveNumber(item.balance)
      const usdValue = toPositiveNumber(item.usdValue)

      if (!symbol || balance <= 0) return null

      return {
        symbol,
        balance,
        sourceKey: 'unified',
        sourceLabel: 'Unified Account',
        reconciliationGroup: 'unified',
        priceOverride: usdValue > 0 ? usdValue / balance : undefined,
      }
    })
    .filter((item): item is ExchangeAssetEntry => Boolean(item))
}

async function fetchBitgetFundingAssets(account: CexAccountInput) {
  const data = await fetchBitgetSigned<BitgetFundingAssetItem[]>(account, {
    path: '/api/v3/account/funding-assets',
  })

  if (!Array.isArray(data)) {
    throw new Error('Bitget Funding Account 返回格式异常')
  }

  return data
    .map<ExchangeAssetEntry | null>((item) => {
      const symbol = item.coin?.trim().toUpperCase()
      const balance =
        toPositiveNumber(item.balance) ||
        toPositiveNumber(item.available) + toPositiveNumber(item.frozen)

      if (!symbol || balance <= 0) return null

      return {
        symbol,
        balance,
        sourceKey: 'funding',
        sourceLabel: '资金账户',
        reconciliationGroup: 'funding',
      }
    })
    .filter((item): item is ExchangeAssetEntry => Boolean(item))
}

async function fetchBitgetEarnAssets(account: CexAccountInput) {
  const attempts: Array<() => Promise<unknown>> = [
    () => fetchBitgetSigned(account, { path: '/api/v2/earn/account/assets' }),
    () => fetchBitgetSigned(account, { path: '/api/v2/earn/savings/assets' }),
    () => fetchBitgetSigned(account, { path: '/api/v2/earn/savings/account' }),
  ]

  let lastError: unknown = null

  for (const attempt of attempts) {
    try {
      const data = await attempt()
      const entries = parseBitgetEarnEntries(data)

      if (entries.length > 0) {
        return entries
      }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) {
    throw lastError
  }

  return []
}

function isBitgetUnifiedApiUnavailableForClassic(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('classic account') &&
    (
      normalizedMessage.includes('unified account') ||
      normalizedMessage.includes('uta') ||
      normalizedMessage.includes('not supported')
    )
  )
}

function getBitgetAccountTypeLabel(accountType: string) {
  const labels: Record<string, string> = {
    spot: '现货账户',
    futures: '合约账户',
    funding: '资金账户',
    earn: '理财',
    bots: 'Bots',
    margin: '杠杆账户',
  }

  return labels[accountType] ?? accountType
}

async function fetchBitgetUnifiedSnapshot(account: CexAccountInput): Promise<{
  assets: AssetBalance[]
  warning?: string
}> {
  const [unifiedResult, fundingResult, earnResult] = await Promise.allSettled([
    fetchBitgetUnifiedAssets(account),
    fetchBitgetFundingAssets(account),
    fetchBitgetEarnAssets(account),
  ])

  const warnings: string[] = []
  const entries: ExchangeAssetEntry[] = []

  if (unifiedResult.status === 'fulfilled') {
    entries.push(...unifiedResult.value)
  } else {
    throw unifiedResult.reason
  }

  if (fundingResult.status === 'fulfilled') {
    entries.push(...fundingResult.value)
  } else {
    warnings.push(`Bitget 资金账户查询失败：${normalizeCexError(account, fundingResult.reason)}`)
  }

  if (earnResult.status === 'fulfilled') {
    entries.push(...earnResult.value)
  } else {
    warnings.push(`Bitget 理财接口查询失败：${normalizeCexError(account, earnResult.reason)}`)
  }

  const assets = buildExchangeAssets(account, await priceExchangeEntries(mergeExchangeEntries(entries)))

  return {
    assets,
    warning: dedupeWarnings(warnings).join('；') || undefined,
  }
}

async function fetchBitgetClassicSnapshot(account: CexAccountInput): Promise<{
  assets: AssetBalance[]
  warning?: string
}> {
  const [spotResult, usdtResult, usdcResult, coinResult, totalResult, earnResult] = await Promise.allSettled([
    fetchBitgetSpotAssets(account),
    fetchBitgetMixAccounts(account, 'USDT-FUTURES'),
    fetchBitgetMixAccounts(account, 'USDC-FUTURES'),
    fetchBitgetMixAccounts(account, 'COIN-FUTURES'),
    fetchBitgetAllAccountBalances(account),
    fetchBitgetEarnAssets(account),
  ])

  const warnings: string[] = []
  const entries: ExchangeAssetEntry[] = []
  const failedGroups = new Set<string>()
  const firstFailure = [spotResult, usdtResult, usdcResult, coinResult, totalResult, earnResult].find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )

  if (spotResult.status === 'fulfilled') {
    entries.push(...spotResult.value)
  } else {
    failedGroups.add('spot')
    warnings.push(`Bitget 现货账户查询失败：${normalizeCexError(account, spotResult.reason)}`)
  }

  const futuresResults = [usdtResult, usdcResult, coinResult]
  futuresResults.forEach((result, index) => {
    const productType = ['USDT-FUTURES', 'USDC-FUTURES', 'COIN-FUTURES'][index]
    if (result.status === 'fulfilled') {
      entries.push(...result.value)
      return
    }

    failedGroups.add('futures')
    warnings.push(`Bitget ${productType} 查询失败：${normalizeCexError(account, result.reason)}`)
  })

  if (earnResult.status === 'fulfilled') {
    entries.push(...earnResult.value)
  } else {
    warnings.push(`Bitget 理财接口查询失败：${normalizeCexError(account, earnResult.reason)}`)
  }

  if (entries.length === 0 && totalResult.status === 'rejected') {
    throw firstFailure?.reason ?? totalResult.reason
  }

  const pricedEntries = await priceExchangeEntries(mergeExchangeEntries(entries))
  const detailedValueByGroup = new Map<string, number>()

  pricedEntries.forEach((entry) => {
    detailedValueByGroup.set(
      entry.reconciliationGroup,
      (detailedValueByGroup.get(entry.reconciliationGroup) ?? 0) + (entry.value ?? 0)
    )
  })

  const fallbackEntries: ExchangeAssetEntry[] = []

  if (totalResult.status === 'fulfilled') {
    totalResult.value.forEach((item) => {
      const accountType = item.accountType?.trim().toLowerCase()
      const officialTotal = toPositiveNumber(item.usdtBalance)

      if (!accountType || officialTotal <= 0) return

      const detailedValue = detailedValueByGroup.get(accountType) ?? 0
      const tolerance = Math.max(1, officialTotal * 0.02)
      const gap = officialTotal - detailedValue

      if (gap <= tolerance) {
        return
      }

      const label = getBitgetAccountTypeLabel(accountType)
      fallbackEntries.push({
        symbol: `${label}未展开资产`,
        name: `Bitget ${label}未展开资产`,
        balance: gap,
        assetId: `cex:bitget:account-gap:${accountType}`,
        sourceKey: `account-gap-${accountType}`,
        sourceLabel: label,
        reconciliationGroup: accountType,
        priceOverride: 1,
      })

      if (accountType !== 'spot' && accountType !== 'futures') {
        warnings.push(`${label} 暂未接入币种级展开，已按账户总额保留 ${formatCurrency(gap)}。`)
        return
      }

      if (failedGroups.has(accountType)) {
        warnings.push(`${label} 明细查询未完整返回，已按账户总额补齐 ${formatCurrency(gap)}。`)
        return
      }

      warnings.push(`${label} 仍有 ${formatCurrency(gap)} 暂时不能按币种完全展开，已按账户总额补齐。`)
    })
  } else if (entries.length > 0) {
    warnings.push(`Bitget 账户总额查询失败：${normalizeCexError(account, totalResult.reason)}`)
  } else {
    throw totalResult.reason
  }

  const assets = buildExchangeAssets(
    account,
    pricedEntries.concat(await priceExchangeEntries(fallbackEntries))
  )

  return {
    assets,
    warning: dedupeWarnings(warnings).join('；') || undefined,
  }
}

async function fetchBitgetSnapshot(account: CexAccountInput): Promise<{
  assets: AssetBalance[]
  warning?: string
}> {
  try {
    return await fetchBitgetUnifiedSnapshot(account)
  } catch (error) {
    if (isBitgetUnifiedApiUnavailableForClassic(error)) {
      return fetchBitgetClassicSnapshot(account)
    }

    throw error
  }
}

async function fetchGateSigned<T>(
  account: CexAccountInput,
  options: {
    path: string
    method?: 'GET' | 'POST'
    params?: Record<string, string | undefined>
    body?: unknown
  }
) {
  const method = options.method ?? 'GET'
  const prefix = '/api/v4'
  const searchParams = new URLSearchParams()

  Object.entries(options.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value)
    }
  })

  const queryString = searchParams.toString()
  const requestBody = options.body ? JSON.stringify(options.body) : ''
  const bodyHash = await sha512Hex(requestBody)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signString = `${method}\n${prefix}${options.path}\n${queryString}\n${bodyHash}\n${timestamp}`
  const signature = await signHmacWithHash(account.apiSecret, signString, {
    encoding: 'hex',
    hash: 'SHA-512',
  })
  const response = await fetch(
    `https://api.gateio.ws${prefix}${options.path}${queryString ? `?${queryString}` : ''}`,
    {
      method,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        KEY: account.apiKey,
        Timestamp: timestamp,
        SIGN: signature,
      },
      body: requestBody || undefined,
    }
  )

  let payload: unknown = null

  try {
    payload = await response.json()
  } catch {
    throw new GateRequestError('Gate 返回格式异常', { status: response.status })
  }

  if (!response.ok) {
    throw new GateRequestError(
      isGateApiErrorResponse(payload) ? payload.message || 'Gate 请求失败' : 'Gate 请求失败',
      {
        label: isGateApiErrorResponse(payload) ? payload.label : undefined,
        status: response.status,
      }
    )
  }

  return payload as T
}

async function fetchGateSpotAccounts(account: CexAccountInput) {
  const data = await fetchGateSigned<GateSpotAccountResponseItem[]>(account, {
    path: '/spot/accounts',
  })

  if (!Array.isArray(data)) {
    throw new Error('Gate 现货账户返回格式异常')
  }

  return data
    .map<ExchangeAssetEntry | null>((item) => {
      const symbol = item.currency?.trim().toUpperCase()
      if (!symbol) return null

      const balance = toPositiveNumber(item.available) + toPositiveNumber(item.locked)
      if (balance <= 0) return null

      return {
        symbol,
        balance,
        sourceKey: 'spot',
        sourceLabel: '现货账户',
        reconciliationGroup: 'spot',
      }
    })
    .filter((item): item is ExchangeAssetEntry => Boolean(item))
}

async function fetchGateStakingAssets(account: CexAccountInput) {
  const data = await fetchGateSigned<GateStakingAssetResponseItem[]>(account, {
    path: '/earn/staking/assets',
  })

  if (!Array.isArray(data)) {
    throw new Error('Gate 链上赚币返回格式异常')
  }

  return data.flatMap<ExchangeAssetEntry>((item) => {
    const entries: ExchangeAssetEntry[] = []
    const symbol = item.mortgage_coin?.trim().toUpperCase()
    const principal = toPositiveNumber(item.mortgage_amount) + toPositiveNumber(item.freeze_amount)

    if (symbol && principal > 0) {
      entries.push({
        symbol,
        balance: principal,
        sourceKey: 'earn-staking',
        sourceLabel: '链上赚币',
        reconciliationGroup: 'earn-staking',
      })
    }

    item.defi_income?.total?.forEach((reward) => {
      const rewardSymbol = reward.coin?.trim().toUpperCase()
      const rewardAmount = toPositiveNumber(reward.amount)

      if (!rewardSymbol || rewardAmount <= 0) {
        return
      }

      entries.push({
        symbol: rewardSymbol,
        balance: rewardAmount,
        sourceKey: 'earn-staking-reward',
        sourceLabel: '链上赚币收益',
        reconciliationGroup: 'earn-staking',
      })
    })

    return entries
  })
}

async function fetchGateTotalBalance(account: CexAccountInput) {
  const data = await fetchGateSigned<GateTotalBalanceResponse>(account, {
    path: '/wallet/total_balance',
    params: {
      currency: 'USDT',
    },
  })

  if (!data || typeof data !== 'object') {
    throw new Error('Gate 账户总额返回格式异常')
  }

  return data
}

async function fetchGateSnapshot(account: CexAccountInput): Promise<{
  assets: AssetBalance[]
  warning?: string
}> {
  const [spotResult, stakingResult, totalResult] = await Promise.allSettled([
    fetchGateSpotAccounts(account),
    fetchGateStakingAssets(account),
    fetchGateTotalBalance(account),
  ])
  const warnings: string[] = []
  const firstFailure = [spotResult, stakingResult, totalResult].find(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )

  if (spotResult.status === 'rejected' && stakingResult.status === 'rejected' && totalResult.status === 'rejected') {
    throw firstFailure?.reason ?? totalResult.reason
  }

  const detailedEntries = mergeExchangeEntries([
    ...(spotResult.status === 'fulfilled' ? spotResult.value : []),
    ...(stakingResult.status === 'fulfilled' ? stakingResult.value : []),
  ])
  if (spotResult.status === 'rejected') {
    warnings.push(`Gate 现货账户查询失败：${normalizeCexError(account, spotResult.reason)}`)
  }
  if (stakingResult.status === 'rejected') {
    warnings.push(`Gate 链上赚币查询失败：${normalizeCexError(account, stakingResult.reason)}`)
  }

  const pricedEntries = await priceExchangeEntries(detailedEntries)
  const fallbackEntries: ExchangeAssetEntry[] = []
  const detailedValue = pricedEntries.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

  if (totalResult.status === 'fulfilled') {
    const officialTotal = toPositiveNumber(totalResult.value.total?.amount)
    const tolerance = Math.max(1, officialTotal * 0.02)
    const gap = officialTotal - detailedValue

    if (gap > tolerance) {
      fallbackEntries.push({
        symbol: 'Gate未展开资产',
        name: 'Gate 未展开资产',
        balance: gap,
        assetId: 'cex:gate:account-gap',
        sourceKey: 'account-gap',
        sourceLabel: '账户总额补齐',
        reconciliationGroup: 'overview',
        priceOverride: 1,
      })

      warnings.push(
        spotResult.status === 'fulfilled'
          ? `Gate 总额中仍有 ${formatCurrency(gap)} 未能展开到币种明细，已按账户总额补齐。`
          : `Gate 现货明细未能取回，已按账户总额保留 ${formatCurrency(gap)}。`
      )
    }
  } else if (pricedEntries.length > 0) {
    warnings.push(`Gate 账户总额查询失败：${normalizeCexError(account, totalResult.reason)}`)
  } else {
    throw totalResult.reason
  }

  const assets = buildExchangeAssets(
    account,
    pricedEntries.concat(await priceExchangeEntries(fallbackEntries))
  )

  return {
    assets,
    warning: dedupeWarnings(warnings).join('；') || undefined,
  }
}

export async function getCexSnapshot(account: CexAccountInput): Promise<PortfolioSnapshot> {
  try {
    assertCexCredentials(account)

    if (account.exchange === 'binance') {
      const { assets, warning } = await fetchBinanceSnapshot(account)
      return buildSnapshot(account, assets, { warning })
    }

    if (account.exchange === 'bitget') {
      const { assets, warning } = await fetchBitgetSnapshot(account)
      return buildSnapshot(account, assets, { warning })
    }

    if (account.exchange === 'gate') {
      const { assets, warning } = await fetchGateSnapshot(account)
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
    return buildSnapshot(account, [], { error: normalizeCexError(account, error) })
  }
}
