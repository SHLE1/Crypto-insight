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

export interface AssetBalance {
  symbol: string
  name: string
  balance: number
  price: number | null
  value: number | null
  change24h: number | null
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

export interface QuoteResponse {
  results: PortfolioSnapshot[]
  status: 'success' | 'partial' | 'error'
  updatedAt: string
}

export interface PriceData {
  symbol: string
  price: number | null
  change24h: number | null
}

export interface PriceResponse {
  prices: PriceData[]
  status: 'success' | 'partial' | 'error'
  updatedAt: string
}

export interface ApiErrorState {
  source: string
  message: string
  timestamp: string
}

// ===== 缓存 =====

export interface PortfolioCache {
  snapshots: Record<string, PortfolioSnapshot> // keyed by wallet/cex id
  lastRefresh: string | null
  errors: ApiErrorState[]
}
