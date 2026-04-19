import type { DefiSnapshot, WalletInput } from '@/types'
import { getDefiSnapshots } from '@/lib/defi/providers'

/**
 * @deprecated 兼容旧导入路径。DeFi 主数据源已迁移到 Zapper，EVM 回退使用 Moralis。
 */
export async function getMobulaDefiSnapshots(
  wallet: Pick<WalletInput, 'id' | 'chainType' | 'address' | 'evmChains'>
): Promise<DefiSnapshot[]> {
  return getDefiSnapshots(wallet)
}
