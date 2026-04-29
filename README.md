# Crypto Insight

个人加密资产面板。当前支持：

- 链上钱包地址查询
- `Binance` 只读 API 查询
- `OKX` 只读 API 查询
- `Bitget` 只读 API 查询
- `Gate` 只读 API 查询
- 本地保存配置与最近资产快照

## 开发

使用 `pnpm`：

```bash
pnpm install
pnpm dev
```

可选环境变量：

```bash
COINGECKO_DEMO_API_KEY=your_demo_key
SOLANA_RPC_URL=https://your-solana-rpc.example
ZERION_API_KEY=your_zerion_key
ZAPPER_API_KEY=your_zapper_key # 可选，作为 Solana 与 DeFi 回退源
MORALIS_API_KEY=your_moralis_key # 可选，作为 EVM DeFi 二级回退源
```

常用命令：

```bash
pnpm lint
pnpm build
```

## 使用说明

- API 和钱包配置说明见 `docs/api-setup.md`

## 交易所 API 获取入口

| 交易所 | 官方入口 |
| --- | --- |
| `Binance` | [API Management](https://www.binance.com/en/my/settings/api-management) |
| `OKX` | [My API](https://www.okx.com/account/my-api) |
| `Bitget` | [Bitget API](https://www.bitget.com/bitget-api) |
| `Gate` | [APIv4 Keys](https://www.gate.com/myaccount/apiv4keys) |

## 当前范围

- `EVM` 钱包支持多链原生币与 ERC-20 余额查询
- `Solana` 钱包当前查询原生 `SOL` 与 `SPL Token`
- `Bitcoin` 当前按地址余额查询
- `DeFi` 统计支持 `EVM` 与 `Solana` 钱包，默认低频刷新
- `DeFi` 统计当前会直接并入顶部总资产与总览分布，可能与钱包余额重复计算
- 导出文件不包含交易所密钥
- 导出文件不包含资产快照与历史看板数据

## 数据来源说明

- 主流行情优先使用 `Binance`，不足时再回退到 `CoinGecko`
- `DeFi` 当前在 `EVM` 上优先使用 `Zerion`，异常时回退到 `Zapper` 与 `Moralis`；`Solana` 继续使用 `Zapper`
- 页面内已加入 `CoinGecko` 署名，符合其 Attribution Guide 要求

## 备注

- 这个仓库使用 `pnpm`
- `pnpm dev` 当前固定走 `webpack`，不要随手切回 `Turbopack`
