import { DEFAULT_EVM_CHAINS } from '@/lib/evm-chains'

const MOBULA_CHAIN_MAP: Record<string, string> = {
  eth: 'ethereum',
  bsc: 'bsc',
  arb: 'arbitrum',
  polygon: 'polygon',
  base: 'base',
  avax: 'avalanche',
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

export function getMobulaChains(chainType: 'evm' | 'solana' | 'btc', evmChains?: string[]) {
  if (chainType === 'solana') {
    return ['solana']
  }

  if (chainType === 'btc') {
    return []
  }

  const selectedChains = evmChains?.length ? evmChains : DEFAULT_EVM_CHAINS
  const supported = Array.from(
    new Set(
      selectedChains
        .map((chainKey) => MOBULA_CHAIN_MAP[chainKey])
        .filter((chainId): chainId is string => Boolean(chainId))
    )
  )

  return supported
}

export function formatDefiChainLabel(chainKey: string) {
  return DEFI_CHAIN_LABELS[chainKey] ?? chainKey
}
