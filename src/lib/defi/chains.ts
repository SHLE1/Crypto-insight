import { DEFAULT_EVM_CHAINS } from '@/lib/evm-chains'

const DEFI_EVM_CHAIN_MAP: Record<string, string> = {
  eth: 'ethereum',
  bsc: 'bsc',
  arb: 'arbitrum',
  polygon: 'polygon',
  base: 'base',
  avax: 'avalanche',
}

const DEFI_TO_EVM_CHAIN_KEY_MAP: Record<string, string> = {
  ethereum: 'eth',
  bsc: 'bsc',
  arbitrum: 'arb',
  polygon: 'polygon',
  base: 'base',
  avalanche: 'avax',
}

const ZAPPER_CHAIN_ID_MAP: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  arbitrum: 42161,
  polygon: 137,
  base: 8453,
  avalanche: 43114,
  solana: 1151111081,
}

const MORALIS_CHAIN_MAP: Record<string, string> = {
  ethereum: 'eth',
  bsc: 'bsc',
  arbitrum: 'arbitrum',
  polygon: 'polygon',
  base: 'base',
  avalanche: 'avalanche',
}

const DEFI_CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  bsc: 'BNB Chain',
  arbitrum: 'Arbitrum',
  polygon: 'Polygon',
  base: 'Base',
  avalanche: 'Avalanche',
  solana: 'Solana',
  eth: 'Ethereum',
  bnb: 'BNB Chain',
  arb: 'Arbitrum',
  avax: 'Avalanche',
}

const DEBANK_CHAIN_MAP: Record<string, string> = {
  ethereum: 'eth',
  bsc: 'bsc',
  arbitrum: 'arb',
  polygon: 'matic',
  base: 'base',
  avalanche: 'avax',
}

export function getDefiChains(chainType: 'evm' | 'solana' | 'btc', evmChains?: string[]) {
  if (chainType === 'solana') {
    return ['solana']
  }

  if (chainType === 'btc') {
    return []
  }

  const selectedChains = evmChains?.length ? evmChains : DEFAULT_EVM_CHAINS
  return Array.from(
    new Set(
      selectedChains
        .map((chainKey) => DEFI_EVM_CHAIN_MAP[chainKey])
        .filter((chainId): chainId is string => Boolean(chainId))
    )
  )
}

export function getDefiChainKeyFromEvmChainKey(chainKey: string) {
  return DEFI_EVM_CHAIN_MAP[chainKey] ?? chainKey
}

export function getEvmChainKeyForDefi(chainKey: string) {
  if (chainKey in DEFI_EVM_CHAIN_MAP) {
    return chainKey
  }

  return DEFI_TO_EVM_CHAIN_KEY_MAP[chainKey] ?? null
}

export function getZapperChainIds(chainKeys: string[]) {
  return Array.from(
    new Set(
      chainKeys
        .map((chainKey) => ZAPPER_CHAIN_ID_MAP[chainKey])
        .filter((chainId): chainId is number => Number.isFinite(chainId))
    )
  )
}

export function getDefiChainKeyFromZapperChainId(chainId: number) {
  const entry = Object.entries(ZAPPER_CHAIN_ID_MAP).find(([, mappedChainId]) => mappedChainId === chainId)
  return entry?.[0] ?? null
}

export function getMoralisChainId(chainKey: string) {
  return MORALIS_CHAIN_MAP[chainKey] ?? null
}

export function formatDefiChainLabel(chainKey: string) {
  return DEFI_CHAIN_LABELS[chainKey] ?? chainKey
}

export function getDebankChainId(chainKey: string) {
  return DEBANK_CHAIN_MAP[chainKey] ?? null
}
