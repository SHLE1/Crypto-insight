import type { AssetBalance, CexAccountInput, PortfolioSnapshot } from '@/types'
import { getPrices } from '@/lib/market'

interface BinanceAccountResponse {
  balances?: Array<{
    asset: string
    free: string
    locked: string
  }>
  msg?: string
}

interface OkxBalanceResponse {
  code: string
  msg: string
  data?: Array<{
    details?: Array<{
      ccy: string
      cashBal?: string
      availBal?: string
      eq?: string
    }>
  }>
}

function toPositiveNumber(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

async function signHmac(secret: string, payload: string, encoding: 'hex' | 'base64') {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const bytes = Array.from(new Uint8Array(signature))

  if (encoding === 'hex') {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return btoa(String.fromCharCode(...bytes))
}

function buildSnapshot(
  account: Pick<CexAccountInput, 'id'>,
  assets: AssetBalance[],
  error?: string
): PortfolioSnapshot {
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0)
  const hasMissingPrice = assets.some((asset) => asset.price === null)

  return {
    source: account.id,
    sourceType: 'cex',
    assets,
    totalValue,
    updatedAt: new Date().toISOString(),
    status: error ? 'error' : hasMissingPrice ? 'partial' : 'success',
    error,
  }
}

async function fetchBinanceBalances(account: CexAccountInput) {
  const params = new URLSearchParams({
    omitZeroBalances: 'true',
    recvWindow: '5000',
    timestamp: Date.now().toString(),
  })

  const signature = await signHmac(account.apiSecret, params.toString(), 'hex')
  const response = await fetch(`https://api.binance.com/api/v3/account?${params.toString()}&signature=${signature}`, {
    cache: 'no-store',
    headers: {
      'X-MBX-APIKEY': account.apiKey,
    },
  })

  const data = (await response.json()) as BinanceAccountResponse & { code?: number }

  if (!response.ok) {
    throw new Error(data.msg || 'Binance 账户查询失败')
  }

  return (data.balances ?? [])
    .map((balance) => ({
      symbol: balance.asset,
      balance: toPositiveNumber(balance.free) + toPositiveNumber(balance.locked),
    }))
    .filter((asset) => asset.balance > 0)
}

async function fetchOkxBalances(account: CexAccountInput) {
  const requestPath = '/api/v5/account/balance'
  const timestamp = new Date().toISOString()
  const payload = `${timestamp}GET${requestPath}`
  const signature = await signHmac(account.apiSecret, payload, 'base64')

  const response = await fetch(`https://www.okx.com${requestPath}`, {
    cache: 'no-store',
    headers: {
      'OK-ACCESS-KEY': account.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': account.passphrase ?? '',
    },
  })

  const data = (await response.json()) as OkxBalanceResponse

  if (!response.ok || data.code !== '0') {
    throw new Error(data.msg || 'OKX 账户查询失败')
  }

  return (data.data?.[0]?.details ?? [])
    .map((detail) => ({
      symbol: detail.ccy,
      balance: toPositiveNumber(detail.cashBal) || toPositiveNumber(detail.availBal) || toPositiveNumber(detail.eq),
    }))
    .filter((asset) => asset.balance > 0)
}

export async function getCexSnapshot(account: CexAccountInput): Promise<PortfolioSnapshot> {
  try {
    const rawAssets =
      account.exchange === 'binance'
        ? await fetchBinanceBalances(account)
        : await fetchOkxBalances(account)

    const prices = await getPrices(rawAssets.map((asset) => asset.symbol))
    const assets: AssetBalance[] = rawAssets.map((asset) => {
      const priceInfo = prices[asset.symbol]
      const price = priceInfo?.price ?? null

      return {
        symbol: asset.symbol,
        name: asset.symbol,
        balance: asset.balance,
        price,
        value: price !== null ? asset.balance * price : null,
        change24h: priceInfo?.change24h ?? null,
      }
    })

    return buildSnapshot(account, assets)
  } catch (error) {
    return buildSnapshot(account, [], error instanceof Error ? error.message : '查询失败')
  }
}
