# Crypto Insight

个人加密资产面板。当前支持：

- 链上钱包地址查询
- `Binance` 只读 API 查询
- `OKX` 只读 API 查询
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
MOBULA_API_KEY=your_mobula_key
MOBULA_USE_DEMO_API=true # 仅本地调试时显式开启
```

常用命令：

```bash
pnpm lint
pnpm build
```

## 使用说明

- API 和钱包配置说明见 `docs/api-setup.md`

## 当前范围

- `EVM` 钱包支持多链原生币与 ERC-20 余额查询
- `Solana` 钱包当前查询原生 `SOL` 与 `SPL Token`
- `Bitcoin` 当前按地址余额查询
- `DeFi` 统计支持 `EVM` 与 `Solana` 钱包，默认低频刷新
- `DeFi` 统计暂不并入顶部总资产，避免与钱包余额重复计算
- 导出文件不包含交易所密钥
- 导出文件不包含资产快照与历史看板数据

## 数据来源说明

- 主流行情优先使用 `Binance`，不足时再回退到 `CoinGecko`
- `DeFi` 当前优先使用 `Mobula`，当主数据源未识别到仓位时，会尝试回退到 `DeBank` 公共页面做兜底
- 页面内已加入 `CoinGecko` 署名，符合其 Attribution Guide 要求

## 备注

- 这个仓库使用 `pnpm`
- `pnpm dev` 当前固定走 `webpack`，不要随手切回 `Turbopack`
