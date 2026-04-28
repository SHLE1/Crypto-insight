import { getEvmChainKeyForDefi } from '@/lib/defi/chains'
import { validateAddress } from '@/lib/validators'
import type { DefiPosition, DefiSnapshot, ManualDefiSource } from '@/types'

interface AutoPinnedSnapshotResult {
  sources: ManualDefiSource[]
  shouldUseLocalOnly: boolean
}

function isSupportedLocalChain(chainKey: string) {
  return Boolean(getEvmChainKeyForDefi(chainKey))
}

function getLocalPinToken(position: DefiPosition) {
  const provider = position.metadata?.provider
  if (provider !== 'zapper' && provider !== 'moralis') {
    return null
  }

  if (position.rewards.length > 0) {
    return null
  }

  if (position.type === 'liquidity' || position.type === 'lending' || position.type === 'perp' || position.type === 'reward') {
    return null
  }

  if (provider === 'moralis' && position.metadata?.provider === 'moralis' && position.metadata.positionDetails?.is_debt) {
    return null
  }

  const candidateTokens = position.tokens.filter(
    (token) => Boolean(token.address) && validateAddress(token.address ?? '', 'evm') && token.amount > 0
  )

  if (candidateTokens.length !== 1) {
    return null
  }

  return candidateTokens[0]
}

function buildAutoPinnedSource(snapshot: DefiSnapshot, position: DefiPosition): ManualDefiSource | null {
  const token = getLocalPinToken(position)
  if (!token?.address) {
    return null
  }

  const contractAddress = token.address.toLowerCase()
  const label = token.name || token.symbol || position.name || position.protocolName

  return {
    id: `${snapshot.chainKey}:${contractAddress}`,
    chainKey: snapshot.chainKey,
    contractAddress,
    label,
    enabled: true,
    origin: 'api',
  }
}

export function extractAutoPinnedSnapshotSources(snapshot: DefiSnapshot): AutoPinnedSnapshotResult {
  if (snapshot.status === 'error' || snapshot.positions.length === 0 || !isSupportedLocalChain(snapshot.chainKey)) {
    return { sources: [], shouldUseLocalOnly: false }
  }

  const sources = snapshot.positions
    .map((position) => buildAutoPinnedSource(snapshot, position))
    .filter((source): source is ManualDefiSource => Boolean(source))

  const uniqueSources = Array.from(new Map(sources.map((source) => [source.id, source])).values())
  const shouldUseLocalOnly = uniqueSources.length > 0 && uniqueSources.length === snapshot.positions.length

  return {
    sources: shouldUseLocalOnly ? uniqueSources : [],
    shouldUseLocalOnly,
  }
}
