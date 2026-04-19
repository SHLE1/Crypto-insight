[Skip to main content](https://docs.moralis.com/data-api/supported-chains#content-area)

[Moralis home page![light logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/light.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=66e6da0d81943c4679e0ba921850201d)![dark logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/dark.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=39f72ccb7cd088ee041f49d8b76acc8c)](https://docs.moralis.com/)

Search...

Ctrl KAsk AI

- [Enterprise](https://moralis.com/enterprise/)
- [Status](https://status.moralis.io/)
- [Start for Free](https://admin.moralis.com/register)
- [Start for Free](https://admin.moralis.com/register)

Search...

Navigation

Introduction

Data API Supported Chains

[Get Started](https://docs.moralis.com/) [Data API](https://docs.moralis.com/data-api/overview) [Streams](https://docs.moralis.com/streams/overview) [Datashare](https://docs.moralis.com/datashare/overview) [Data Indexer](https://docs.moralis.com/data-indexer/overview) [RPC Nodes](https://docs.moralis.com/rpc-nodes/overview) [Auth API](https://docs.moralis.com/auth-api/overview) [Changelog](https://docs.moralis.com/changelog)

##### Introduction

- [Overview](https://docs.moralis.com/data-api/overview)
- [Pricing](https://docs.moralis.com/data-api/pricing)
- [Supported Chains](https://docs.moralis.com/data-api/supported-chains)
- Quickstart

- Resources

- [Global API Reference](https://docs.moralis.com/get-started/global-api-reference)

##### Data Features

- [Overview](https://docs.moralis.com/data-api/data-features/data-features-overview)
- Data Enrichment

- Prices

- Safety & TrustNew Features

- Search & Discovery

- Integrations


##### EVM API

- [Overview](https://docs.moralis.com/data-api/evm/overview)
- Wallet APINew Features

- Token APINew Features

- NFT API

- Price API

- DeFi API

- Blockchain API


##### Solana API

- [Overview](https://docs.moralis.com/data-api/solana/solana-index)
- Wallet API

- Token APINew features

- NFT API

- Price API


##### Universal API

- [Overview](https://docs.moralis.com/data-api/universal/overview)
- Token APINew features

- Market Metrics API

- Entity API


##### Cortex API

- [Overview](https://docs.moralis.com/data-api/cortex-api/overview)
- [POST\\
\\
Chat](https://docs.moralis.com/data-api/cortex-api/chat)

##### Onchain Skills

- [Onchain Skills](https://docs.moralis.com/data-api/onchain-skills/overview)
- [Tutorial](https://docs.moralis.com/data-api/onchain-skills/tutorial)

Introduction

# Data API Supported Chains

OpenAIOpen in ChatGPT

Blockchains supported by the Moralis Data APIs for tokens, wallets, NFTs, DeFi, and pricing.

OpenAIOpen in ChatGPT

### [​](https://docs.moralis.com/data-api/supported-chains\#data-api-supported-chains)  Data API Supported Chains

The Moralis Data APIs support multiple blockchain networks for **onchain data access**, including wallets, tokens, NFTs, DeFi, and prices.Chain support may vary by feature. Some chains support the full Data API surface, while others support a subset depending on:

- Indexing depth
- Protocol availability
- Onchain data structure

Use the table below to see which chains are supported by the Data APIs and which features are available on each chain.

| Chain | Type | Chain ID | Query Params | Data API | Wallet | NFT | Token | DeFi | Entity | Blockchain | PNL | Prices | Internal Txs | NFT Trades | NFT Prices | Floor Prices |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ethereum Mainnet | Mainnet | 0x1 (1) | `eth` · `0x1` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ethereum Sepolia | Testnet | 0xaa36a7 (11155111) | `sepolia` · `0xaa36a7` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Polygon Mainnet | Mainnet | 0x89 (137) | `polygon` · `0x89` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Polygon Amoy | Testnet | 0x13882 (80002) | `polygon amoy` · `0x13882` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Binance Smart Chain Mainnet | Mainnet | 0x38 (56) | `bsc` · `0x38` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Binance Smart Chain Testnet | Testnet | 0x61 (97) | `bsc testnet` · `0x61` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Arbitrum | Mainnet | 0xa4b1 (42161) | `arbitrum` · `0xa4b1` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Base | Mainnet | 0x2105 (8453) | `base` · `0x2105` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Base Sepolia | Testnet | 0x14a34 (84532) | `base sepolia` · `0x14a34` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Optimism | Mainnet | 0xa (10) | `optimism` · `0xa` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Linea | Mainnet | 0xe708 (59144) | `linea` · `0xe708` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Linea Sepolia | Testnet | 0xe705 (59141) | `linea sepolia` · `0xe705` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Avalanche | Mainnet | 0xa86a (43114) | `avalanche` · `0xa86a` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fantom Mainnet | Mainnet | 0xfa (250) | `fantom` · `0xfa` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Cronos Mainnet | Mainnet | 0x19 (25) | `cronos` · `0x19` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Gnosis | Mainnet | 0x64 (100) | `gnosis` · `0x64` | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Gnosis Chiado | Testnet | 0x27d8 (10200) | `gnosis testnet` · `0x27d8` | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Chiliz Mainnet | Mainnet | 0x15b38 (88888) | `chiliz` · `0x15b38` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Chiliz Testnet | Testnet | 0x15b32 (88882) | `chiliz testnet` · `0x15b32` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Moonbeam | Mainnet | 0x504 (1284) | `moonbeam` · `0x504` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Moonriver | Testnet | 0x505 (1285) | `moonriver` · `0x505` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Moonbase | Testnet | 0x507 (1287) | `moonbase` · `0x507` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Flow | Mainnet | 0x2eb (747) | `flow` · `0x2eb` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Flow Testnet | Testnet | 0x221 (545) | `flow-testnet` · `0x221` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Ronin | Mainnet | 0x7e4 (2020) | `ronin` · `0x7e4` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ronin Saigon Testnet | Testnet | 0x7e5 (2021) | `ronin-testnet` · `0x31769` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Lisk | Mainnet | 0x46f (1135) | `lisk` · `0x46f` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Lisk Sepolia Testnet | Testnet | 0x106a (4202) | `lisk-sepolia` · `0x106a` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Pulsechain | Mainnet | 0x171 (369) | `pulse` · `0x171` | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Sei | Mainnet | 0x531 (1329) | `sei` · `0x531` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sei Testnet | Testnet | 0x530 (1328) | `sei-testnet` · `0x530` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Monad | Mainnet | 0x8f (143) | `monad` · `0x8f` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

[Pricing](https://docs.moralis.com/data-api/pricing) [Get Your API Key](https://docs.moralis.com/data-api/get-your-api-key)

Ctrl+I

[youtube](https://www.youtube.com/channel/UCgWS9Q3P5AxCWyQLT2kQhBw) [x](https://x.com/moralisdevs) [linkedin](https://www.linkedin.com/company/moralisweb3) [discord](https://discord.gg/s3UfDvXQTc) [website](https://moralis.com/)

[Powered byThis documentation is built and hosted on Mintlify, a developer documentation platform](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=moralis)

Assistant

Responses are generated using AI and may contain mistakes.