import dotenv from 'dotenv';
import { SuiChain } from './lib/sui';
import { Wallet } from './lib/wallet';
import { SniperBot } from './bots/sniper';
import { DEFAULT_SNIPER_CONFIG } from './config/strategies';

dotenv.config();

async function main() {
  const chain = new SuiChain(process.env.RPC_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY!, chain);
  
  // Initialize bot based on strategy
  switch(process.env.STRATEGY) {
    case 'sniper':
      const sniper = new SniperBot(chain.client, wallet, DEFAULT_SNIPER_CONFIG);
      await sniper.initialize();
      await sniper.execute();
      break;
    // Other cases...
  }
}

main().catch(console.error);