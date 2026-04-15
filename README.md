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

常用命令：

```bash
pnpm lint
pnpm build
```

## 使用说明

- API 和钱包配置说明见 `docs/api-setup.md`

## 当前范围

- `Ethereum` 钱包当前查询原生 `ETH`
- `Solana` 钱包当前查询原生 `SOL`
- `Bitcoin` 当前按地址余额查询
- 导出文件不包含交易所密钥

## 备注

- 这个仓库使用 `pnpm`
- `pnpm dev` 当前固定走 `webpack`，不要随手切回 `Turbopack`
