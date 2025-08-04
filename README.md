
# MomentumX 🧠🚀

**Advanced Algorithmic Trading Suite for Sui Blockchain**

MomentumX is a high-performance, modular trading bot framework designed specifically for the Sui ecosystem. Built with institutional-grade architecture, it provides sophisticated trading strategies that leverage Momentum DEX's concentrated liquidity model and integrates with major Sui DeFi protocols.

## 🔥 Key Features

### 🚀 Core Capabilities
- **Multi-DEX Arbitrage Engine**: Cross-protocol arbitrage between Momentum, Cetus, Turbos, and FlowX
- **Ultra-Low Latency Sniper**: <50ms token launch detection and execution
- **Smart Copy Trading**: Mirror top-performing wallets with risk-adjusted allocation

### ⚡ Advanced Functionality
- **Programmable Transaction Bundles**: Combine swaps, LP, and staking in single PTBs
- **Dynamic LP Optimization**: AI-powered liquidity range rebalancing
- **Volume Farming 2.0**: Adaptive reward maximization across protocols

### 🛡️ Enterprise-Grade Infrastructure
- Multi-threaded event processing
- Fault-tolerant execution engine
- Real-time risk monitoring

## 📊 Supported Platforms

| Platform | Type | Status | Docs |
|----------|------|--------|------|
| [Momentum](https://momentum.xyz) | Concentrated Liquidity DEX | ✅ Production | [API](https://docs.momentum.xyz) |
| [Cetus](https://cetus.zone) | AMM DEX | ✅ Production | [API](https://docs.cetus.zone) |
| [Turbos Finance](https://turbos.finance) | AMM DEX | ✅ Production | [API](https://docs.turbos.finance) |
| [FlowX](https://flowx.finance) | Hybrid DEX | ✅ Production | [API](https://docs.flowx.finance) |
| Pump.fun Clones | Launchpad | 🔧 Beta | - |
| Let's Bonk Clones | Meme Platform | 🔧 Beta | - |

## 🏗 Project Architecture

```text
.
├── src/
│   ├── bots/
│   │   ├── baseBot.ts          # Abstract base bot class
│   │   ├── sniper.ts           # Token sniper implementation
│   │   ├── arbitrage.ts        # Cross-DEX arbitrage bot
│   │   ├── copytrader.ts       # Copy trading bot
│   │   ├── bundler.ts          # PTB transaction bundler
│   │   └── volumeFarming.ts    # Volume farming strategy
│   ├── dex/
│   │   ├── interfaces.ts       # Common DEX interfaces
│   │   ├── momentum.ts         # Momentum DEX implementation
│   │   ├── cetus.ts            # Cetus DEX implementation
│   │   ├── turbos.ts           # Turbos Finance implementation
│   │   └── flowx.ts            # FlowX implementation
│   ├── lib/
│   │   ├── chain/
│   │   │   ├── sui.ts          # Sui blockchain interactions
│   │   │   └── transaction.ts  # Transaction utilities
│   │   ├── strategies/         # Strategy implementations
│   │   ├── analytics/          # Market analysis tools
│   │   └── risk/               # Risk management
│   ├── config/
│   │   ├── constants.ts        # Project constants
│   │   ├── networks.ts         # Network configurations
│   │   └── strategies.ts       # Strategy configurations
│   ├── types/                  # Type definitions
│   ├── utils/                  # Utility functions
│   └── services/               # Background services
├── test/                       # Test files
├── scripts/                    # Deployment/maintenance scripts
└── docs/                       # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Sui CLI configured
- Minimum 0.5 SUI for gas

### Installation
```bash
# Clone repository
git clone https://github.com/your-repo/momentumx.git
cd momentumx

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

### Configuration
Configure your `.env` file:
```ini
# Network Configuration
RPC_URL=https://fullnode.mainnet.sui.io
WEBSOCKET_URL=wss://fullnode.mainnet.sui.io:443

# Wallet Configuration
PRIVATE_KEY=your_sui_private_key_here
WALLET_ADDRESS=0xYourSuiAddress

# Bot Configuration
STRATEGY=sniper
MAX_GAS_PRICE=2000
MAX_RETRIES=3
RETRY_DELAY_MS=5000

# DEX Configuration
DEXS=momentum,cetus,turbos
MOMENTUM_PACKAGE_ID=0xMomentumPackageId
CETUS_PACKAGE_ID=0xCetusPackageId
TURBOS_PACKAGE_ID=0xTurbosPackageId

# Sniper Configuration (if STRATEGY=sniper)
SNIPER_BASE_COIN=0x2::sui::SUI
SNIPER_AMOUNT_IN=0.5
SNIPER_SLIPPAGE=1.5
SNIPER_COOLDOWN_MS=3000

# Arbitrage Configuration (if STRATEGY=arbitrage)
ARB_MIN_PROFIT=0.01
ARB_MAX_GAS_PER_TRADE=1000

# Monitoring Configuration
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
DISCORD_WEBHOOK=

# Risk Management
MAX_LOSS_PERCENT=5
BLACKLIST_FILE=./config/blacklist.json

# Performance
BATCH_SIZE=5
PARALLEL_EXECUTIONS=3
```

### Running the Bot
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run start

# Specific strategy
STRATEGY=arbitrage npm start
```

## 📈 Strategy Examples

### Flash Loan Arbitrage
```typescript
// Sample arbitrage flow
const opportunity = await findArbitrage();
const txb = new TransactionBlock();

await flashLoan(txb, opportunity.amount);
await swapDEX1(txb, opportunity.path);
await swapDEX2(txb, opportunity.reversePath);
await repayFlashLoan(txb);

executeTransaction(txb);
```

### Sniper Configuration
```yaml
sniper:
  base_asset: 0x2::sui::SUI
  min_liquidity: 500 # SUI
  max_slippage: 2.5 # %
  gas_priority: high
  blacklist:
    - 0xbad_token
```

## 🛡 Risk Management
- Dynamic slippage adjustment
- Circuit breakers
- Gas price optimization
- Token blacklisting
- Position sizing algorithms

