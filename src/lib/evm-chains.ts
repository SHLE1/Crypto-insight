// EVM 多链配置 — multicall3 地址 + 热门 ERC-20 代币列表

export interface EvmChainConfig {
  chainId: number
  name: string
  symbol: string // native token symbol
  rpcUrl: string
  multicall3: string
  logBlockRange: number // blocks to scan for Transfer events (higher = more tokens, slower)
  tokens: Array<{ address: string; symbol: string; decimals: number }>
}

export const EVM_CHAINS: Record<string, EvmChainConfig> = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 50000, // ~4.2 days at 12s/block
    tokens: [
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18 },
      { address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', symbol: 'wstETH', decimals: 18 },
      { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', symbol: 'stETH', decimals: 18 },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', decimals: 18 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', decimals: 18 },
      { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', decimals: 18 },
    ],
  },
  bsc: {
    chainId: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 100000, // ~3.5 days at 3s/block
    tokens: [
      { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
      { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
      { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', decimals: 18 },
      { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
      { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', decimals: 18 },
      { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ea7dAEd3eB5', symbol: 'BTCB', decimals: 18 },
      { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', symbol: 'XRP', decimals: 18 },
    ],
  },
  arb: {
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 200000, // ~4.6 days at ~0.25s/block
    tokens: [
      { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
      { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
      { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18 },
      { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', decimals: 8 },
      { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', decimals: 18 },
      { address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', symbol: 'GMX', decimals: 18 },
    ],
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    symbol: 'POL',
    rpcUrl: 'https://polygon-rpc.com',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 200000, // ~4.6 days at ~2s/block
    tokens: [
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6 },
      { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6 },
      { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', decimals: 18 },
      { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', decimals: 8 },
      { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', decimals: 18 },
    ],
  },
  base: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 200000, // ~4.6 days at ~2s/block
    tokens: [
      { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', decimals: 6 },
      { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
      { address: '0x4ed4E862860bed51a9570b96d89aF5E1B0Efefed', symbol: 'DEGEN', decimals: 18 },
      { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18 },
    ],
  },
  avax: {
    chainId: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    logBlockRange: 200000, // ~4.6 days at ~2s/block
    tokens: [
      { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', symbol: 'USDT', decimals: 6 },
      { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', decimals: 6 },
      { address: '0x5947BB275c521040051D82396192181b413227A3', symbol: 'WETH.e', decimals: 18 },
    ],
  },
}

/** 链选择器选项 */
export const EVM_CHAIN_OPTIONS = Object.entries(EVM_CHAINS).map(([key, cfg]) => ({
  key,
  name: cfg.name,
  symbol: cfg.symbol,
}))

/** 默认启用的 EVM 链 — 包含所有已配置的链 */
export const DEFAULT_EVM_CHAINS: string[] = Object.keys(EVM_CHAINS)
