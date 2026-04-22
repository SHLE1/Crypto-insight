import type { ChainType, ExchangeType } from '@/types'

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const BTC_ADDRESS_REGEX = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{25,90})$/

export function validateAddress(address: string, chainType: ChainType): boolean {
  switch (chainType) {
    case 'evm':
      return EVM_ADDRESS_REGEX.test(address)
    case 'solana':
      return SOLANA_ADDRESS_REGEX.test(address)
    case 'btc':
      return BTC_ADDRESS_REGEX.test(address)
    default:
      return false
  }
}

export function getChainLabel(chainType: ChainType): string {
  const labels: Record<ChainType, string> = {
    evm: 'Ethereum (ETH)',
    solana: 'Solana',
    btc: 'Bitcoin',
  }
  return labels[chainType]
}

export function getExchangeLabel(exchange: ExchangeType | string): string {
  const labels: Record<ExchangeType, string> = {
    binance: 'Binance',
    okx: 'OKX',
    bitget: 'Bitget',
    gate: 'Gate',
  }
  return exchange in labels ? labels[exchange as ExchangeType] : exchange
}

export function exchangeRequiresPassphrase(exchange: ExchangeType): boolean {
  return exchange === 'okx' || exchange === 'bitget'
}

export function getExchangeApiSetupUrl(exchange: ExchangeType): string {
  const urls: Record<ExchangeType, string> = {
    binance: 'https://www.binance.com/en/my/settings/api-management',
    okx: 'https://www.okx.com/account/my-api',
    bitget: 'https://www.bitget.com/bitget-api',
    gate: 'https://www.gate.com/myaccount/apiv4keys',
  }

  return urls[exchange]
}

export function formatCurrency(value: number | null, currency = 'USD'): string {
  if (value === null) return '待补充'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number | null): string {
  if (value === null) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
