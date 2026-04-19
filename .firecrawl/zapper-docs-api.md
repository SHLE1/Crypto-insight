![](https://zapper.xyz/logo192.png)

[Skip to main content](https://build.zapper.xyz/docs/api/#__docusaurus_skipToContent_fallback)

[![Zapper Logo](https://build.zapper.xyz/img/logo-dark.png)](https://build.zapper.xyz/)

[Discover](https://build.zapper.xyz/docs/api/#)

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

- [API](https://build.zapper.xyz/docs/api/#)

  - [Getting Started](https://build.zapper.xyz/docs/api/)
  - [x402](https://build.zapper.xyz/docs/api/#)

  - [Skill](https://build.zapper.xyz/docs/api/#)

  - [For Agents & LLMs](https://build.zapper.xyz/docs/api/agents)
  - [Endpoints](https://build.zapper.xyz/docs/api/#)

    - [Portfolio Data](https://build.zapper.xyz/docs/api/endpoints/portfolio)
    - [Token Prices & Charts](https://build.zapper.xyz/docs/api/endpoints/onchain-prices)
    - [Transactions](https://build.zapper.xyz/docs/api/#)

    - [Rankings](https://build.zapper.xyz/docs/api/#)

    - [NFTs](https://build.zapper.xyz/docs/api/#)

    - [Account Identity](https://build.zapper.xyz/docs/api/endpoints/onchain-identity)
    - [Farcaster](https://build.zapper.xyz/docs/api/#)

    - [Search](https://build.zapper.xyz/docs/api/endpoints/search)
    - [Utility](https://build.zapper.xyz/docs/api/#)

    - [Portfolio Charts](https://build.zapper.xyz/docs/api/endpoints/portfolio-charts)
  - [Supported Chains](https://build.zapper.xyz/docs/api/supported-chains)
  - [Resources](https://build.zapper.xyz/docs/api/#)
- [Interpretation](https://build.zapper.xyz/docs/api/#)


- [Home page](https://build.zapper.xyz/)
- API
- Getting Started

On this page

# Getting Started

Access powerful onchain data across 60+ chains with a GraphQL API.

[**Portfolio Data** \\
\\
Token balances, DeFi, and NFTs in a single call across 60+ chains.](https://build.zapper.xyz/docs/api/endpoints/portfolio) [**Token Prices & Charts** \\
\\
A price for every token that has an onchain market, including historical data.](https://build.zapper.xyz/docs/api/endpoints/onchain-prices) [**Human-Readable Transactions** \\
\\
Build rich transaction views with simple and human-friendly descriptions.](https://build.zapper.xyz/docs/api/endpoints/human-readable-transactions/transaction-history) [**Onchain Search** \\
\\
Comprehensive search results across multiple chains and entity types with a single query.](https://build.zapper.xyz/docs/api/endpoints/search) [**NFTs** \\
\\
Rich NFT metadata with media, traits, holders, valuations and more.](https://build.zapper.xyz/docs/api/endpoints/nft-queries/nft-collections) [**Account Identity** \\
\\
Surface identity primitives such as avatars, ENS, Basenames, Farcaster, and Lens.](https://build.zapper.xyz/docs/api/endpoints/onchain-identity) [![Farcaster](https://build.zapper.xyz/img/assets/farcaster-dark.png)![Farcaster](https://build.zapper.xyz/img/assets/farcaster.png)\\
\\
**Farcaster** \\
\\
Complete onchain portfolio & transaction history for any Farcaster user](https://build.zapper.xyz/docs/api/endpoints/farcaster/farcaster-portfolio)

## Quickstart [​](https://build.zapper.xyz/docs/api/\#quickstart "Direct link to Quickstart")

### 1) Get an API key [​](https://build.zapper.xyz/docs/api/\#1-get-an-api-key "Direct link to 1) Get an API key")

Get Your API Key

### 2) Start building [​](https://build.zapper.xyz/docs/api/\#2-start-building "Direct link to 2) Start building")

Below are examples for working with the Zapper API across different languages and frameworks. Each example shows how to fetch portfolio data for provided addresses, across the chosen chains. Additionally, our [API Sandbox](https://build.zapper.xyz/sandbox) lets you try our endpoints in one click.

If you are working with an AI agent, we also recommend providing our [customized prompt](https://build.zapper.xyz/docs/api/agents) to start building efficiently.

- React
- Node.js
- cURL
- Python
- Ruby

#### Setup [​](https://build.zapper.xyz/docs/api/\#setup "Direct link to Setup")

1. Create new React project: `npm create vite@latest my-app -- --template react-ts`
2. Navigate to your new directory : `cd my-app`
3. Install dependencies: `npm install @apollo/client graphql`
4. Replace `src/App.tsx` with code below
5. Replace YOUR\_API\_KEY with your actual key
6. Run: `npm run dev`

New to React? [Get started with Create React App](https://create-react-app.dev/docs/getting-started) or [Next.js](https://nextjs.org/docs/getting-started).

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, gql, useQuery, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

interface TokenNode {
  balance: number;
  balanceRaw: string;
  balanceUSD: number;
  symbol: string;
  name: string;
}

interface TokenEdge {
  node: TokenNode;
}

interface PortfolioV2Data {
  portfolioV2: {
    tokenBalances: {
      byToken: {
        edges: TokenEdge[];
      }
    }
  };
}

// Set up Apollo Client
const httpLink = createHttpLink({
  uri: 'https://public.zapper.xyz/graphql',
});

const API_KEY = 'YOUR_API_KEY';

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-zapper-api-key': API_KEY,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const PortfolioV2Query = gql`
  query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
    portfolioV2(addresses: $addresses, networks: $networks) {
      tokenBalances {
        byToken {
          edges {
            node {
              balance
              balanceRaw
              balanceUSD
              symbol
              name
            }
          }
        }
      }
    }
  }
`;

function Portfolio() {
  const { loading, error, data } = useQuery<PortfolioV2Data>(PortfolioV2Query, {
    variables: {
      addresses: ['0x3d280fde2ddb59323c891cf30995e1862510342f'],
      networks: ['ETHEREUM_MAINNET'],
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data found</div>;

  return (
    <div className="p-4">
      {data.portfolioV2.tokenBalances.byToken.edges.map((edge, index) => (
        <div key={`${edge.node.symbol}-${index}`} className="mb-4 p-4 border rounded">
          <p>Token: {edge.node.name}</p>
          <p>Symbol: {edge.node.symbol}</p>
          <p>Balance: {edge.node.balance}</p>
          <p>Raw Balance: {edge.node.balanceRaw}</p>
          <p>Value (USD): ${edge.node.balanceUSD.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Portfolio />
    </ApolloProvider>
  );
}

export default App;
```

#### Setup [​](https://build.zapper.xyz/docs/api/\#setup-1 "Direct link to Setup")

1. Create new directory and enter it
2. Run `npm init -y`
3. Install axios: `npm install axios`
4. Create `index.js` with code below
5. Replace YOUR\_API\_KEY
6. Run: `node index.js`

New to Node.js? [Get started with the official guide](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs).

```javascript
const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';

const query = `
  query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
    portfolioV2(addresses: $addresses, networks: $networks) {
      tokenBalances {
        byToken {
          edges {
            node {
              balance
              balanceRaw
              balanceUSD
              symbol
              name
            }
          }
        }
      }
    }
  }
`;

async function fetchPortfolio() {
  try {
    const response = await axios({
      url: 'https://public.zapper.xyz/graphql',
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': API_KEY,
      },
      data: {
        query,
        variables: {
          addresses: ['0x3d280fde2ddb59323c891cf30995e1862510342f'],
          networks: ['ETHEREUM_MAINNET'],
        },
      },
    });

    if (response.data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Example usage
(async () => {
  try {
    const portfolioData = await fetchPortfolio();
    console.log('Portfolio data:');

    const tokens = portfolioData.portfolioV2.tokenBalances.byToken.edges;
    tokens.forEach((edge, index) => {
      const token = edge.node;
      console.log(`\n--- Token ${index + 1} ---`);
      console.log(`Name: ${token.name}`);
      console.log(`Symbol: ${token.symbol}`);
      console.log(`Balance: ${token.balance}`);
      console.log(`Raw Balance: ${token.balanceRaw}`);
      console.log(`Value (USD): $${token.balanceUSD.toFixed(2)}`);
    });
  } catch (error) {
    console.error('Failed to fetch portfolio:', error.message);
    process.exit(1);
  }
})();
```

#### Setup [​](https://build.zapper.xyz/docs/api/\#setup-2 "Direct link to Setup")

cURL is usually pre-installed on Unix-based systems. For Windows, [download it here](https://curl.se/windows/).

```bash
API_KEY="YOUR_API_KEY"
```

Run the cURL command using your API key:

```bash
curl --location 'https://public.zapper.xyz/graphql' \
  --header 'Content-Type: application/json' \
  --header "x-zapper-api-key: $API_KEY" \
  --data '{"query":"query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) { portfolioV2(addresses: $addresses, networks: $networks) { tokenBalances { byToken { edges { node { balance balanceRaw balanceUSD symbol name } } } } } }","variables":{"addresses":["0x3d280fde2ddb59323c891cf30995e1862510342f"],"networks":["ETHEREUM_MAINNET"]}}'
```

#### Setup [​](https://build.zapper.xyz/docs/api/\#setup-3 "Direct link to Setup")

1. Create new directory: `mkdir python-portfolio && cd python-portfolio`
2. Create virtual environment: `python3 -m venv venv`
3. Activate virtual environment: `source venv/bin/activate`
4. Install requests: `pip install requests`
5. Create `portfolio.py` with code below
6. Replace YOUR\_API\_KEY
7. Run: `python portfolio.py`

New to Python? [Get started with the official tutorial](https://docs.python.org/3/tutorial/).

```python
import requests
from typing import Dict, Any

API_KEY = 'YOUR_API_KEY'

query = """
query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
  portfolioV2(addresses: $addresses, networks: $networks) {
    tokenBalances {
      byToken {
        edges {
          node {
            balance
            balanceRaw
            balanceUSD
            symbol
            name
          }
        }
      }
    }
  }
}
"""

def fetch_portfolio() -> Dict[str, Any]:
    try:
        response = requests.post(
            'https://public.zapper.xyz/graphql',
            headers={
                'Content-Type': 'application/json',
                'x-zapper-api-key': API_KEY
            },
            json={
                'query': query,
                'variables': {
                    'addresses': ['0x3d280fde2ddb59323c891cf30995e1862510342f'],
                    'networks': ['ETHEREUM_MAINNET']
                }
            },
            timeout=30
        )

        response.raise_for_status()
        data = response.json()

        if 'errors' in data:
            raise ValueError(f"GraphQL Errors: {data['errors']}")

        return data['data']

    except requests.RequestException as e:
        print(f"Request failed: {e}")
        raise
    except ValueError as e:
        print(f"Data validation failed: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    try:
        portfolio_data = fetch_portfolio()
        print("Portfolio data:")

        tokens = portfolio_data['portfolioV2']['tokenBalances']['byToken']['edges']
        for i, edge in enumerate(tokens):
            token = edge['node']
            print(f"\n--- Token {i + 1} ---")
            print(f"Name: {token['name']}")
            print(f"Symbol: {token['symbol']}")
            print(f"Balance: {token['balance']}")
            print(f"Raw Balance: {token['balanceRaw']}")
            print(f"Value (USD): ${token['balanceUSD']:.2f}")
    except Exception as e:
        print(f"Failed to fetch portfolio: {e}")
```

#### Setup [​](https://build.zapper.xyz/docs/api/\#setup-4 "Direct link to Setup")

1. Install Ruby if not installed: `brew install ruby` (macOS) or follow [Ruby installation guide](https://www.ruby-lang.org/en/documentation/installation/)
2. Create new directory: `mkdir ruby-portfolio && cd ruby-portfolio`
3. Create `portfolio.rb` with code below
4. Replace YOUR\_API\_KEY
5. Run: `ruby portfolio.rb`

New to Ruby? [Get started with Ruby in 20 minutes](https://www.ruby-lang.org/en/documentation/quickstart/).

```ruby
require 'net/http'
require 'uri'
require 'json'

API_KEY = 'YOUR_API_KEY'

query = <<-GRAPHQL
  query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
    portfolioV2(addresses: $addresses, networks: $networks) {
      tokenBalances {
        byToken {
          edges {
            node {
              balance
              balanceRaw
              balanceUSD
              symbol
              name
            }
          }
        }
      }
    }
  }
GRAPHQL

def fetch_portfolio
  uri = URI('https://public.zapper.xyz/graphql')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  http.read_timeout = 30
  http.open_timeout = 30

  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request['x-zapper-api-key'] = API_KEY
  request.body = {
    query: query,
    variables: {
      addresses: ['0x3d280fde2ddb59323c891cf30995e1862510342f'],
      networks: ['ETHEREUM_MAINNET']
    }
  }.to_json

  response = http.request(request)

  unless response.is_a?(Net::HTTPSuccess)
    raise "HTTP Request failed: #{response.code} - #{response.message}"
  end

  data = JSON.parse(response.body)

  if data['errors']
    raise "GraphQL Errors: #{data['errors']}"
  end

  data['data']
rescue JSON::ParserError => e
  raise "Failed to parse JSON response: #{e.message}"
rescue StandardError => e
  raise "Error fetching portfolio: #{e.message}"
end

begin
  portfolio = fetch_portfolio
  puts "Portfolio data:"

  tokens = portfolio['portfolioV2']['tokenBalances']['byToken']['edges']
  tokens.each_with_index do |edge, index|
    token = edge['node']
    puts "\n--- Token #{index + 1} ---"
    puts "Name: #{token['name']}"
    puts "Symbol: #{token['symbol']}"
    puts "Balance: #{token['balance']}"
    puts "Raw Balance: #{token['balanceRaw']}"
    puts "Value (USD): $#{format('%.2f', token['balanceUSD'])}"
  end
rescue StandardError => e
  puts "Failed to fetch portfolio: #{e.message}"
  exit 1
end
```

### 3) Subscribe or purchase credits [​](https://build.zapper.xyz/docs/api/\#3-subscribe-or-purchase-credits "Direct link to 3) Subscribe or purchase credits")

The Zapper API uses a subscription model, along with the possibility of purchasing credits as you go. Each query made costs a certain amount of credits, which can be found by visiting [Pricing](https://build.zapper.xyz/pricing). Subscriptions offer the best cost-per-credit value, at around 70% savings compared to purchasing credits as you go.

For most clients, we recommend subscribing to one of the available plans before going into production or for any substantial API usage.

Track API usage and purchase additional credits via the API [Dashboard](https://build.zapper.xyz/dashboard).

info

If you are a client of the legacy [REST API](https://studio.zapper.xyz/docs/apis/getting-started), you have access to the new GraphQL endpoints with your existing API key, after signing in to the new [Dashboard](https://build.zapper.xyz/dashboard) with the email associated with your existing account. Please contact us at _[api@zapper.xyz](mailto:api@zapper.xyz)_ to get your purchased points migrated to the new GraphQL API.

CopyCopy page for LLMsToggle menu

[Edit this page](https://github.com/Zapper-fi/protocol/tree/main/docs/api/api.mdx)

[Next\\
\\
Setup](https://build.zapper.xyz/docs/api/x402/getting-started)

- [Quickstart](https://build.zapper.xyz/docs/api/#quickstart)
  - [1) Get an API key](https://build.zapper.xyz/docs/api/#1-get-an-api-key)
  - [2) Start building](https://build.zapper.xyz/docs/api/#2-start-building)
  - [3) Subscribe or purchase credits](https://build.zapper.xyz/docs/api/#3-subscribe-or-purchase-credits)

[API Status](https://status.zapper.xyz/)· [X](https://x.com/zapper_fi)· [Farcaster](https://farcaster.xyz/zapper)· [Discord](https://zapper.xyz/discord)· [Contact Us](https://build.zapper.xyz/contact)· [API Support](https://build.zapper.xyz/support)· [Terms & Conditions](https://build.zapper.xyz/terms)

© Zapper 2026

Checking your Browser…

Verifying...

Stuck? [Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/cs4u0/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Success!

Verification failed

[Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/cs4u0/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Verification expired

[Refresh](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/cs4u0/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

Verification expired

[Refresh](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/cs4u0/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

[Troubleshoot](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/f/ov2/av0/rch/cs4u0/0x4AAAAAAAM8ceq5KhP1uJBt/auto/fbE/new/normal?lang=auto#refresh)

[Privacy](https://www.cloudflare.com/privacypolicy/) • [Help](https://challenges.cloudflare.com/cdn-cgi/challenge-platform/help)

Wallet · Privy