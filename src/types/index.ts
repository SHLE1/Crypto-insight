// ===== 基础类型 =====

export type ChainType = 'evm' | 'solana' | 'btc'
export type ExchangeType = 'binance' | 'okx'

// ===== 数据模型 =====

export interface WalletInput {
  id: string
  name: string
  chainType: ChainType
  address: string
  enabled: boolean
  evmChains?: string[] // selected EVM chain keys, e.g. ['eth','arb','base']
}

export interface CexAccountInput {
  id: string
  exchange: ExchangeType
  label: string
  apiKey: string
  apiSecret: string
  passphrase?: string
  enabled: boolean
}

export interface Settings {
  quoteCurrency: string
  refreshInterval: number // seconds
  theme: 'dark' | 'light'
  defiEnabled: boolean
  hideSmallAssets: boolean
}

// ===== 资产与报价 =====

export type PriceStatus = 'live' | 'stale' | 'missing'

/** 单个来源的资产明细 */
export interface AssetSourceDetail {
  sourceId: string       // wallet/account id
  sourceType: 'wallet' | 'cex'
  sourceLabel: string    // wallet name or exchange label
  assetId?: string
  balance: number
  chainKey?: string      // for EVM wallets, which chain
}

export interface AssetBalance {
  assetId?: string
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number | null
  change24h: number | null
  priceStatus?: PriceStatus
  chainKey?: string
  contractAddress?: string
  _chainBreakdowns?: { chainKey: string; balance: number }[]  // internal, used by dashboard to build sources
  sources?: AssetSourceDetail[]  // per-source breakdown (optional, for UI expansion)
}

export interface PortfolioSnapshot {
  source: string
  sourceType: 'wallet' | 'cex'
  assets: AssetBalance[]
  totalValue: number
  updatedAt: string
  status: 'success' | 'partial' | 'error'
  error?: string
}

export interface HoldingSourceDetail {
  sourceId: string
  sourceType: 'wallet' | 'cex'
  sourceLabel: string
  assetId?: string
  balance: number
  chainLabel?: string
}

export interface HoldingRow {
  assetId: string
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number
  change24h: number | null
  priceStatus: PriceStatus
  sourceCount: number
  sources?: HoldingSourceDetail[]
}

export interface QuoteResponse {
  results: PortfolioSnapshot[]
  status: 'success' | 'partial' | 'error'
  updatedAt: string
}

export interface PriceData {
  symbol: string
  price: number | null
  change24h: number | null
  status: PriceStatus
}

export interface PriceResponse {
  prices: PriceData[]
  status: 'success' | 'partial' | 'error'
  updatedAt: string
}

export interface ApiErrorState {
  source: string
  title?: string
  sourceLabel?: string
  kind?: 'error' | 'warning'
  message: string
  detail?: string
  impact?: string
  timestamp: string
}

// ===== 缓存 =====

export interface PortfolioHistoryPoint {
  timestamp: string
  totalValue: number
  walletTotal: number
  cexTotal: number
  sourceCount: number
}

export interface PortfolioCache {
  snapshots: Record<string, PortfolioSnapshot> // keyed by wallet/cex id
  lastRefresh: string | null
  errors: ApiErrorState[]
  history: PortfolioHistoryPoint[]
}
