import type { AssetBalance, CexAccountInput, PortfolioSnapshot } from '@/types'
import { getPrices } from '@/lib/market'

interface BinanceUserAssetResponseItem {
  asset: string
  free?: string
  locked?: string
  freeze?: string
  withdrawing?: string
  ipoable?: string
}

interface BinanceWalletBalanceResponseItem {
  activate?: boolean
  balance?: string
  walletName?: string
}

interface BinanceApiErrorResponse {
  code?: number
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

function normalizeCexError(exchange: CexAccountInput['exchange'], message: string) {
  if (
    exchange === 'binance' &&
    message.includes('Service unavailable from a restricted location')
  ) {
    return 'Binance 拒绝了当前服务器所在地区的访问。线上部署需要切到 Binance 允许的地区，或改用 OKX。'
  }

  return message
}

function toPositiveNumber(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatUsdValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function mergeBalances(items: Array<{ symbol: string; balance: number }>) {
  const merged = new Map<string, number>()

  items.forEach((item) => {
    merged.set(item.symbol, (merged.get(item.symbol) ?? 0) + item.balance)
  })

  return Array.from(merged.entries())
    .map(([symbol, balance]) => ({ symbol, balance }))
    .filter((asset) => asset.balance > 0)
}

function getBinancePricingSymbol(symbol: string) {
  return symbol.startsWith('LD') && symbol.length > 2 ? symbol.slice(2) : symbol
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
  options?: { error?: string; warning?: string }
): PortfolioSnapshot {
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0)
  const hasNonLivePrice = assets.some((asset) => asset.priceStatus && asset.priceStatus !== 'live')
  const status = options?.error ? 'error' : hasNonLivePrice || options?.warning ? 'partial' : 'success'

  return {
    source: account.id,
    sourceType: 'cex',
    assets,
    totalValue,
    updatedAt: new Date().toISOString(),
    status,
    error: options?.error ?? options?.warning,
  }
}

async function fetchBinanceUserAssets(account: CexAccountInput) {
  const params = new URLSearchParams({
    recvWindow: '5000',
    timestamp: Date.now().toString(),
  })

  const signature = await signHmac(account.apiSecret, params.toString(), 'hex')
  const response = await fetch(
    `https://api.binance.com/sapi/v3/asset/getUserAsset?${params.toString()}&signature=${signature}`,
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'X-MBX-APIKEY': account.apiKey,
      },
    }
  )

  const data = (await response.json()) as BinanceUserAssetResponseItem[] | BinanceApiErrorResponse

  if (!response.ok || !Array.isArray(data)) {
    throw new Error(('msg' in data && data.msg) || 'Binance 资产查询失败')
  }

  return data
    .map((balance) => ({
      symbol: balance.asset,
      balance:
        toPositiveNumber(balance.free) +
        toPositiveNumber(balance.locked) +
        toPositiveNumber(balance.freeze) +
        toPositiveNumber(balance.withdrawing) +
        toPositiveNumber(balance.ipoable),
    }))
    .filter((asset) => asset.balance > 0)
}

async function fetchBinanceWalletBalances(account: CexAccountInput) {
  const params = new URLSearchParams({
    quoteAsset: 'USDT',
    recvWindow: '5000',
    timestamp: Date.now().toString(),
  })

  const signature = await signHmac(account.apiSecret, params.toString(), 'hex')
  const response = await fetch(`https://api.binance.com/sapi/v1/asset/wallet/balance?${params.toString()}&signature=${signature}`, {
    cache: 'no-store',
    headers: {
      'X-MBX-APIKEY': account.apiKey,
    },
  })

  const data = (await response.json()) as BinanceWalletBalanceResponseItem[] | BinanceApiErrorResponse

  if (!response.ok || !Array.isArray(data)) {
    throw new Error(('msg' in data && data.msg) || 'Binance 钱包总额查询失败')
  }

  return data
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
        ? mergeBalances(await fetchBinanceUserAssets(account))
        : await fetchOkxBalances(account)

    const pricingSymbolMap = new Map(
      rawAssets.map((asset) => [
        asset.symbol,
        account.exchange === 'binance' ? getBinancePricingSymbol(asset.symbol) : asset.symbol,
      ])
    )
    const prices = await getPrices(Array.from(new Set(pricingSymbolMap.values())))
    const assets: AssetBalance[] = rawAssets.map((asset) => {
      const pricingSymbol = pricingSymbolMap.get(asset.symbol) ?? asset.symbol
      const priceInfo = prices[pricingSymbol]
      const price = priceInfo?.price ?? null

      return {
        assetId: `cex:${asset.symbol.toUpperCase()}`,
        symbol: asset.symbol,
        name: asset.symbol,
        balance: asset.balance,
        price,
        value: price !== null ? asset.balance * price : null,
        change24h: priceInfo?.change24h ?? null,
        priceStatus: priceInfo?.status ?? 'missing',
      }
    })

    if (account.exchange === 'binance') {
      const walletBalances = await fetchBinanceWalletBalances(account)
      const walletTotal = walletBalances.reduce((sum, wallet) => {
        if (!wallet.activate) return sum
        return sum + toPositiveNumber(wallet.balance)
      }, 0)
      const pricedTotal = assets.reduce((sum, asset) => sum + (asset.value ?? 0), 0)
      const reconciliationGap = walletTotal - pricedTotal
      const tolerance = Math.max(1, walletTotal * 0.02)

      if (reconciliationGap > tolerance) {
        assets.push({
          symbol: '未展开账户资产',
          name: 'Binance 未展开账户资产',
          balance: reconciliationGap,
          price: 1,
          value: reconciliationGap,
          change24h: null,
        })

        return buildSnapshot(account, assets, {
          warning: `Binance 官方汇总总额比可拆分资产高 ${formatUsdValue(reconciliationGap)}，差额已计入“未展开账户资产”。这通常来自 Earn、Futures、Margin 或暂时缺少公开报价的资产。`,
        })
      }
    }

    return buildSnapshot(account, assets)
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询失败'
    return buildSnapshot(account, [], { error: normalizeCexError(account.exchange, message) })
  }
}
