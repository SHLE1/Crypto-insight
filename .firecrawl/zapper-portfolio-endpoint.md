![](https://zapper.xyz/logo192.png)

[Skip to main content](https://build.zapper.xyz/docs/api/endpoints/portfolio#__docusaurus_skipToContent_fallback)

[![Zapper Logo](https://build.zapper.xyz/img/logo-dark.png)](https://build.zapper.xyz/)

[Discover](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

- [Portfolio Data](https://build.zapper.xyz/portfolio-data)
- [Portfolio Charts](https://build.zapper.xyz/portfolio-charts)
- [Tokens](https://build.zapper.xyz/token-data)
- [NFTs](https://build.zapper.xyz/nft)
- [Transactions](https://build.zapper.xyz/transaction-history)
- [Search](https://build.zapper.xyz/onchain-search)
- [Farcaster](https://build.zapper.xyz/farcaster)
- [Tax Software](https://build.zapper.xyz/tax)
- [MCP](https://build.zapper.xyz/mcp)
- [X402](https://build.zapper.xyz/x402)

[Docs](https://build.zapper.xyz/docs/api/) [Pricing](https://build.zapper.xyz/pricing) [Sandbox](https://build.zapper.xyz/sandbox)

Sign in

Search`Ctrl`  `K`

- [API](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

  - [Getting Started](https://build.zapper.xyz/docs/api/)
  - [x402](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

  - [Skill](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

  - [For Agents & LLMs](https://build.zapper.xyz/docs/api/agents)
  - [Endpoints](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [Portfolio Data](https://build.zapper.xyz/docs/api/endpoints/portfolio)
    - [Token Prices & Charts](https://build.zapper.xyz/docs/api/endpoints/onchain-prices)
    - [Transactions](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [Rankings](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [NFTs](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [Account Identity](https://build.zapper.xyz/docs/api/endpoints/onchain-identity)
    - [Farcaster](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [Search](https://build.zapper.xyz/docs/api/endpoints/search)
    - [Utility](https://build.zapper.xyz/docs/api/endpoints/portfolio#)

    - [Portfolio Charts](https://build.zapper.xyz/docs/api/endpoints/portfolio-charts)
  - [Supported Chains](https://build.zapper.xyz/docs/api/supported-chains)
  - [Resources](https://build.zapper.xyz/docs/api/endpoints/portfolio#)
- [Interpretation](https://build.zapper.xyz/docs/api/endpoints/portfolio#)


- [Home page](https://build.zapper.xyz/)
- API
- Endpoints
- Portfolio Data

On this page

# Portfolio Data

Access complete onchain portfolio data with a single query. The portfolio query provides comprehensive access to balances across tokens, apps, and NFTs, along with detailed portfolio totals and breakdowns.

note

Use `portfolioV2` to query portfolio data and ensure up-to-date information. Avoid using the deprecated `portfolio` endpoint, as it will soon be made unavailable.

## Overview [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#overview "Direct link to Overview")

The `portfolioV2` query takes an array of `addresses` as input, and an optional array of `chainIds`. It returns a complete view of onchain holdings including:

- [Token balances](https://build.zapper.xyz/docs/api/endpoints/portfolio#tokenbalances)
- [App balances](https://build.zapper.xyz/docs/api/endpoints/portfolio#appbalances)
- [NFT balances](https://build.zapper.xyz/docs/api/endpoints/portfolio#nftbalances)
- [Portfolio totals and breakdowns](https://build.zapper.xyz/docs/api/endpoints/portfolio#4-portfolio-totals)
- [Claimables](https://build.zapper.xyz/docs/api/endpoints/portfolio#5-claimables)

## Portfolio Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#portfolio-fields "Direct link to Portfolio Fields")

### `tokenBalances` [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#tokenbalances "Direct link to tokenbalances")

Access native token holdings across different networks with real-time computation built in.

[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABACoQDWyAQgIYA2NSUCAzgBQAkNYYerLrdEQDaAQR58WLAIQBdaQBoiHAGYBLPCxRCAkqiUcoACxpqkOsCyHC9KOQEoiwADpIiRAA4Q8KFRDpqEABqAExs3Lz8gsoRkgIsSsam5pZChiZmFiyOLm7uRCgU1PSMzCxOrvn5hSj0tAxMCACqAMoAIpVVRABGBGSUSGzqmtrKw1o5nV0FELV0AMIQMKhTXQhgAOasFXnT7kgQYAg7e10sBHDd-qunhQPikVI3e90ljc-Trw3MrR27p548GpmB8umo4Bsmng6KFQVUkDREHD8kgECgAO7ecgnAHwxEIZHuAC%2ByJJ-yqZOmlPy1LJRJAChAADcaECaN06KwMCBcu5nCBYlEWPzrPyAAwADwAHAAWACcAEYAKwKsAAdjAYu6KgVKgAzDLumqxWAlVBuCr5WAQlKoFAQnqxVLtQr%2BbIFJ1%2BeMUCKiEqPXl%2BUlMpYRcJZUq9bJXPTGUYENx8CxuS4QKIYCgjN41AAvGgoQJIEX82gsYFEACyACsAhWSFAcwAtEg6FCNtoAJTUAE0CGKxe2NjKADIAdQAUnQ6wBFFAAOQA4tOCNWAGJ0Oc1ujdls5gC8e-59KJQA)

#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables "Direct link to Example Variables")

```js
{
  "addresses": ["0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"],
  "first": 5,
  "chainIds": [8453], // Optional (Returns all chains when omitted)
  "filters": {"minBalanceUSD": 10} // Optional
}
```

#### Example Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-query "Direct link to Example Query")

```graphql
query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
  portfolioV2(addresses: $addresses, chainIds: $chainIds) {
    tokenBalances {
      totalBalanceUSD
      byToken(first: $first) {
        totalCount
        edges {
          node {
            symbol
            tokenAddress
            balance
            balanceUSD
            price
            imgUrlV2
            name
            network {
              name
            }
          }
        }
      }
    }
  }
}
```

#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response "Direct link to Example Response")

```json
{
  "data": {
    "portfolioV2": {
      "tokenBalances": {
        "totalBalanceUSD": 251379.07705505722,
        "byToken": {
          "totalCount": 6443,
          "edges": [\
            {\
              "node": {\
                "symbol": "BKIT",\
                "tokenAddress": "0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1",\
                "balance": 28980487535.238518,\
                "balanceUSD": 31298.9265380576,\
                "price": 0.00000108,\
                "imgUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x262a9f4e84efa2816d87a68606bb4c1ea3874bf1.png",\
                "name": "Bangkit",\
                "network": {\
                  "name": "Base"\
                }\
              }\
            },\
            {\
              "node": {\
                "symbol": "SYNDOG",\
                "tokenAddress": "0x3d1d651761d535df881740ab50ba4bd8a2ec2c00",\
                "balance": 30000000,\
                "balanceUSD": 23449.8,\
                "price": 0.00078166,\
                "imgUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x3d1d651761d535df881740ab50ba4bd8a2ec2c00.png",\
                "name": "Synthesizer Dog",\
                "network": {\
                  "name": "Base"\
                }\
              }\
            },\
            {\
              "node": {\
                "symbol": "BNKR",\
                "tokenAddress": "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",\
                "balance": 55181351.17643974,\
                "balanceUSD": 17482.251815591913,\
                "price": 0.00031681449335470687,\
                "imgUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b.png",\
                "name": "BankrCoin",\
                "network": {\
                  "name": "Base"\
                }\
              }\
            },\
            {\
              "node": {\
                "symbol": "GEKO",\
                "tokenAddress": "0x64baa63f3eedf9661f736d8e4d42c6f8aa0cda71",\
                "balance": 10000000,\
                "balanceUSD": 14040.5,\
                "price": 0.00140405,\
                "imgUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x64baa63f3eedf9661f736d8e4d42c6f8aa0cda71.png",\
                "name": "Geko Base",\
                "network": {\
                  "name": "Base"\
                }\
              }\
            },\
            {\
              "node": {\
                "symbol": "SAINT",\
                "tokenAddress": "0x7588880d9c78e81fade7b7e8dc0781e95995a792",\
                "balance": 10000000,\
                "balanceUSD": 9881.1,\
                "price": 0.00098811,\
                "imgUrlV2": "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x7588880d9c78e81fade7b7e8dc0781e95995a792.png",\
                "name": "Satoshi AI agent by Virtuals",\
                "network": {\
                  "name": "Base"\
                }\
              }\
            }\
          ]
        }
      }
    }
  }
}
```

#### Key Features [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-features "Direct link to Key Features")

- **Real-time Computation**: No separate computation jobs needed
- **Flexible Querying**: View balances by token, account, or network
- **Detailed Token Data**: Complete token metadata and balances
- **Account-level Breakdown**: See individual wallet contributions to total balances

#### Available Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#available-fields "Direct link to Available Fields")

##### Token Balance Root Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#token-balance-root-fields "Direct link to Token Balance Root Fields")

| Field | Description | Type |
| --- | --- | --- |
| `totalBalanceUSD` | Total portfolio value in USD | `Float!` |
| `byToken` | Token-centric view of balances | `PortfolioV2TokenBalanceByTokenConnection!` |
| `byAccount` | Account-centric view of balances | `PortfolioV2TokenBalancesByAccountConnection!` |
| `byNetwork` | Network-centric view of balances | `PortfolioV2TokenBalancesByNetworkConnection!` |

##### Token Balance Node Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#token-balance-node-fields "Direct link to Token Balance Node Fields")

| Field | Description | Type |
| --- | --- | --- |
| `tokenAddress` | Token contract address | `String!` |
| `networkId` | Network identifier | `ID!` |
| `name` | Token name | `String!` |
| `symbol` | Token symbol | `String!` |
| `decimals` | Token decimal places | `Float!` |
| `price` | Current token price | `Float!` |
| `balance` | Total balance across all accounts | `Float!` |
| `balanceUSD` | USD value of total balance | `Float!` |
| `balanceRaw` | Raw balance amount (pre-decimal adjustment) | `String!` |
| `network` | Detailed network information | `NetworkObject!` |
| `imgUrl` | Token icon URL (deprecated) | `String!` |
| `imgUrlV2` | Token icon URL (null if not found) | `String` |

##### Account Balance Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#account-balance-fields "Direct link to Account Balance Fields")

| Field | Description | Type |
| --- | --- | --- |
| `accountAddress` | Wallet address | `Address!` |
| `balance` | Token balance for this account | `Float!` |
| `balanceUSD` | USD value for this account | `Float!` |
| `balanceRaw` | Raw balance for this account | `String!` |
| `account` | Detailed account information | `Account!` |

#### Filtering Options [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#filtering-options "Direct link to Filtering Options")

The `byToken` query accepts several filtering parameters:

```graphql
byToken(
  first: Int = 25,
  after: String,
  filters: {
    minBalanceUSD: Float
    symbolLike: String
    tokenAddress: String
    includeTokensWithMissingPrices: Boolean
  }
)
```

Similar filtering options are available for `byAccount` and `byNetwork` queries.

tip

When working with raw balances, remember to adjust for token decimals. For example, a `balanceRaw` of "1000000000000000000" with 18 decimals represents 1.0 tokens.

### `appBalances` [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#appbalances "Direct link to appbalances")

View positions within onchain applications like lending protocols, DEXes, etc.

[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAIIAOZAQgIYA21SUCAzgBQAk1YYeLzL6IgG0S3Xs2YBCALqSANEXYAzAJZ5mKQQElURALxEAjAAYAlEWAAdJESJkIeFEoi0VEAGoAmVlx58Bir7i-MzmVja2RNQUNPSMLBbWkZEAxEQAKhAodEQAbnS4RBBKUbS0URR2EMwqKG5IzEnJRChZdLEMTACqAMoAIk3Jg6lEAOJ4EDBkVTV1EA1EAEbE0WSuUNRzSMO2y%2BRkrKrqmopHGmE7ka3ZtADCk6iXtghgAOYJ4c3NSBBgCIkRL7JNL7IiIbJgTbUJ7NRZ0ToIXoDQFA2yrAGor5gFTMNbUAgAOWoiBhXxUcFeXTwtFJzT%2BzCgeBUZC2tOSzFoMFebMiMGpPNsGxQCFeDmIn0xXyQxIQAqIAF8eYqUaikAgUAB3BwAawxksi0pJKsxHK5cqgAAtqCokFowHKELk4Pc4GRNipFrRZcavsr9UQeWkAArVWr1Ih-bIqWjMIga2oWogwJB-akEG2vKISdWNH3NeyzeodeJsM4nEwXPNfF7vWMS-22H5-PUNkag1ra5AzMPzWOsBAAOleA6IABkgy0IJ2GgoNRoAKLpAASs7wqxek%2BnoTlyQHe6KNn2mWnIcL82LTBbrauBDI3uvzSCfB333VWrw2pf7IIcEWLi-kR-FA5J0LmD7JHCcRMABuzwvESIwXYTLQVW%2BqrHaiGvBMUwYahkpYZMZCjtQiwIDSeEmlMawEIhZDIQgQb4D0Vq8IhiFpKO87uPOo5GIIfRqAgUAoEmKb4LQ6ZIJmHbIH2g7DnGC7LkQAC0AB8RBKUupiITJCz1uBthpDQ-CbrJUQiV6uRkUYRD9kOI5IrcCh9CQWhEDaURjkGOkUZKe4jvMRAmQgx7IKePZIBe-wGYZtgoLe95xckT4SIhyRqpqOrpZEkEIjlsFQYi-QFUhKgocl36-v%2Bfn6kBIExjlfqVTlIKVHpsabEQVk2YYdnySOWmiamEkZopKCLtpOUBQepAUGFSARVs0VXslCV3qVqVgZVjZvtltWSnl8SlUd3QlQdmJ0eVSU7cwP5-uRO22PVcCgZtFC4U9mlURJpVXUwjF4Mx1CsRdqKlRxXE8UQniCF0YlpmNxQtBa-zJiNkmZvZClDepRCTb5X0datlXGdQpnE11PXlJ4pW2DNQUhQtS1FnBl6xU9603V9URiM%2BYP6pl76fgLh1s9zX2ncVyI85E-0S09d3VY9ssRkJDXbV9zVfXTRBtdMlOWY6NmeHZzh4EQUAQK6XoAB5EGqGgbgWkXbqLQIM4e81TuFobLeLJM7VzutonzaXu6qe0fiHSzizHUsIRHQLyzHSsPTHL1vUnXzofa2fNMwP00fnyTy4DwOg6rAYlyMnHcbxADMgjpBaahgN1xvlMj6PiZjZkNDHaQtzilsQNZ6iW%2BTCSuJ2ghWzbCC2%2BOqkaTUC-L3jcL8Atms88THNfWkXSF3QEmxxTPsLF1KCt7G1Mx-T%2B6M1PzN%2B6zRWB3viUP5EW0-7tWVo41y%2BFLf%2BsciqJyrqXeiYC041SgYBdWr1GrAMiNrVWP80gACUQb-EWDAESBYaiegQIIBgWRUYW3RHpH%2Bns5pkFfmeKKAcD5fw2qglKYdd5VyFvtBBhV8ocNyuLSB-CU5CNsHAlWCDM4oP4RUMgn1%2BGFwoL9CRZUAZMRYgrWWaQCRZCIKKMafwEB3gtjfBgRAG4d2snIqB6Cta6wcXFZxD5XENncf6diRA%2BjqmtF6du2JcT0GIHRCAZi6gJEQkEvEBAgwTDIHWHK9BSLSLiiBWsOUpYCWCfiAAsr8HRHiAKeMxABNI9xUBrmEt2LYckHIdxTBmBQSgQZwGaXkagMBaAoDdoZOhlSUDVJQCzc8LDdLf3dn-d2vCgHJVzphbCii87JQIlMYiqTEIJ3Oslbx8MMZjWJvGG%2BYI-EqS5n2HoXQgxBlHFoecfQFCUAAPJYKwc8gA6g8hQtxRxuTySQSgnEFDqigAOQmcV945XBNQdIkyg6X0-g%2BSG9c%2BI%2BMEjU4mnkb7-CtlU6gNSXasnzmTC%2BW5%2BoNJUWsFQG4nIQp2nQpml9RnMI-qwwywca7TNlrMkWstQE122TLHm4jZZSN1rI7hLjSoQ3of3WMnk8VDIJYQt%2BvYKU4x%2BjS9u1A6WlToUeZlarWUIiReBTlstuU815brAV-KRE7JFTAmu4qa6St1gsl1RddZly0bg3WusUXQ1hkQfZvckYlGoZfBVNglXDNqfUKVa1o1msMqS-4hsbEmxjoyl%2BRqmErXZZVC1UCrU8KjnyqBdqq0OuFVXUVUDXUyKQVnKupTDKDzlZm6mMMc1Py9gw-NkVC0-xLVXMtqsbVCOrVXIVP8G1VybVA91QjPUIKpWohBvqgbaJ-pgscUNG7N1bngduPbzajwXvbONKqE29lHSmotO103yoslm8oDcwG5u3kO-2bKwHxXhfI3mfhw7AYdhWgD4DBHgbneo2wC7lH3XgcBld8j20tXUfrV9VNO5WLsmuXgSwCEzGIV6elUCDXexPMakd8GWhAfkROhBU7YNx3o3B8DiH13IbSc24CyCk2qzXcBjdxcuP0XLru%2BjeiDFGKkmrUx%2BAUaWOsdTITjihEYbcU40q2n9SyoJAAMXSHehYrAfhECUHyHFFtHZ1AU2qF4LwKPJTofopARnkyvA9F6FldHZZjqesxyqrGeYzqepxp111dZLq%2Bmhp6%2BnURJeaCloY7s0i%2BKjAEiMOJYlIXCfgSJsZol5ZCfE8JSSk4pLIjlDJLAsnixybEgpfxEJpYVC%2BfTGHSnuOceg5qyp5QgDkCAfITISJemYBgEAEpLAgC2g1jAwh5vGFtsYJQAAOQwAB2AAnNQTwAA2agCAAAsO3jB7aEgAVj28YM7m3DtHaOwgI792wBnb2zdm7DcjvGBu9CEA0g5BNHm2WebggbvWGG6N1GXB8DTcwFYEAJACEWgcCoAAXu6eYkP5smXKkQPJAArVweT0hQCxwALXSFoFA1O%2BhYJUAATQIMYYwjPXhndHB8gAUrQCnABFFABJRhC4IKToztACRk9oCzunWO9B6Hm8N%2BUQA)

#### Key Features [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-features-1 "Direct link to Key Features")

- **Real-time Computation**: No separate computation jobs needed
- **Flexible Querying**: View app positions by app, account, meta-type, network, or token
- **Detailed Position Data**: Complete position metadata and underlying assets
- **Account-level Breakdown**: See individual wallet contributions to positions

#### Key Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-fields "Direct link to Key Fields")

- `totalBalanceUSD`: Total value of all app positions
- `byApp`: View positions grouped by application
- `byAccount`: View positions grouped by wallet address (useful for accounts with smart accounts)
- `byMetaType`: View positions grouped by their classification (SUPPLIED, BORROWED, etc.)
- `byNetwork`: View positions grouped by blockchain network
- `byToken`: View positions grouped by underlying token

Position balances come in two types that require GraphQL fragments to access their specific fields:

1. `AppTokenPositionBalance` (for fungible tokens like LP tokens):
   - `type`: "app-token"
   - `balance`: Token balance
   - `balanceUSD`: USD value
   - `price`: Token price
   - `symbol`: Token symbol
   - `tokens`: Array of underlying tokens
2. `ContractPositionBalance` (for positions like a lending position):
   - `type`: "contract-position"
   - `balanceUSD`: Position USD value
   - `tokens`: Array of underlying tokens with their meta-types
   - `displayProps`: Formatted data for UI rendering

#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables-1 "Direct link to Example Variables")

```js
{
  "addresses": ["0xaf06a5ee843215e156e1b42efbc4de5404607164"],
  "first": 5,
  "chainIds": [8453], // Optional (Returns all chains when omitted)
}
```

#### Example App Balance Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-app-balance-query "Direct link to Example App Balance Query")

```graphql
query AppBalances($addresses: [Address!]!, $first: Int = 10) {
  portfolioV2(addresses: $addresses) {
    appBalances {
      # Total value of all app positions
      totalBalanceUSD

      # Group positions by application
      byApp(first: $first) {
        totalCount
        edges {
          node {
            # App metadata
            balanceUSD
            app {
              displayName
              imgUrl
              description
              slug
              url
              category {
                name
              }
            }
            network {
              name
              slug
              chainId
              evmCompatible
            }

            # Position details with underlying assets
            positionBalances(first: 10) {
              edges {
                node {
                  # App token positions (e.g. LP tokens, wstETH, wrapped tokens)
                  ... on AppTokenPositionBalance {
                    type
                    address
                    network
                    symbol
                    decimals
                    balance
                    balanceUSD
                    price
                    appId
                    groupId
                    groupLabel
                    supply
                    pricePerShare

                    # LEVEL 1: Direct underlying tokens (e.g. wstETH -> stETH)
                    tokens {
                      # Base tokens at level 1 (e.g. USDC, DAI in a LP)
                      ... on BaseTokenPositionBalance {
                        type
                        address
                        network
                        balance
                        balanceUSD
                        price
                        symbol
                        decimals
                      }

                      # App tokens at level 1 (e.g. stETH underlying wstETH)
                      ... on AppTokenPositionBalance {
                        type
                        address
                        network
                        balance
                        balanceUSD
                        price
                        symbol
                        decimals
                        appId
                        supply
                        pricePerShare

                        # LEVEL 2: Underlying of the underlying (e.g. stETH -> ETH)
                        tokens {
                          # Base tokens at level 2
                          ... on BaseTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                          }

                          # App tokens at level 2 (for complex nested positions)
                          ... on AppTokenPositionBalance {
                            type
                            address
                            network
                            balance
                            balanceUSD
                            price
                            symbol
                            decimals
                            appId
                            supply
                            pricePerShare

                            # LEVEL 3: Third level of underlying tokens
                            # This covers cases like: complexLP -> simpleLP -> baseTokens
                            tokens {
                              # Usually base tokens at this level
                              ... on BaseTokenPositionBalance {
                                type
                                address
                                network
                                balance
                                balanceUSD
                                price
                                symbol
                                decimals
                              }

                              # Rare but possible: another app token
                              ... on AppTokenPositionBalance {
                                type
                                address
                                network
                                balance
                                balanceUSD
                                price
                                symbol
                                decimals
                                appId
                                supply
                                pricePerShare
                                # Continue returning underlying tokens if needed
                              }
                            }
                          }
                        }
                      }
                    }

                    # Detailed display properties
                    displayProps {
                      label
                      images
                      balanceDisplayMode
                    }
                  }

                  # Contract positions (e.g. lending, farming, vaults)
                  ... on ContractPositionBalance {
                    type
                    address
                    network
                    appId
                    groupId
                    groupLabel
                    balanceUSD

                    # Underlying tokens with meta-types (SUPPLIED, BORROWED, CLAIMABLE, etc.)
                    tokens {
                      metaType
                      token {
                        # LEVEL 1: Direct tokens in the contract position
                        # Base tokens (e.g. supplied USDC)
                        ... on BaseTokenPositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                        }

                        # App tokens in contract positions (e.g. supplied aUSDC)
                        ... on AppTokenPositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                          appId
                          supply
                          pricePerShare

                          # LEVEL 2: Underlying of app tokens in contract positions
                          tokens {
                            # Base tokens at level 2
                            ... on BaseTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                            }

                            # App tokens at level 2
                            ... on AppTokenPositionBalance {
                              type
                              address
                              network
                              balance
                              balanceUSD
                              price
                              symbol
                              decimals
                              appId
                              supply
                              pricePerShare

                              # LEVEL 3: Third level for complex contract positions
                              tokens {
                                # Base tokens at level 3
                                ... on BaseTokenPositionBalance {
                                  type
                                  address
                                  network
                                  balance
                                  balanceUSD
                                  price
                                  symbol
                                  decimals
                                }

                                # App tokens at level 3 (rare but possible)
                                ... on AppTokenPositionBalance {
                                  type
                                  address
                                  network
                                  balance
                                  balanceUSD
                                  price
                                  symbol
                                  decimals
                                  appId
                                  supply
                                  pricePerShare
                                  # Not going deeper than 3 levels
                                }
                              }
                            }
                          }
                        }

                        # NFT positions (no further nesting needed)
                        ... on NonFungiblePositionBalance {
                          type
                          address
                          network
                          balance
                          balanceUSD
                          price
                          symbol
                          decimals
                        }
                      }
                    }

                    # Detailed display properties
                    displayProps {
                      label
                      images
                      balanceDisplayMode
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response-1 "Direct link to Example Response")

```js
{
  "data": {
    "portfolioV2": {
      "appBalances": {
        "totalBalanceUSD": 23939642.91719707,
        "byApp": {
          "totalCount": 1,
          "edges": [\
            {\
              "node": {\
                "balanceUSD": 23939642.91719707,\
                "app": {\
                  "displayName": "Lido",\
                  "imgUrl": "https://storage.googleapis.com/zapper-fi-assets/apps%2Flido.png",\
                  "description": "Simplified and secure participation in staking",\
                  "slug": "lido",\
                  "url": "https://lido.fi/",\
                  "category": {\
                    "name": "Staking"\
                  }\
                },\
                "network": {\
                  "name": "Ethereum",\
                  "slug": "ethereum",\
                  "chainId": 1,\
                  "evmCompatible": true\
                },\
                "positionBalances": {\
                  "edges": [\
                    {\
                      "node": {\
                        "type": "app-token",\
                        "address": "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",\
                        "network": "ETHEREUM_MAINNET",\
                        "symbol": "wstETH",\
                        "decimals": 18,\
                        "balance": "7880.037743210678",\
                        "balanceUSD": 23939642.91719707,\
                        "price": 3038.01119960664,\
                        "appId": "lido",\
                        "groupId": "wsteth",\
                        "groupLabel": "wstETH",\
                        "supply": 3461283.5529221934,\
                        "pricePerShare": [\
                          1.2056461174237205\
                        ],\
                        "tokens": [\
                          {\
                            "type": "app-token",\
                            "address": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",\
                            "network": "ETHEREUM_MAINNET",\
                            "balance": "9500.536910254332",\
                            "balanceUSD": 23939642.91719707,\
                            "price": 2519.82,\
                            "symbol": "stETH",\
                            "decimals": 18,\
                            "appId": "lido",\
                            "supply": 9122602.975724617,\
                            "pricePerShare": [\
                              1\
                            ],\
                            "tokens": [\
                              {\
                                "type": "base-token",\
                                "address": "0x0000000000000000000000000000000000000000",\
                                "network": "ETHEREUM_MAINNET",\
                                "balance": "9500.536910254332",\
                                "balanceUSD": 23939642.91719707,\
                                "price": 2519.82,\
                                "symbol": "ETH",\
                                "decimals": 18\
                              }\
                            ]\
                          }\
                        ],\
                        "displayProps": {\
                          "label": "wstETH",\
                          "images": [\
                            "https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x0000000000000000000000000000000000000000.png"\
                          ],\
                          "balanceDisplayMode": null\
                        }\
                      }\
                    }\
                  ]\
                }\
              }\
            }\
          ]
        }
      }
    }
  }
}
```

#### App Balances by Network [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#app-balances-by-network "Direct link to App Balances by Network")

View all app positions grouped by network:

```graphql
query AppBalancesByNetwork($addresses: [Address!]!) {
  portfolioV2(addresses: $addresses) {
    appBalances {
      byNetwork(first: 10) {
        totalCount
        edges {
          node {
            network {
              name
              slug
              chainId
            }
            balanceUSD
          }
        }
      }
    }
  }
}
```

note

Smart accounts like Maker's `DSProxy` are automatically included in balance responses as part of an "implicit" bundle. For a breakdown by account use the `byAccount` field.

#### Main Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#main-fields "Direct link to Main Fields")

| Field | Description | Type |
| --- | --- | --- |
| `totalBalanceUSD` | Total value of all app positions in USD | `Float!` |
| `byApp` | Positions grouped by application | `Connection!` |
| `byAccount` | Positions grouped by wallet address | `Connection!` |
| `byMetaType` | Positions grouped by classification | `Connection!` |
| `byNetwork` | Positions grouped by blockchain network | `Connection!` |
| `byToken` | Positions grouped by underlying token | `Connection!` |

#### App Position Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#app-position-fields "Direct link to App Position Fields")

| Field | Description | Type |
| --- | --- | --- |
| `appId` | Application identifier | `ID!` |
| `balanceUSD` | Total value in this app | `Float!` |
| `app` | App metadata (name, description, etc.) | `App!` |
| `network` | Network information | `NetworkObject!` |
| `accountBalances` | Breakdown by wallet address | `Connection!` |
| `balances` | Detailed position information | `Connection!` |

#### Position Types [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#position-types "Direct link to Position Types")

#### AppTokenPositionBalance (For LP tokens, yield tokens, etc.) [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#apptokenpositionbalance-for-lp-tokens-yield-tokens-etc "Direct link to AppTokenPositionBalance (For LP tokens, yield tokens, etc.)")

| Field | Description | Type |
| --- | --- | --- |
| `type` | Position type ("app-token") | `String!` |
| `address` | Token contract address | `String!` |
| `balance` | Token balance | `String!` |
| `balanceUSD` | USD value of position | `Float!` |
| `price` | Token price | `Float!` |
| `symbol` | Token symbol | `String!` |
| `tokens` | Underlying tokens | `[AbstractToken!]!` |
| `displayProps` | UI display properties | `DisplayProps` |

#### ContractPositionBalance (For lending, staking positions, etc.) [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#contractpositionbalance-for-lending-staking-positions-etc "Direct link to ContractPositionBalance (For lending, staking positions, etc.)")

| Field | Description | Type |
| --- | --- | --- |
| `type` | Position type ("contract-position") | `String!` |
| `address` | Contract address | `String!` |
| `balanceUSD` | USD value of position | `Float!` |
| `tokens` | Underlying tokens with meta-types | `[TokenWithMetaType!]!` |
| `displayProps` | UI display properties | `DisplayProps` |

#### Meta-Type Values [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#meta-type-values "Direct link to Meta-Type Values")

The `metaType` field indicates the role of tokens within positions:

| Value | Description |
| --- | --- |
| `SUPPLIED` | Tokens supplied to a protocol |
| `BORROWED` | Tokens borrowed from a protocol |
| `CLAIMABLE` | Tokens that can be claimed as rewards |
| `VESTING` | Tokens that are currently vesting |
| `LOCKED` | Tokens that are locked in a protocol |

#### Best Practices [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#best-practices "Direct link to Best Practices")

1. **Use fragments for position types**: Since app positions can be either `AppTokenPositionBalance` or `ContractPositionBalance`, always use fragments to properly access all fields.

2. **Filter low-value positions**: Use the `minBalanceUSD` filter to exclude dust or low-value positions from results:





```graphql
byApp(first: 10, filters: { minBalanceUSD: 10 })
```

3. **Include proxy accounts**: Set `includeProxyAccounts: true` to see positions held in smart contract wallets:





```graphql
portfolioV2(addresses: $addresses, includeProxyAccounts: true)
```

4. **Handle token decimals**: Remember to adjust token balances based on their decimals field.


### `nftBalances` [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#nftbalances "Direct link to nftbalances")

Get all NFTs held by address(s), with complete metadata, estimated USD valuations, and flexible filters and ordering.

[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAHIBiAKgEICGANjUlAgM4D6AqgMoAiXEeFAjAAKACQ0wYPKxat0RANoBBKTJYsAhAF1NAGiJiAZgEs8LFAoCSqA2IFh8CgAoCURiHRMQAagCYSIxRaBiYEKgIKCABrZBsABxgUBKSASiJgAB0kIiJ4tw8vXz8RSWlZeUMy9TkWdKyc3KIkIJDGZhYM7KamlAgUejaw7h5unqI%2Bgboo2KQWAHkAdyRhMZ6AI0iY5BFTc0tDPYsDBydDU7x6tfHhAHNWLsbxpqQIR0fn54YLACUEZhMADdVk9Prk%2BrMPmDxhC4mBrtDmjREAjoY4WFA8CZ4ihvEhUWCWDB4vE6AQCZ8oGZYAxcUhblxiaTyaDEaxcXAaEIwD56LgoYieoC%2BQgOCx4azBcK6LgAOomFAACx4yAgcBMSC5eIpYMcr3VmtxEByDUFn2qsh10JYBDg608VrBKxQiwE0Ud4wAvh7ct7JWCoJ46P8jSafS8EC63eHchaNDGkSj-dCUAR4ggE45SRACPhMwhs7mwMoUAmIMs88mwYgwCYaJ1TWbxnQILcIAKmz11YgKGmM1XBaZg1wTAAvfud57rGV4RX1xUJnqKhAmW6K0sDxGLExgJWLpoCVca%2BgcLH73KH27HujnogMPD3W81kzwW9K%2BDrTUmG%2Bb6HxGSQAajAoAAwp4Aj7n6k5EFBTawWaz71j4ADMHZmiYnL3A2%2B53A8jbQbkrzvPhBG5N2CC9umt65EOCAjuO1FENOMCzvOjHLqu66Mduu4Lr%2BiKXtep4mIxgmaj%2BpE9O%2BdpfhJklkcIL5wIx96Pvxf4AWqx6oGBLZ4Le8GToZZrGdCpnPOZTSWaZhmwX6nogHoIDCliNDTqwGAgI2mQgHGtQ%2BQoijXD5AAMAAeACsfhQAAHEYRgACwJX4ABsIUhRFKVGDFACcKUIH4IVgDFNAJchKUAIxFcVcUZQA7CFFXrD5YzaHoYw%2BUcpYYEQVXtY0PkXAFHY%2BZsw0%2BSMbCyvMPwUAAEi1jT2Y5IDLpI%2BAsJ5WQgMoSSKoeo5asaAU%2BbQLAmFARAALIAFZeFdFBQKOABaFBWCgz08D8JgAJoEOln23AlAAysoAFJ0A9ACKKAkAA4lDBC3WQdAkHddA-W9o4ALzYz5DmekAA)

#### Key Features [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-features-2 "Direct link to Key Features")

- **Flexible Querying**: View NFT holdings by network, collection, or individual tokens
- **Detailed NFT metadata**: Complete collection and token metadata
- **USD Valuations**: Get estimated USD values for NFTs
- **Filters**: [Filter](https://build.zapper.xyz/docs/api/endpoints/portfolio#bynetwork) by name, network, min USD value, or hidden (spam)
- **Ordering**: [Order](https://build.zapper.xyz/docs/api/endpoints/portfolio#flexible-ordering) by USD value or recently received

#### Key Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-fields-1 "Direct link to Key Fields")

- `totalBalanceUSD`: Total estimated value of all NFT holdings
- `totalTokensOwned`: Total number of NFTs owned, including multiple copies of ERC-1155s
- `byNetwork`: View NFTs grouped by blockchain network
- `byCollection`: View NFTs grouped by collection
- `byToken`: View individual NFT tokens with details

#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables-2 "Direct link to Example Variables")

```js
{
  "addresses": ["0x52c8ff44260056f896e20d8a43610dd88f05701b"],
  "first": 10,
  "chainIds": [8453], // Optional (Returns all chains when omitted)
  "order": {
    "by": "USD_WORTH" // Or LAST_RECEIVED
  },
}
```

#### Example Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-query-1 "Direct link to Example Query")

```graphql
query NFTBalances_USDSorted(
  $addresses: [Address!]!
  $first: Int
  $order: PortfolioV2NftBalanceByTokenInputInput
  $filters: PortfolioV2NftBalanceByTokenFiltersInput
) {
  portfolioV2(addresses: $addresses) {
    nftBalances {
      totalBalanceUSD
      totalTokensOwned
      byToken(first: $first, order: $order, filters: $filters) {
        edges {
          node {
            lastReceived
            token {
              tokenId
              name
              description
              supply
              circulatingSupply
              estimatedValue {
                valueUsd
                valueWithDenomination
                denomination {
                  address
                  symbol
                  network
                }
              }
              collection {
                network
                address
                name
                type
                deployer
                deployedAt
                owner
                medias {
                  logo {
                    mimeType
                    fileSize
                    blurhash
                    height
                    width
                    originalUri
                    original
                    large
                    medium
                    thumbnail
                    predominantColor
                  }
                }
              }
              mediasV3 {
                images {
                  edges {
                    node {
                      mimeType
                      fileSize
                      blurhash
                      height
                      width
                      originalUri
                      original
                      thumbnail
                      medium
                      large
                      predominantColor
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response-2 "Direct link to Example Response")

```js
{
  "data": {
    "portfolioV2": {
      "nftBalances": {
        "totalBalanceUSD": 7330.6878496656,
        "totalTokensOwned": "31134",
        "byToken": {
          "edges": [\
            {\
              "node": {\
                "lastReceived": 1734041699000,\
                "token": {\
                  "tokenId": "10407",\
                  "name": "Lil Pudgy #10407",\
                  "description": "Lil Pudgys are a collection of 22,222 randomly generated NFTs minted on Ethereum.",\
                  "supply": "1",\
                  "circulatingSupply": "1",\
                  "estimatedValue": {\
                    "valueUsd": 2671.701185940551,\
                    "valueWithDenomination": 1.4814883824848697,\
                    "denomination": {\
                      "address": "0x0000000000000000000000000000000000000000",\
                      "symbol": "ETH",\
                      "network": "ethereum"\
                    }\
                  },\
                  "collection": {\
                    "network": "ETHEREUM_MAINNET",\
                    "address": "0x524cab2ec69124574082676e6f654a18df49a048",\
                    "name": "LilPudgys",\
                    "type": "GENERAL",\
                    "deployer": "0xe9da256a28630efdc637bfd4c65f0887be1aeda8",\
                    "deployedAt": 1639933745000,\
                    "owner": "0xe9da256a28630efdc637bfd4c65f0887be1aeda8",\
                    "medias": {\
                      "logo": {\
                        "mimeType": "image/png",\
                        "fileSize": 5962,\
                        "blurhash": "URHyw=WZ0stTN2j?xuWD0ut8^aj[?vWYIUt6",\
                        "height": 250,\
                        "width": 250,\
                        "originalUri": "https://storage.googleapis.com/zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png",\
                        "original": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&checksum=VklwQoOgHYKsPj8GPZ1FDTXN8hPPSaVBjHCmiQ7vZy8",\
                        "large": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=500&checksum=NlRY3lUeBcOFw3CzxcAGAQKxOLw3JhreqJ38BZTC9D0",\
                        "medium": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=250&checksum=VPxH2Ejt_0dOcWCesNcsfQYZgcGYPIFERQexdytLyP0",\
                        "thumbnail": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x524cab2ec69124574082676e6f654a18df49a048/logo.png&width=100&checksum=BFebU_PxxIAdlqld0-cJ_M0bjMTd3qTBRdFx02pBX5M",\
                        "predominantColor": "#9ab3ed"\
                      }\
                    }\
                  },\
                  "mediasV3": {\
                    "images": {\
                      "edges": [\
                        {\
                          "node": {\
                            "mimeType": "image/png",\
                            "fileSize": 181886,\
                            "blurhash": "UPQ4c{$j_$+^{0n%CRX8s;jtS0bFtlbHv#n%",\
                            "height": 2700,\
                            "width": 2700,\
                            "originalUri": "https://api.pudgypenguins.io/lil/image/10407",\
                            "original": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&checksum=fRHieiOCQj_0piw8VZc-HDP-f5Uy8cl4p99Dx-66ycM",\
                            "thumbnail": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=100&checksum=oDAXzMIzWvlGOLbb1nN8IWKl4_B26B840wd6CXwhSWw",\
                            "medium": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=250&checksum=jiyBP_I0JxBPasrg273qHzkTPOfnzRyMCdHakPTV-vk",\
                            "large": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/fa856d9f7907ea90f93067a80cfe2a84be04242e834306ddcbe25876438a8684.png&width=500&checksum=Ndb7k_Uoscl4oQ8vjoCCLljQcDG7BvtTV-SQ6w6JDRM",\
                            "predominantColor": "#e35063"\
                          }\
                        }\
                      ]\
                    }\
                  }\
                }\
              }\
            },\
            {\
              "node": {\
                "lastReceived": 1734390407000,\
                "token": {\
                  "tokenId": "11410",\
                  "name": "Opepen 11410",\
                  "description": "This artwork may or may not be handmade.",\
                  "supply": "1",\
                  "circulatingSupply": "1",\
                  "estimatedValue": {\
                    "valueUsd": 458.7449105987138,\
                    "valueWithDenomination": 0.2543792169395613,\
                    "denomination": {\
                      "address": "0x0000000000000000000000000000000000000000",\
                      "symbol": "ETH",\
                      "network": "ethereum"\
                    }\
                  },\
                  "collection": {\
                    "network": "ETHEREUM_MAINNET",\
                    "address": "0x6339e5e072086621540d0362c4e3cea0d643e114",\
                    "name": "Opepen Edition",\
                    "type": "GENERAL",\
                    "deployer": "0xf74b146ce44cc162b601dec3be331784db111dc1",\
                    "deployedAt": 1673205671000,\
                    "owner": "0xc8f8e2f59dd95ff67c3d39109eca2e2a017d4c8a",\
                    "medias": {\
                      "logo": {\
                        "mimeType": "image/png",\
                        "fileSize": 13075,\
                        "blurhash": "USFsZ5?wWBj]%NWBWBofa#Riaef6ogazayj[",\
                        "height": 250,\
                        "width": 250,\
                        "originalUri": "https://storage.googleapis.com/zapper-fi-assets/nfts/collections/ethereum/0x6339e5e072086621540d0362c4e3cea0d643e114/logo.png",\
                        "original": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x6339e5e072086621540d0362c4e3cea0d643e114/logo.png&checksum=rc8N2fjdu3WxsdZAkJK2NuTJ_ZWfQyn3DpIngJ4oMX8",\
                        "large": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x6339e5e072086621540d0362c4e3cea0d643e114/logo.png&width=500&checksum=pOMoxeVP5zir59MtGm692O8j2MGyJzh0g_dxzoaiBAM",\
                        "medium": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x6339e5e072086621540d0362c4e3cea0d643e114/logo.png&width=250&checksum=0xvI1F84R9aW5NeNLJJGlJ8EdjRF2ZDWzT5hM9y-guY",\
                        "thumbnail": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/collections/ethereum/0x6339e5e072086621540d0362c4e3cea0d643e114/logo.png&width=100&checksum=kepZS3NVGOfheaxy4Hq9bKwqjDeyqSLaC42dmxASbd0",\
                        "predominantColor": "#8897a9"\
                      }\
                    }\
                  },\
                  "mediasV3": {\
                    "images": {\
                      "edges": [\
                        {\
                          "node": {\
                            "mimeType": "image/png",\
                            "fileSize": 28712,\
                            "blurhash": "U03l5Ot700M{D%Rj-;WB00Rj~qay00Rj_3ay",\
                            "height": 1400,\
                            "width": 1400,\
                            "originalUri": "ipfs://QmVXvZ5Sp6aSDBrWvtJ5gZ3bwNWRqqY3iPvyF8nveWj5HF/40.png",\
                            "original": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/19c1f0ba5396e3fd79b06122557eb81924f1b8a782d731e616d54576ed4e1317.png&checksum=aZqb1HchmOlEo-5jrdn7kKojpyllaESyBm2KFmXCUvc",\
                            "thumbnail": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/19c1f0ba5396e3fd79b06122557eb81924f1b8a782d731e616d54576ed4e1317.png&width=100&checksum=1LDcOITKGytwQuG6EnfFOZV9Z_kiiFjCL9Bn4klYW9I",\
                            "medium": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/19c1f0ba5396e3fd79b06122557eb81924f1b8a782d731e616d54576ed4e1317.png&width=250&checksum=dlYO9zWHV0YdHKPeuyapwm6ZouiwbVkUsSTUPiZiAfk",\
                            "large": "https://images.zapper.xyz/z/?path=zapper-fi-assets/nfts/medias/19c1f0ba5396e3fd79b06122557eb81924f1b8a782d731e616d54576ed4e1317.png&width=500&checksum=4ICCFrmEAAeSAnAMFwnvb4RgIAXLwI3Bp8wCMIMGyl4",\
                            "predominantColor": "#1f1f1f"\
                          }\
                        }\
                      ]\
                    }\
                  }\
                }\
              }\
            }\
          ]\
        }\
      }\
    }\
  }\
}\
```\
\
#### Flexible Ordering [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#flexible-ordering "Direct link to Flexible Ordering")\
\
```json\
{\
  "by": "USD_WORTH"    // Orders NFTs by their USD value (default)\
  // OR\
  "by": "LAST_RECEIVED"  // Orders NFTs by when they were last received\
}\
```\
\
#### byNetwork [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#bynetwork "Direct link to byNetwork")\
\
View NFT balances grouped by chain with optional ordering and filtering:\
\
```graphql\
byNetwork(\
  first: Int = 25,\
  after: String,\
  filters: {\
    minBalanceUSD: Float,    // Minimum USD value threshold\
    hidden: Boolean,         // Include/exclude hidden NFTs\
    chainId: Int         // Filter by specific chain\
  },\
  order: {\
    by: PortfolioV2NftOrderByOption  // USD_WORTH or LAST_RECEIVED\
  }\
)\
```\
\
#### byCollection [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#bycollection "Direct link to byCollection")\
\
View NFT balances grouped by collection with additional filtering options:\
\
```graphql\
byCollection(\
  first: Int = 25,\
  after: String,\
  filters: {\
    collectionName: String,      // Filter by collection name\
    hidden: Boolean,             // Include/exclude hidden NFTs\
    chainId: Int             // Filter by specific chain\
  },\
  order: {\
    by: PortfolioV2NftOrderByOption  // USD_WORTH or LAST_RECEIVED\
  }\
)\
```\
\
#### byToken [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#bytoken "Direct link to byToken")\
\
Access individual NFT tokens with detailed filtering options:\
\
```graphql\
byToken(\
  first: Int = 25,\
  after: String,\
  filters: {\
    hidden: Boolean,             // Include/exclude hidden NFTs\
    chainId: Int             // Filter by specific chain\
  },\
  order: {\
    by: PortfolioV2NftOrderByOption  // USD_WORTH or LAST_RECEIVED\
  }\
)\
```\
\
#### Common Filter Options [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#common-filter-options "Direct link to Common Filter Options")\
\
All query methods support these common filtering parameters:\
\
| Parameter | Type | Description |\
| --- | --- | --- |\
| `hidden` | Boolean | When true, returns only NFTs marked as hidden by the user |\
| `chainId` | Int | Filter NFTs by a specific blockchain network |\
| `collections` | - | Input an address and chainId to NFTs from a specific collection |\
\
#### Filter by specific collections [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#filter-by-specific-collections "Direct link to Filter by specific collections")\
\
```graphql\
{\
  "addresses": ["0x3d280fde2ddb59323c891cf30995e1862510342f"],\
  "first": 10,\
  "filters": {\
    "collections": [\
      {\
        "address": "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",\
        "chainId": 1\
      }\
    ]\
  }\
}\
```\
\
#### Best Practices [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#best-practices-1 "Direct link to Best Practices")\
\
1. **Use order by value for portfolio displays**: Sort by `USD_WORTH` for financial portfolio views\
2. **Use order by time for activity views**: Sort by `LAST_RECEIVED` when showing recent acquisitions\
3. **Handle low-value NFTs**: Consider using `minBalanceUSD` to filter out low-value or unsellable NFTs\
\
### 4\. Portfolio Totals [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#4-portfolio-totals "Direct link to 4. Portfolio Totals")\
\
Get aggregated portfolio values and breakdowns with `portfolioV2` by using the `totalBalanceUSD` fields from different sections:\
\
[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAAoR4oBmEANgJYQBqATACoQoCGNAzgBQASTmDB4EPHuPREA2gEERYiQEIAusoA0RAZTp4eKaQElUASiLAAOkiJEADuSq0GLPsNHjJPaUMWfx5lY2tkQAxETsANbIRABG3JxIUOJEKBzc1iGpENFIAEIJSSlBWbZpXDQFNInJAKoAygAimaUtWeEAcggoAO7kkXFinJGQPTbUeNm5PG0hsQRdvf18uvqG2qsGgbNZCGAA5sU7pUgQYAgWx6VESN19eAMl189InIhXzzw0MPsf11AAC04dCQRjAfxCAF8IbZ4tUig1msFnkRocjSmjrpiobNOgAxVhxQrJHjZCqzJCUFBVGpHdFldKVYkIRHWY6dO79QYIYajcbkIgdAkzelxBach4rPQGHybFDbUW2PaHUlPFGnc6XRUnCWPGEhV7vbXXL4-fW2QHA0Hg40422w5ms23YrHHF2o2a4ohyOx2InwklEPgIAB0%2BxDWkaCDxdHsEAMDCQPHM5Qy6M4vppRVVx1TTIDLKax3Zgt13N5EDGRAmRAzfocPDoKETIuu80W90iUrWsul8q1KOVdJRtg1FzVI9uSweA5HWUNCHNRFNv3tIUtILB%2BvdKLhtKdc53dtd6LRLTRkJAGhAADdOHg6JxYjRxBgQE9LCB3EovJ-pDJPRAAAGAAPAAOAAWABOABGABWGCwAAdjAIDYkoGDKAAZgg2IkKAsA4KgYQEOgsBmDAqAoGYLCgLA9CYM-FpVA0FpPzlP8iGYIDrEva8AR5c59DfKwQDkGAUABcg6AAL04ZsICQP9PwKRsoCIABZAAregNNYKAZIALVYIwUEMxoACU6AATQIICgPM-YIIAGQAdQAKRoPSAEUUA6ABxbyCG0vEaA6HSaGskyZIAXhiz9L0hIA)\
\
#### Key Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-fields-2 "Direct link to Key Fields")\
\
- `tokenBalances.totalBalanceUSD`: Total value of token balances\
- `appBalances.totalBalanceUSD`: Total value of app positions\
- `nftBalances.totalBalanceUSD`: Total value of NFTs\
- `byNetwork`: Network breakdowns available in `tokenBalances`, `appBalances`, and `nftBalances`\
- `byAccount`: Account breakdowns\
- `byToken`: Token-specific breakdowns (in `appBalances`)\
- `byMetaType`: Type-specific breakdowns (in `appBalances`, includes CLAIMABLE tokens)\
\
#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables-3 "Direct link to Example Variables")\
\
```js\
{\
  "addresses": ["0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"],\
  "first": 20\
}\
```\
\
#### Example Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-query-2 "Direct link to Example Query")\
\
```graphql\
query PortfolioV2Totals($addresses: [Address!]!, $first: Int) {\
  portfolioV2(addresses: $addresses) {\
    # Token balances total\
    tokenBalances {\
      totalBalanceUSD\
      # Network breakdown for tokens\
      byNetwork(first: $first) {\
        edges {\
          node {\
            network {\
              name\
              slug\
              chainId\
            }\
            balanceUSD\
          }\
        }\
      }\
    }\
\
    # NFT balances total\
    nftBalances {\
      totalBalanceUSD\
      # Network breakdown for NFTs\
      byNetwork(first: $first) {\
        edges {\
          node {\
            network {\
              name\
              slug\
              chainId\
            }\
            balanceUSD\
          }\
        }\
      }\
    }\
\
    # App balances (e.g., DeFi postions) total\
    appBalances {\
      totalBalanceUSD\
      # Network breakdown for app positions\
      byNetwork(first: $first) {\
        edges {\
          node {\
            network {\
              name\
              slug\
              chainId\
            }\
            balanceUSD\
          }\
        }\
      }\
    }\
  }\
}\
```\
\
#### Getting Overall Portfolio Value [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#getting-overall-portfolio-value "Direct link to Getting Overall Portfolio Value")\
\
To get an aggregate net worth of a portfolio sum the `totalBalanceUSD` from `tokenBalances`, `appBalances`, and `nftBalances`\
\
#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response-3 "Direct link to Example Response")\
\
```js\
{\
  "data": {\
    "portfolioV2": {\
      "tokenBalances": {\
        "totalBalanceUSD": 225590.09863164127,\
        "byNetwork": {\
          "edges": [\
            {\
              "node": {\
                "network": {\
                  "name": "Base",\
                  "slug": "base",\
                  "chainId": 8453\
                },\
                "balanceUSD": 221754.1899751895\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "ZKsync",\
                  "slug": "zksync",\
                  "chainId": 324\
                },\
                "balanceUSD": 1229.80913712\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "Optimism",\
                  "slug": "optimism",\
                  "chainId": 10\
                },\
                "balanceUSD": 975.3859591021923\
              }\
            }\
          ]\
        }\
      },\
      "nftBalances": {\
        "totalBalanceUSD": 62906.44492750787,\
        "byNetwork": {\
          "edges": [\
            {\
              "node": {\
                "network": {\
                  "name": "Base",\
                  "slug": "base",\
                  "chainId": 8453\
                },\
                "balanceUSD": 50749.39954198\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "Ethereum",\
                  "slug": "ethereum",\
                  "chainId": 1\
                },\
                "balanceUSD": 12117.4980912\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "Optimism",\
                  "slug": "optimism",\
                  "chainId": 10\
                },\
                "balanceUSD": 30.3182139\
              }\
            }\
          ]\
        }\
      },\
      "appBalances": {\
        "totalBalanceUSD": 4410.540131308049,\
        "byNetwork": {\
          "edges": [\
            {\
              "node": {\
                "network": {\
                  "name": "Base",\
                  "slug": "base",\
                  "chainId": 8453\
                },\
                "balanceUSD": 4393.335087708013\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "Ethereum",\
                  "slug": "ethereum",\
                  "chainId": 1\
                },\
                "balanceUSD": 16.714002810036998\
              }\
            },\
            {\
              "node": {\
                "network": {\
                  "name": "Polygon",\
                  "slug": "polygon",\
                  "chainId": 137\
                },\
                "balanceUSD": 0.49104079000000006\
              }\
            }\
          ]\
        }\
      }\
    }\
  }\
}\
```\
\
### 5\. Claimables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#5-claimables "Direct link to 5. Claimables")\
\
In `portfolioV2`, claimable tokens are now part of app positions with a `metaType` of "CLAIMABLE". You can access them through the app balances with token filters.\
\
[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAMIA2AhgJZwUBGZCAzgGoBMAFACQVhh7MmzdEQDaAQT4CmTAIQBdWQEoiwADpIiWogAcIeFADMIZKhHYde-QcKI8pNpivWbtWijp0AhCpSRRmVQ03NwBiIgBxBBQiDx0iOl8Kf0DksCIyCAgAayJjPCIoShp6RiIUHOQmYJCtOgJxTw5DKjwmFBEARgAGZxrarQQwAHNAlwGQpAgwBCDXCbc4uYWBsComHUoCADkKRH6V7SYyGGGDlYBfc4WkaIB3fVzxw7ckPYRrlePTz4Gr%2BcOiT8ASYzVa7S6vWWL20Q1GTGhMO0UxmiKR2gAdFiiBBNCRcSg8BQoCgAAoQJhUFBmJA%2BYGzZ7okJWaTVAFMupJFIAVQAygARX5IirZKpojnacIAGSyuXypCl4gAkgBZcReKUAUSIiBQFAAtCgCDoPuyJTrohQACrG03mkIi5Di%2B1ELEYnGaHxCK2VJDkynU3F05IBZ0u2IOGRC823FAPPDZaMSoEhu3hkIpnkCpMcpgEOB0Ew5pk6PBUALF9EzKAlMhs9Paf4Npsulv2tYbLakvAQHQIxkuyh0BBkSsrErwsd-KduNvoucvBcLJe1FeN35Lucti4gAA0IAAbhQy6VmBgQM81CAWY4ryJRFfugAPAAcABYAJydACsnTAAHYwG6OhDE6QwAGY3zof9ujAb8oF4X9PzANgXygKA2HA7oXxAzor3kDQd33AALBBeHwJhz3UEBxBgFBiP0KgAC8KEDJA7yvL1yyIFUACtTBVK0oCYgAtK0lRQET%2BQAJSoABNAhum6KThjfKUAHUACkyEEgBFFBtgiXSCD4gAxMhtn4sg5PEpiAF47KvHcLiAA)\
\
#### Key Fields [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#key-fields-3 "Direct link to Key Fields")\
\
- `metaType`: Used to identify "CLAIMABLE" tokens within positions\
- `tokens`: Contains claimable tokens with their balance, value, and metadata\
- `balanceUSD`: Value of each claimable token\
\
#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables-4 "Direct link to Example Variables")\
\
```js\
{\
  "addresses": ["0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"],\
  "first": 5\
}\
```\
\
#### Example Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-query-3 "Direct link to Example Query")\
\
```graphql\
query ClaimablesV2($addresses: [Address!]!) {\
  portfolioV2(addresses: $addresses) {\
    appBalances {\
      # Get app balances and look for claimable tokens\
      byApp(first: 10) {\
        edges {\
          node {\
            app {\
              displayName\
              slug\
            }\
            network {\
              name\
              slug\
            }\
            balances(first: 10) {\
              edges {\
                node {\
                  ... on ContractPositionBalance {\
                    address\
                    balanceUSD\
                    tokens {\
                      # Look for CLAIMABLE meta-type\
                      metaType\
                      token {\
                        ... on BaseTokenPositionBalance {\
                          address\
                          network\
                          balance\
                          balanceUSD\
                          symbol\
                          price\
                          decimals\
                        }\
                      }\
                    }\
                    displayProps {\
                      label\
                      images\
                    }\
                  }\
                }\
              }\
            }\
          }\
        }\
      }\
    }\
  }\
}\
```\
\
#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response-4 "Direct link to Example Response")\
\
```js\
{\
    "data": {\
      "portfolioV2": {\
        "appBalances": {\
          "byApp": {\
            "edges": [\
              {\
                "node": {\
                  "app": {\
                    "displayName": "Uniswap V3",\
                    "slug": "uniswap-v3"\
                  },\
                  "network": {\
                    "name": "Base",\
                    "slug": "base"\
                  },\
                  "balances": {\
                    "edges": [\
                      {\
                        "node": {\
                          "address": "0x03a520b32c04bf3beef7beb72e919cf822ed34f1",\
                          "balanceUSD": 290.2802431386432,\
                          "tokens": [\
                            {\
                              "metaType": "SUPPLIED",\
                              "token": {\
                                "address": "0x00000000000007c8612ba63df8ddefd9e6077c97",\
                                "network": "BASE_MAINNET",\
                                "balance": "29351.972884702704",\
                                "balanceUSD": 238.5238178121461,\
                                "symbol": "⌘",\
                                "price": 0.00812633,\
                                "decimals": 18\
                              }\
                            },\
                            {\
                              "metaType": "SUPPLIED",\
                              "token": {\
                                "address": "0x4200000000000000000000000000000000000006",\
                                "network": "BASE_MAINNET",\
                                "balance": "0",\
                                "balanceUSD": 0,\
                                "symbol": "WETH",\
                                "price": 1872.93,\
                                "decimals": 18\
                              }\
                            },\
                            {\
                              "metaType": "CLAIMABLE",\
                              "token": {\
                                "address": "0x00000000000007c8612ba63df8ddefd9e6077c97",\
                                "network": "BASE_MAINNET",\
                                "balance": "1069.849937435888",\
                                "balanceUSD": 8.693953642083379,\
                                "symbol": "⌘",\
                                "price": 0.00812633,\
                                "decimals": 18\
                              }\
                            },\
                            {\
                              "metaType": "CLAIMABLE",\
                              "token": {\
                                "address": "0x4200000000000000000000000000000000000006",\
                                "network": "BASE_MAINNET",\
                                "balance": "0.022992034771408265",\
                                "balanceUSD": 43.06247168441369,\
                                "symbol": "WETH",\
                                "price": 1872.93,\
                                "decimals": 18\
                              }\
                            }\
                          ],\
                          "displayProps": {\
                            "label": "⌘ / WETH (Token ID: 1568607)",\
                            "images": [\
                              "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x00000000000007c8612ba63df8ddefd9e6077c97.png",\
                              "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x4200000000000000000000000000000000000006.png",\
                              "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x00000000000007c8612ba63df8ddefd9e6077c97.png",\
                              "https://storage.googleapis.com/zapper-fi-assets/tokens/base/0x4200000000000000000000000000000000000006.png"\
                            ]\
                          }\
                        }\
                      }\
                    ]\
                  }\
                }\
              },\
            ]\
          }\
        }\
      }\
    }\
  }\
```\
\
1. Use the `byApp` query to see claimable tokens in the context of their specific apps, filtering for tokens with `metaType: "CLAIMABLE"`\
\
For applications building on top of this data, you'll typically want to:\
\
1. Extract all tokens with `metaType: "CLAIMABLE"` from the app balances\
2. Present the user with a view of what they can claim, grouped by app or by token\
\
### 6\. App Balances By Type [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#6-app-balances-by-type "Direct link to 6. App Balances By Type")\
\
Get total balances by `metaType` (e.g, CLAIMABLE, SUPPLIED, BORROWED, etc.)\
\
[Test query in sandboxArrow pointing right](https://build.zapper.xyz/sandbox?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAEJ4ICGA1pAO5IkEAqBADggBQAkFYY5AZwEIB6IgG0Agn0ECAhAF05AGiJcAZgEs8AlGICSqAJRFgAHSRErRVhDwp1EADaaIANQBMHXvxHDRaj6yIibmltZWFKysJBROFEhQIqYWEREAxEQA4ggoRFGsRCgQKHFEAEZxCUkCFcQAsrkULOypaVblBI2lLZxaOnpq-bqhbe1WxaVOAMIQMKhj4whgAObJYeNpSBBgCCnhmxGIPWwIi4c2EAKaKK5Is-Mo54eV8YkIAKoAygAiz%2B0AX3%2B1iBBzSoMBiwhRABIGUIAAbhQ8JoKOUnCIMCANkQzCAgn4RHixOJFniAAwADwAHAAWACcAEYAKyMsAAdjA5PK6kZ6gAzLTyuzyWBmVBeKyGWAPNSoFAPPzydSeYy8W0FMo2njhk8MERGeSLLD4QALSi7HRY8wgSQwFCmuyaABeFFuECQxLxsWuUCI9QAVi56kwoM6AFpMfQocM-ABKmgAmgRyeTYytaQAZADqACknCGAIooAByWULXQDADEnCWg05E1HnQBeZt42EAoA)\
\
#### Balance Types [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#balance-types "Direct link to Balance Types")\
\
- `metaType`: Used to identify the type of position\
- `positionCount`: The number of positions with a given type\
- `balanceUSD`: The total value in USD of positions with a given type\
\
```graphql\
enum metaType {\
  SUPPLIED # Assets supplied to lending protocols\
  BORROWED # Assets borrowed from lending protocols\
  CLAIMABLE # Assets available to claim (rewards, airdrops, etc.)\
  VESTING # Assets locked in vesting schedule\
  LOCKED # Assets locked or staked in protocols\
  NFT # Non-fungible token positions\
  WALLET # Deposits in a wallet application\
}\
```\
\
#### Example Variables [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-variables-5 "Direct link to Example Variables")\
\
```js\
{\
  "addresses": ["0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1"],\
  "first": 10\
}\
```\
\
#### Example Query [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-query-4 "Direct link to Example Query")\
\
```graphql\
query BreakdownByType($addresses: [Address!]!, $first: Int) {\
  portfolioV2(addresses: $addresses) {\
    appBalances {\
      # Get app total balances by MetaType\
      byMetaType(first: $first) {\
        totalCount\
        edges {\
          node {\
            metaType\
            positionCount\
            balanceUSD\
          }\
        }\
      }\
    }\
  }\
}\
```\
\
#### Example Response [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#example-response-5 "Direct link to Example Response")\
\
```js\
{\
  "data": {\
    "portfolioV2": {\
      "appBalances": {\
        "byMetaType": {\
          "totalCount": 4,\
          "edges": [\
            {\
              "node": {\
                "metaType": "SUPPLIED",\
                "positionCount": 9,\
                "balanceUSD": 2440.56541427308\
              }\
            },\
            {\
              "node": {\
                "metaType": "LOCKED",\
                "positionCount": 1,\
                "balanceUSD": 1217.68061929713\
              }\
            },\
            {\
              "node": {\
                "metaType": "CLAIMABLE",\
                "positionCount": 3,\
                "balanceUSD": 755.86366790903\
              }\
            },\
            {\
              "node": {\
                "metaType": "BORROWED",\
                "positionCount": 1,\
                "balanceUSD": -5.371015208905\
              }\
            }\
          ]\
        }\
      }\
    }\
  }\
}\
```\
\
## Best Practices [​](https://build.zapper.xyz/docs/api/endpoints/portfolio\#best-practices-2 "Direct link to Best Practices")\
\
1. Always specify required fields to minimize response size\
2. Use network filters when you only need specific chains\
3. Consider caching responses based on the `updatedAt` timestamp\
4. Handle NFT valuations appropriately based on your use case\
\
Remember that the portfolio query is highly flexible - you can request as much or as little data as needed for your specific use case.\
\
CopyCopy page for LLMsToggle menu\
\
[Edit this page](https://github.com/Zapper-fi/protocol/tree/main/docs/api/endpoints/portfolio.md)\
\
[Previous\\
\\
For Agents & LLMs](https://build.zapper.xyz/docs/api/agents) [Next\\
\\
Token Prices & Charts](https://build.zapper.xyz/docs/api/endpoints/onchain-prices)\
\
- [Overview](https://build.zapper.xyz/docs/api/endpoints/portfolio#overview)\
- [Portfolio Fields](https://build.zapper.xyz/docs/api/endpoints/portfolio#portfolio-fields)\
  - [`tokenBalances`](https://build.zapper.xyz/docs/api/endpoints/portfolio#tokenbalances)\
  - [`appBalances`](https://build.zapper.xyz/docs/api/endpoints/portfolio#appbalances)\
  - [`nftBalances`](https://build.zapper.xyz/docs/api/endpoints/portfolio#nftbalances)\
  - [4\. Portfolio Totals](https://build.zapper.xyz/docs/api/endpoints/portfolio#4-portfolio-totals)\
  - [5\. Claimables](https://build.zapper.xyz/docs/api/endpoints/portfolio#5-claimables)\
  - [6\. App Balances By Type](https://build.zapper.xyz/docs/api/endpoints/portfolio#6-app-balances-by-type)\
- [Best Practices](https://build.zapper.xyz/docs/api/endpoints/portfolio#best-practices-2)\
\
[API Status](https://status.zapper.xyz/)· [X](https://x.com/zapper_fi)· [Farcaster](https://farcaster.xyz/zapper)· [Discord](https://zapper.xyz/discord)· [Contact Us](https://build.zapper.xyz/contact)· [API Support](https://build.zapper.xyz/support)· [Terms & Conditions](https://build.zapper.xyz/terms)\
\
© Zapper 2026\
\
Wallet · Privy