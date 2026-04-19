[Skip to main content](https://docs.moralis.com/data-api/evm/defi/wallet-positions#content-area)

[Moralis home page![light logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/light.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=66e6da0d81943c4679e0ba921850201d)![dark logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/dark.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=39f72ccb7cd088ee041f49d8b76acc8c)](https://docs.moralis.com/)

Search...

Ctrl KAsk AI

- [Enterprise](https://moralis.com/enterprise/)
- [Status](https://status.moralis.io/)
- [Start for Free](https://admin.moralis.com/register)
- [Start for Free](https://admin.moralis.com/register)

Search...

Navigation

DeFi API

Wallet Positions

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



  - [Overview](https://docs.moralis.com/data-api/evm/defi/overview)
  - [GET\\
    \\
    Wallet Protocols](https://docs.moralis.com/data-api/evm/defi/wallet-protocols)
  - [GET\\
    \\
    Wallet Positions](https://docs.moralis.com/data-api/evm/defi/wallet-positions)
  - [GET\\
    \\
    Detailed Positions](https://docs.moralis.com/data-api/evm/defi/wallet-positions-detailed)
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

Get DeFi positions of a wallet

cURL

```
curl --request GET \
  --url 'https://deep-index.moralis.io/api/v2.2/wallets/{address}/defi/positions?chain=eth' \
  --header 'X-API-Key: test'
```

200

```
[\
  {\
    "protocol_name": "Uniswap v2",\
    "protocol_id": "uniswap-v2",\
    "protocol_url": "https://app.uniswap.org/pools/v2",\
    "protocol_logo": "https://cdn.moralis.io/defi/uniswap.png",\
    "position": {\
      "label": "liquidity",\
      "tokens": [\
        {\
          "token_type": "defi-token",\
          "name": "Wrapped Ether",\
          "symbol": "WETH",\
          "contract_address": "0x06012c8cf97bead5deae237070f9587f8e7a266d",\
          "decimals": "18",\
          "balance": "1000000",\
          "balance_formatted": "1.000000",\
          "logo": "https://cdn.moralis.io/tokens/0x0000000000085d4780b73119b644ae5ecd22b376.png",\
          "thumbnail": "https://cdn.moralis.io/tokens/0x0000000000085d4780b73119b644ae5ecd22b376.png",\
          "usd_price": "1000000",\
          "usd_value": "1000000"\
        }\
      ],\
      "balance_usd": "1000000",\
      "total_unclaimed_usd_value": "1000000",\
      "address": "0x06012c8cf97bead5deae237070f9587f8e7a266d",\
      "position_details": {\
        "fee_tier": 123,\
        "range_tnd": 123,\
        "reserves": [\
          "<string>"\
        ],\
        "current_price": 123,\
        "is_in_range": true,\
        "price_upper": 123,\
        "price_lower": 123,\
        "price_label": "<string>",\
        "liquidity": 123,\
        "range_start": 123,\
        "pool_address": "<string>",\
        "position_key": "<string>",\
        "nft_metadata": {},\
        "asset_standard": "<string>",\
        "apy": 123,\
        "is_debt": true,\
        "is_variable_debt": true,\
        "is_stable_debt": true,\
        "shares": "<string>",\
        "reserve0": "<string>",\
        "reserve1": "<string>",\
        "factory": "<string>",\
        "pair": "<string>",\
        "share_of_pool": 123,\
        "no_price_available": true,\
        "shares_in_strategy": "<string>",\
        "strategy_address": "<string>",\
        "base_type": "<string>",\
        "health_factor": 123,\
        "is_enabled_collateral": true\
      }\
    }\
  }\
]
```

DeFi API

# Wallet Positions

OpenAIOpen in ChatGPT

Get a concise overview of a wallet’s DeFi positions across all protocols.

OpenAIOpen in ChatGPT

GET

/

wallets

/

{address}

/

defi

/

positions

Try it

Get DeFi positions of a wallet

cURL

```
curl --request GET \
  --url 'https://deep-index.moralis.io/api/v2.2/wallets/{address}/defi/positions?chain=eth' \
  --header 'X-API-Key: test'
```

200

```
[\
  {\
    "protocol_name": "Uniswap v2",\
    "protocol_id": "uniswap-v2",\
    "protocol_url": "https://app.uniswap.org/pools/v2",\
    "protocol_logo": "https://cdn.moralis.io/defi/uniswap.png",\
    "position": {\
      "label": "liquidity",\
      "tokens": [\
        {\
          "token_type": "defi-token",\
          "name": "Wrapped Ether",\
          "symbol": "WETH",\
          "contract_address": "0x06012c8cf97bead5deae237070f9587f8e7a266d",\
          "decimals": "18",\
          "balance": "1000000",\
          "balance_formatted": "1.000000",\
          "logo": "https://cdn.moralis.io/tokens/0x0000000000085d4780b73119b644ae5ecd22b376.png",\
          "thumbnail": "https://cdn.moralis.io/tokens/0x0000000000085d4780b73119b644ae5ecd22b376.png",\
          "usd_price": "1000000",\
          "usd_value": "1000000"\
        }\
      ],\
      "balance_usd": "1000000",\
      "total_unclaimed_usd_value": "1000000",\
      "address": "0x06012c8cf97bead5deae237070f9587f8e7a266d",\
      "position_details": {\
        "fee_tier": 123,\
        "range_tnd": 123,\
        "reserves": [\
          "<string>"\
        ],\
        "current_price": 123,\
        "is_in_range": true,\
        "price_upper": 123,\
        "price_lower": 123,\
        "price_label": "<string>",\
        "liquidity": 123,\
        "range_start": 123,\
        "pool_address": "<string>",\
        "position_key": "<string>",\
        "nft_metadata": {},\
        "asset_standard": "<string>",\
        "apy": 123,\
        "is_debt": true,\
        "is_variable_debt": true,\
        "is_stable_debt": true,\
        "shares": "<string>",\
        "reserve0": "<string>",\
        "reserve1": "<string>",\
        "factory": "<string>",\
        "pair": "<string>",\
        "share_of_pool": 123,\
        "no_price_available": true,\
        "shares_in_strategy": "<string>",\
        "strategy_address": "<string>",\
        "base_type": "<string>",\
        "health_factor": 123,\
        "is_enabled_collateral": true\
      }\
    }\
  }\
]
```

⚡**Endpoint cost:** 50 CUs. [Learn more](https://docs.moralis.com/get-started/pricing).

🔗**Mainnet only:** Testnet chains are not supported.

#### Authorizations

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#authorization-x-api-key)

X-API-Key

string

header

default:test

required

#### Path Parameters

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#parameter-address)

address

string

required

Wallet address

Example:

`"0xd100d8b69c5ae23d6aa30c6c3874bf47539b95fd"`

#### Query Parameters

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#parameter-chain)

chain

enum<string>

default:eth

The chain to query

Available options:

`eth`,

`0x1`,

`sepolia`,

`0xaa36a7`,

`polygon`,

`0x89`,

`bsc`,

`0x38`,

`bsc testnet`,

`0x61`,

`avalanche`,

`0xa86a`,

`fantom`,

`0xfa`,

`cronos`,

`0x19`,

`arbitrum`,

`0xa4b1`,

`chiliz`,

`0x15b38`,

`chiliz testnet`,

`0x15b32`,

`gnosis`,

`0x64`,

`gnosis testnet`,

`0x27d8`,

`base`,

`0x2105`,

`base sepolia`,

`0x14a34`,

`optimism`,

`0xa`,

`polygon amoy`,

`0x13882`,

`linea`,

`0xe708`,

`moonbeam`,

`0x504`,

`moonriver`,

`0x505`,

`moonbase`,

`0x507`,

`linea sepolia`,

`0xe705`,

`flow`,

`0x2eb`,

`flow-testnet`,

`0x221`,

`ronin`,

`0x7e4`,

`ronin-testnet`,

`0x31769`,

`lisk`,

`0x46f`,

`lisk-sepolia`,

`0x106a`,

`pulse`,

`0x171`,

`sei-testnet`,

`0x530`,

`sei`,

`0x531`,

`monad`,

`0x8f`

Example:

`"eth"`

#### Response

200 - application/json

Returns all defi positions for the wallet address.

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#response-items-protocol-name)

protocol\_name

string

The name of the protocol

Example:

`"Uniswap v2"`

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#response-items-protocol-id)

protocol\_id

string

The id of the protocol

Example:

`"uniswap-v2"`

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#response-items-protocol-url)

protocol\_url

string

The url of the protocol

Example:

`"https://app.uniswap.org/pools/v2"`

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#response-items-protocol-logo)

protocol\_logo

string

The logo of the protocol

Example:

`"https://cdn.moralis.io/defi/uniswap.png"`

[​](https://docs.moralis.com/data-api/evm/defi/wallet-positions#response-items-position)

position

object

The position of the protocol

Showchild attributes

[Wallet Protocols](https://docs.moralis.com/data-api/evm/defi/wallet-protocols) [Detailed Positions](https://docs.moralis.com/data-api/evm/defi/wallet-positions-detailed)

Ctrl+I

[youtube](https://www.youtube.com/channel/UCgWS9Q3P5AxCWyQLT2kQhBw) [x](https://x.com/moralisdevs) [linkedin](https://www.linkedin.com/company/moralisweb3) [discord](https://discord.gg/s3UfDvXQTc) [website](https://moralis.com/)

[Powered byThis documentation is built and hosted on Mintlify, a developer documentation platform](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=moralis)

Assistant

Responses are generated using AI and may contain mistakes.