[Skip to main content](https://docs.moralis.com/data-api/solana/wallet/portfolio#content-area)

[Moralis home page![light logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/light.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=66e6da0d81943c4679e0ba921850201d)![dark logo](https://mintcdn.com/moralis/GWFD1O4mIZzaStPO/logo/dark.png?fit=max&auto=format&n=GWFD1O4mIZzaStPO&q=85&s=39f72ccb7cd088ee041f49d8b76acc8c)](https://docs.moralis.com/)

Search...

Ctrl KAsk AI

- [Enterprise](https://moralis.com/enterprise/)
- [Status](https://status.moralis.io/)
- [Start for Free](https://admin.moralis.com/register)
- [Start for Free](https://admin.moralis.com/register)

Search...

Navigation

Wallet API

Wallet Portfolio

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



  - [Overview](https://docs.moralis.com/data-api/solana/wallet/overview)
  - [GET\\
    \\
    Native Balance](https://docs.moralis.com/data-api/solana/wallet/native-balance)
  - [GET\\
    \\
    Portfolio](https://docs.moralis.com/data-api/solana/wallet/portfolio)
  - [GET\\
    \\
    Token Balances](https://docs.moralis.com/data-api/solana/wallet/token-balances)
  - [GET\\
    \\
    NFT Balances](https://docs.moralis.com/data-api/solana/wallet/nft-balances)
  - [GET\\
    \\
    Swaps](https://docs.moralis.com/data-api/solana/wallet/wallet-swaps)
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

Gets the portfolio of the given address

cURL

```
curl --request GET \
  --url https://solana-gateway.moralis.io/account/{network}/{address}/portfolio \
  --header 'X-Api-Key: <api-key>'
```

200

```
{
  "nativeBalance": {
    "solana": "<string>",
    "lamports": "<string>"
  },
  "nfts": [\
    {\
      "associatedTokenAddress": "<string>",\
      "mint": "<string>",\
      "name": "<string>",\
      "symbol": "<string>",\
      "tokenStandard": 123,\
      "amount": "<string>",\
      "amountRaw": "<string>",\
      "decimals": 123,\
      "possibleSpam": true,\
      "totalSupply": "<string>",\
      "attributes": [\
        {\
          "traitType": "<string>",\
          "value": {}\
        }\
      ],\
      "contract": {\
        "type": "<string>",\
        "name": "<string>",\
        "symbol": "<string>"\
      },\
      "collection": {\
        "collectionAddress": "<string>",\
        "name": "<string>",\
        "description": "<string>",\
        "imageOriginalUrl": "<string>",\
        "externalUrl": "<string>",\
        "metaplexMint": "<string>",\
        "sellerFeeBasisPoints": 123\
      },\
      "firstCreated": {\
        "mintTimestamp": 123,\
        "mintBlockNumber": 123,\
        "mintTransaction": "<string>"\
      },\
      "creators": [\
        {\
          "address": "<string>",\
          "share": 123,\
          "verified": true\
        }\
      ],\
      "properties": {},\
      "media": {\
        "mimetype": "<string>",\
        "category": "<string>",\
        "originalMediaUrl": "<string>",\
        "status": "<string>",\
        "updatedAt": "<string>",\
        "mediaCollection": {\
          "low": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          },\
          "medium": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          },\
          "high": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          }\
        }\
      }\
    }\
  ],
  "tokens": [\
    {\
      "associatedTokenAddress": "<string>",\
      "mint": "<string>",\
      "name": "<string>",\
      "symbol": "<string>",\
      "tokenStandard": 123,\
      "score": 123,\
      "amount": "<string>",\
      "amountRaw": "<string>",\
      "decimals": 123,\
      "logo": "<string>",\
      "isVerifiedContract": true,\
      "possibleSpam": true\
    }\
  ]
}
```

Wallet API

# Wallet Portfolio

OpenAIOpen in ChatGPT

Gets all the native and token balances of the given address

OpenAIOpen in ChatGPT

GET

/

account

/

{network}

/

{address}

/

portfolio

Try it

Gets the portfolio of the given address

cURL

```
curl --request GET \
  --url https://solana-gateway.moralis.io/account/{network}/{address}/portfolio \
  --header 'X-Api-Key: <api-key>'
```

200

```
{
  "nativeBalance": {
    "solana": "<string>",
    "lamports": "<string>"
  },
  "nfts": [\
    {\
      "associatedTokenAddress": "<string>",\
      "mint": "<string>",\
      "name": "<string>",\
      "symbol": "<string>",\
      "tokenStandard": 123,\
      "amount": "<string>",\
      "amountRaw": "<string>",\
      "decimals": 123,\
      "possibleSpam": true,\
      "totalSupply": "<string>",\
      "attributes": [\
        {\
          "traitType": "<string>",\
          "value": {}\
        }\
      ],\
      "contract": {\
        "type": "<string>",\
        "name": "<string>",\
        "symbol": "<string>"\
      },\
      "collection": {\
        "collectionAddress": "<string>",\
        "name": "<string>",\
        "description": "<string>",\
        "imageOriginalUrl": "<string>",\
        "externalUrl": "<string>",\
        "metaplexMint": "<string>",\
        "sellerFeeBasisPoints": 123\
      },\
      "firstCreated": {\
        "mintTimestamp": 123,\
        "mintBlockNumber": 123,\
        "mintTransaction": "<string>"\
      },\
      "creators": [\
        {\
          "address": "<string>",\
          "share": 123,\
          "verified": true\
        }\
      ],\
      "properties": {},\
      "media": {\
        "mimetype": "<string>",\
        "category": "<string>",\
        "originalMediaUrl": "<string>",\
        "status": "<string>",\
        "updatedAt": "<string>",\
        "mediaCollection": {\
          "low": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          },\
          "medium": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          },\
          "high": {\
            "width": 123,\
            "height": 123,\
            "url": "<string>"\
          }\
        }\
      }\
    }\
  ],
  "tokens": [\
    {\
      "associatedTokenAddress": "<string>",\
      "mint": "<string>",\
      "name": "<string>",\
      "symbol": "<string>",\
      "tokenStandard": 123,\
      "score": 123,\
      "amount": "<string>",\
      "amountRaw": "<string>",\
      "decimals": 123,\
      "logo": "<string>",\
      "isVerifiedContract": true,\
      "possibleSpam": true\
    }\
  ]
}
```

⚡**Endpoint cost:** 10 CUs. [Learn more](https://docs.moralis.com/get-started/pricing).

#### Authorizations

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#authorization-x-api-key)

X-Api-Key

string

header

required

#### Path Parameters

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#parameter-network)

network

enum<string>

required

The network to query

Available options:

`mainnet`,

`devnet`

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#parameter-address)

address

string

required

The address to query

Example:

`"kXB7FfzdrfZpAZEW3TZcp8a8CwQbsowa6BdfAHZ4gVs"`

#### Query Parameters

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#parameter-nft-metadata)

nftMetadata

boolean

default:false

Should return the full NFT metadata

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#parameter-media-items)

mediaItems

boolean

default:false

Should return media items

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#parameter-exclude-spam)

excludeSpam

boolean

default:false

Should exclude spam NFTs

#### Response

200 - application/json

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#response-native-balance)

nativeBalance

object

required

Showchild attributes

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#response-nfts)

nfts

object\[\]

required

Showchild attributes

[​](https://docs.moralis.com/data-api/solana/wallet/portfolio#response-tokens)

tokens

object\[\]

required

Showchild attributes

[Native Balance](https://docs.moralis.com/data-api/solana/wallet/native-balance) [Token Balances](https://docs.moralis.com/data-api/solana/wallet/token-balances)

Ctrl+I

[youtube](https://www.youtube.com/channel/UCgWS9Q3P5AxCWyQLT2kQhBw) [x](https://x.com/moralisdevs) [linkedin](https://www.linkedin.com/company/moralisweb3) [discord](https://discord.gg/s3UfDvXQTc) [website](https://moralis.com/)

[Powered byThis documentation is built and hosted on Mintlify, a developer documentation platform](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=moralis)

Assistant

Responses are generated using AI and may contain mistakes.