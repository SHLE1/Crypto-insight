import { DEFAULT_EVM_CHAINS } from '@/lib/evm-chains'

const MOBULA_CHAIN_MAP: Record<string, string> = {
  eth: 'ethereum',
  bsc: 'bnb',
  arb: 'arbitrum',
  polygon: 'polygon',
  base: 'base',
  avax: 'avalanche',
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
