// ===== 基础类型 =====

export type ChainType = 'evm' | 'solana' | 'btc'
export type ExchangeType = 'binance' | 'okx' | 'bitget' | 'gate'

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

/** Minimal wallet info required to fetch a quote (subset of WalletInput) */
export interface WalletQuoteInput {
  id: string
  chainType: ChainType
  address: string
  evmChains?: string[]
}

export interface ManualDefiSource {
  id: string
  chainKey: string
  contractAddress: string
  label?: string
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
export type DefiProvider = 'zerion' | 'zapper' | 'moralis' | 'debank' | 'bitway' | 'manual'
export type DefiStatus = 'success' | 'partial' | 'error'
export type DefiPositionType =
  | 'lending'
  | 'liquidity'
  | 'stake'
  | 'restaking'
  | 'reward'
  | 'perp'
  | 'unknown'

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

export interface PortfolioInsightAsset {
  symbol: string
  value: number
  share: number
  change24h: number | null
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

export interface DefiTokenBalance {
  address?: string
  symbol: string
  name: string
  amount: number
  price: number | null
  value: number | null
}

export type DefiPositionMetadata =
  | {
      provider: 'zerion'
      positionType?: string
      protocolModule?: string
      groupId?: string
      poolAddress?: string
      dappId?: string
    }
  | {
      provider: 'zapper'
      kind: 'contract-position' | 'app-token-position'
      appId?: string
      groupId?: string
      groupLabel?: string
    }
  | {
      provider: 'moralis'
      protocolLogo?: string
      positionAddress?: string
      positionDetails?: {
        is_debt?: boolean
        is_variable_debt?: boolean
        is_stable_debt?: boolean
      }
    }
  | {
      provider: 'debank'
      synthetic?: boolean
    }
  | {
      provider: 'bitway'
      vaultAddress: string
      tokenAddress: string
      lpTokenAddress: string
    }
  | {
      provider: 'manual'
      contractAddress: string
      priceStatus: PriceStatus
    }

export interface DefiPosition {
  id: string
  walletId: string
  chainKey: string
  protocolId: string
  protocolName: string
  protocolUrl?: string
  protocolCategory?: string
  type: DefiPositionType
  name: string
  value: number
  tokens: DefiTokenBalance[]
  rewards: DefiTokenBalance[]
  metadata?: DefiPositionMetadata
}

export interface DefiProtocolSummary {
  walletId: string
  chainKey: string
  protocolId: string
  protocolName: string
  protocolCategory?: string
  totalValue: number
  positionCount: number
}

export interface DefiSnapshot {
  source: string // walletId:chainKey
  walletId: string
  chainKey: string
  provider: DefiProvider
  positions: DefiPosition[]
  protocols: DefiProtocolSummary[]
  totalValue: number
  totalDepositedValue: number
  totalBorrowedValue: number
  totalRewardsValue: number
  updatedAt: string
  status: DefiStatus
  error?: string
}

export interface DefiQuoteResponse {
  results: DefiSnapshot[]
  status: DefiStatus
  updatedAt: string
  provider: DefiProvider
}

// ===== 缓存 =====

export interface PortfolioHistoryPoint {
  timestamp: string
  totalValue: number
  walletTotal: number
  cexTotal: number
  sourceCount: number
}

export interface PortfolioAnalytics {
  assetCount: number
  pricedAssetCount: number
  stalePriceCount: number
  missingPriceCount: number
  topHolding: PortfolioInsightAsset | null
  topThreeShare: number
  bestPerformer: PortfolioInsightAsset | null
  worstPerformer: PortfolioInsightAsset | null
  averagePositionValue: number
  walletShare: number
  cexShare: number
  historyHigh: number | null
  historyLow: number | null
  historyPoints: number
  activeSourceCount: number
}

export interface PortfolioCache {
  snapshots: Record<string, PortfolioSnapshot> // keyed by wallet/cex id
  lastRefresh: string | null
  errors: ApiErrorState[]
  history: PortfolioHistoryPoint[]
}

export interface DefiHistoryPoint {
  timestamp: string
  totalValue: number
  depositedValue: number
  borrowedValue: number
  rewardsValue: number
  sourceCount: number
}

export interface DefiCache {
  snapshots: Record<string, DefiSnapshot> // keyed by walletId:chainKey
  manualSources: ManualDefiSource[]
  lastRefresh: string | null
  errors: ApiErrorState[]
  history: DefiHistoryPoint[]
}
