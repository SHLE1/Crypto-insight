# Crypto Insight

个人加密资产面板。当前支持：

- 链上钱包地址查询
- `Binance` 只读 API 查询
- `OKX` 只读 API 查询
- 本地保存配置与快照

## 开发

使用 `pnpm`：

```bash
pnpm install
pnpm dev
```

可选环境变量：

```bash
COINGECKO_DEMO_API_KEY=your_demo_key
```

常用命令：

```bash
pnpm lint
pnpm build
```

## 使用说明

- API 和钱包配置说明见 `docs/api-setup.md`

## 当前范围

- `Ethereum` 钱包当前查询原生 `ETH`
- `Solana` 钱包当前查询原生 `SOL` 与 `SPL Token`
- `Bitcoin` 当前按地址余额查询
- 导出文件不包含交易所密钥

## 数据来源说明

- 行情缺失时会使用 `CoinGecko Demo API` 补充价格数据
- 页面内已加入 `CoinGecko` 署名，符合其 Attribution Guide 要求

## 备注

- 这个仓库使用 `pnpm`
- `pnpm dev` 当前固定走 `webpack`，不要随手切回 `Turbopack`
