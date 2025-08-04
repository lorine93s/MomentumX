# MomentumX 🧠🚀

**MomentumX** is a suite of intelligent, composable trading bots built for the Sui blockchain. It is designed to interact with Momentum — the leading concentrated liquidity DEX on Sui — and integrates seamlessly with memecoin launchpads like Pump.fun and Let's Bonk clones.

This project supports several advanced DeFi trading strategies, including:

- 📈 Copy trading top-performing wallets
- ⚡ Sniping newly listed tokens with low-latency execution
- 📦 Bundled PTB actions (e.g., swap + LP + stake)
- 🔁 Arbitrage across Momentum, Cetus, Turbos, and FlowX
- 💧 Volume farming to maximize rewards
- 🧠 Liquidity range rebalancing for optimized LP yield

---

## 🔧 Supported Platforms

- [Momentum](https://momentum.xyz)
- [Cetus](https://cetus.zone)
- [Turbos Finance](https://turbos.finance)
- [FlowX](https://flowx.finance)
- [Pump.fun-style Launchpads](#)
- [Let's Bonk-style Meme Platforms](#)

---

## 📂 Project Structure
```
.
├── bots/
│ ├── sniper.ts
│ ├── arbitrage.ts
│ ├── copytrader.ts
│ ├── bundler.ts
│ └── volumeFarming.ts
├── dex/
│ ├── momentum.ts
│ ├── cetus.ts
│ ├── turbos.ts
│ └── flowx.ts
├── config/
│ └── strategies.json
├── utils/
│ ├── wallet.ts
│ └── logger.ts
└── index.ts
```

---

## 🧪 Usage

### Install dependencies:
```bash
npm install
```
 
## Set up .env:
```
PRIVATE_KEY=your_private_key
RPC_URL=https://sui-mainnet-endpoint
DEXS=momentum,cetus,turbos
STRATEGY=sniper
```
## Run Bot
```
npm run start
```
## Planned Features
- Wallet monitoring (real-time copy trades)

- Telegram & Discord alerts

- Auto LP reinvestment

- PTB bundling with gas control

- Risk management (slippage, blacklists, etc.)



