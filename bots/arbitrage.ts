import { BaseBot } from './baseBot';
import { MomentumDEX } from '../dex/momentum';
import { CetusDEX } from '../dex/cetus';
import { TurbosDEX } from '../dex/turbos';
import { ArbitrageConfig, ArbitrageOpportunity } from '../types';

export class ArbitrageBot extends BaseBot {
  private config: ArbitrageConfig;
  private dexInstances: Record<string, any> = {};

  constructor(client: SuiClient, wallet: Wallet, config: ArbitrageConfig) {
    super(client, wallet);
    this.config = config;
    this.initializeDEXs();
  }

  private initializeDEXs(): void {
    this.dexInstances = {
      momentum: new MomentumDEX(this.client),
      cetus: new CetusDEX(this.client),
      turbos: new TurbosDEX(this.client)
    };
  }

  async findOpportunities(): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Implement triangular arbitrage detection
    const triangularOpps = await this.findTriangularArbitrage();
    opportunities.push(...triangularOpps);

    // Implement two-point arbitrage detection
    const twoPointOpps = await this.findTwoPointArbitrage();
    opportunities.push(...twoPointOpps);

    return opportunities.filter(opp => 
      opp.profit > this.config.minProfit && 
      opp.riskScore < this.config.maxRisk
    );
  }

  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<void> {
    const txb = new TransactionBlock();
    
    if (opportunity.type === 'triangular') {
      await this.executeTriangularArbitrage(txb, opportunity);
    } else {
      await this.executeTwoPointArbitrage(txb, opportunity);
    }

    const result = await this.wallet.signAndExecute(txb);
    this.logger.log(`Arbitrage executed: ${result.digest}`);
  }

  private async executeTriangularArbitrage(txb: TransactionBlock, opp: TriangularArbitrage) {
    const dex1 = this.dexInstances[opp.dex1];
    const dex2 = this.dexInstances[opp.dex2];
    
    await dex1.swap(txb, opp.coin1, opp.coin2, opp.amount, opp.slippage);
    await dex2.swap(txb, opp.coin2, opp.coin3, opp.amount, opp.slippage);
    await this.dexInstances.momentum.swap(txb, opp.coin3, opp.coin1, opp.amount, opp.slippage);
  }
}