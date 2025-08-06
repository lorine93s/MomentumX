import { TransactionBlock } from '@mysten/sui.js/transactions';
import { BaseBot } from './baseBot';
import { MomentumDEX } from '../dex/momentum';
import { CetusDEX } from '../dex/cetus';
import { BundlerConfig, BundleOperation } from '../types';

export class BundlerBot extends BaseBot {
  private config: BundlerConfig;
  private momentum: MomentumDEX;
  private cetus: CetusDEX;

  constructor(client: SuiClient, wallet: Wallet, config: BundlerConfig) {
    super(client, wallet);
    this.config = config;
    this.momentum = new MomentumDEX(client);
    this.cetus = new CetusDEX(client);
  }

  async executeBundle(operations: BundleOperation[]): Promise<void> {
    const txb = new TransactionBlock();
    txb.setGasBudget(this.config.maxGasBudget);

    for (const op of operations) {
      switch (op.type) {
        case 'swap':
          await this.handleSwap(txb, op);
          break;
        case 'add_liquidity':
          await this.handleAddLiquidity(txb, op);
          break;
        case 'stake':
          await this.handleStake(txb, op);
          break;
        default:
          this.logger.warn(`Unknown operation type: ${op.type}`);
      }
    }

    const result = await this.wallet.signAndExecute(txb);
    this.logger.log(`Bundle executed: ${result.digest}`);
  }

  private async handleSwap(txb: TransactionBlock, op: SwapOperation) {
    const dex = op.dex === 'momentum' ? this.momentum : this.cetus;
    await dex.swap(
      txb,
      op.coinIn,
      op.coinOut,
      op.amount,
      op.slippage
    );
  }

  private async handleAddLiquidity(txb: TransactionBlock, op: AddLiquidityOperation) {
    const dex = op.dex === 'momentum' ? this.momentum : this.cetus;
    await dex.addLiquidity(
      txb,
      op.coinA,
      op.coinB,
      op.amountA,
      op.amountB,
      op.lowerPrice,
      op.upperPrice
    );
  }

  private async handleStake(txb: TransactionBlock, op: StakeOperation) {
    const dex = op.dex === 'momentum' ? this.momentum : this.cetus;
    await dex.stake(
      txb,
      op.lpCoin,
      op.amount
    );
  }
}