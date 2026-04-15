# Crypto Insight V1 计划

## Summary

目标是做一个“个人加密资产面板”第一版，重点是可用，不是展示稿。第一版同时覆盖链上地址与 CEX 资产，默认本地保存，预留云同步入口，不做真实 DeFi 仓位实现。

产品定位与默认选择已锁定：

- 形态：个人资产面板
- 范围：可用版
- 链支持：EVM + Solana + BTC
- CEX：先做 API 只读接入
- 计价：默认 USD
- Key 模式：用户自行填写并仅保存在本地
- DeFi：预留入口，第二版再接真实数据

建议技术栈固定为：

- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand 管理本地资产与设置
- TanStack Query 管理查询、刷新、重试
- Recharts 做图表
- localStorage 做本地持久化

## Key Changes

### 1. 产品结构与页面

第一版页面固定为 5 个区域：

- `/` 总览页  
显示总资产、24h 变化、资产分类占比、链上与 CEX 分布、最近刷新时间、异常提示。
- `/wallets` 钱包列表页  
显示已添加的钱包地址、链类型、估值、状态、最近更新时间。
- `/wallets/add` 添加钱包页  
支持添加 EVM 地址、Solana 地址、BTC 地址；录入时先做格式校验，再保存。
- `/cex` 交易所账户页  
显示已绑定的交易所账户、估值、同步状态、最近同步时间。
- `/settings` 设置页  
管理第三方 API Key、默认货币、刷新频率、导出入口、未来云同步开关占位。

界面风格按“干净、专业、深色优先、强调数字”的方向统一，不做营销型首页，不做大段介绍页。首页直接进入工作面板。

### 2. 数据模型与本地保存

前端本地状态拆成 4 类：

- `wallets`  
字段：`id`、`name`、`chainType`、`address`、`enabled`
- `cexAccounts`  
字段：`id`、`exchange`、`label`、`apiKey`、`apiSecret`、`passphrase?`、`enabled`
- `settings`  
字段：`quoteCurrency='USD'`、`refreshInterval`、`theme`、`defiEnabled=false`
- `portfolioCache`  
字段：每个钱包和交易所的最近查询结果、时间戳、错误信息

保存规则固定为：

- 用户输入的数据与 Key 只保存在浏览器本地
- 不在服务端数据库落任何用户资产信息
- 页面首次加载先读本地，再触发刷新
- 云同步只留设置入口与接口占位，不接真实账号系统

### 3. 数据获取与接口

服务端只做“代理查询与汇总”，不做账号持久化。第一版接口固定为：

- `POST /api/prices`  
输入：资产符号列表  
输出：USD 价格、24h 涨跌
- `POST /api/wallets/quote`  
输入：钱包数组，包含链类型与地址  
输出：各钱包资产列表、估值、错误信息
- `POST /api/cex/quote`  
输入：交易所账户数组与本地提供的只读凭证  
输出：各交易所余额、估值、错误信息
- `GET /api/health`  
输出：可用状态，用于部署后检查

实现规则固定为：

- EVM：查询原生资产与常见 token 余额
- Solana：查询 SOL 与 SPL token
- BTC：查询原生 BTC 余额
- CEX：第一版只接 Binance 与 OKX
- 价格统一按 symbol 映射到 USD
- 所有接口都返回部分成功结果，不因单个来源失败而整体报错
- 所有查询都有超时、重试、错误说明与最近成功缓存回退

### 4. 首页信息架构

首页必须固定包含这些模块：

- 总资产数字区  
显示总资产、24h 变化额、24h 变化比例
- 资产分布图  
按币种或资产类别聚合
- 来源分布图  
链上 vs CEX
- 钱包列表摘要  
最多显示前 5 个钱包
- 交易所摘要  
最多显示前 5 个账户
- 风险与异常提示  
显示地址无效、接口失败、Key 无效、价格缺失
- DeFi 占位卡  
只显示“即将支持”，不接真实逻辑

首页行为固定为：

- 打开后自动刷新一次
- 手动刷新时全局更新
- 手机端改为单列
- 空状态优先引导添加钱包和连接交易所

### 5. 第二阶段预留但不在第一版交付

这些能力只留结构，不做真实功能：

- DeFi 仓位查询
- Supabase 云同步
- 多币种切换
- CSV 导出高级筛选
- 更多交易所接入
- 历史净值曲线

## Public Interfaces / Types

需要明确的前端类型：

- `ChainType = 'evm' | 'solana' | 'btc'`
- `ExchangeType = 'binance' | 'okx'`
- `WalletInput`
- `CexAccountInput`
- `AssetBalance`
- `PortfolioSnapshot`
- `QuoteResponse`
- `ApiErrorState`

需要明确的接口输出约束：

- 所有列表型结果都带 `status: 'success' | 'partial' | 'error'`
- 所有数据源都带 `updatedAt`
- 所有失败项都带 `source` 与 `message`
- 价格缺失时返回 `price=null`，页面显示为“待补充”，不伪造为 0

## Test Plan

必须覆盖这些场景：

- 新用户首次打开，无数据时能正常显示引导与空状态
- 添加 EVM、Solana、BTC 地址时，合法地址能保存，非法地址被拦截
- 添加 Binance、OKX 只读账户后，能拉取并显示资产
- 单个钱包查询失败时，其余钱包和交易所数据仍能显示
- 价格服务失败时，页面保留最近一次成功数据并提示不是最新
- 首页总资产、分类占比、来源分布三处数字保持一致
- 手机端首页、钱包页、设置页可正常查看和操作
- 刷新、重试、删除账户、关闭账户都能立即反映到首页
- 本地刷新浏览器后，资产配置与 Key 仍存在
- `GET /api/health` 在本地与部署后都能返回正常状态

验收标准固定为：

- 用户可在 5 分钟内完成首次添加并看到真实总资产
- 首页核心信息在桌面与手机都能一屏读懂
- 任一数据源失败不会导致整页不可用
- 用户不需要注册登录即可完整使用第一版核心能力

## Assumptions

- 仓库当前为空，可直接按新项目搭建
- 默认界面语言为中文
- 默认主题为深色，并提供浅色切换
- 不代管用户敏感信息，所有 key 默认只存在本地
- 第一版不承诺全量 token 识别，先保证主流资产和核心流程稳定
- 如果第三方额度受限，优先保证总览与主要资产，不强求长尾资产完整展示
- 计划文件目标路径定为 `plan/crypto-insight-v1-plan.md`
