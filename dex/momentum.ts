import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { DEXInterface, PoolData, LiquidityData, SwapParams } from './interfaces';
import { normalizeSuiAddress } from '../utils/address';
import { Logger } from '../utils/logger';

export class MomentumDEX implements DEXInterface {
  private client: SuiClient;
  private packageId: string;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(client: SuiClient, packageId?: string) {
    this.client = client;
    this.packageId = packageId || '0xMOMENTUM_PACKAGE_ID'; // Replace with actual package ID
    this.logger = new Logger('MomentumDEX');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify package exists on chain
      await this.client.getNormalizedMoveModules({
        package: this.packageId
      });
      
      this.initialized = true;
      this.logger.log('Successfully initialized');
    } catch (error) {
      this.logger.error('Initialization failed:', error);
      throw new Error(`Failed to initialize MomentumDEX: ${error.message}`);
    }
  }

  async swap(
    txb: TransactionBlock,
    { coinIn, coinOut, amount, slippage, poolId }: SwapParams
  ): Promise<TransactionBlock> {
    if (!this.initialized) {
      throw new Error('MomentumDEX not initialized');
    }

    try {
      const normalizedCoinIn = normalizeSuiAddress(coinIn);
      const normalizedCoinOut = normalizeSuiAddress(coinOut);
      
      txb.moveCall({
        target: `${this.packageId}::spot::swap`,
        arguments: [
          txb.object(poolId || await this.findBestPool(normalizedCoinIn, normalizedCoinOut)),
          txb.pure(amount.toString()),
          txb.pure(Math.floor(slippage * 100)), // Convert to basis points
          txb.object('0x6') // Sui clock
        ],
        typeArguments: [normalizedCoinIn, normalizedCoinOut]
      });

      this.logger.log(`Swap configured: ${amount} ${coinIn} -> ${coinOut}`);
      return txb;
    } catch (error) {
      this.logger.error('Swap failed:', error);
      throw new Error(`Swap execution error: ${error.message}`);
    }
  }

  async monitorNewPools(): Promise<PoolData[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::spot::PoolCreated`
        },
        limit: 20,
        order: 'descending'
      });

      return events.data.map(event => ({
        poolId: event.parsedJson.pool_id,
        coinA: event.parsedJson.coin_a,
        coinB: event.parsedJson.coin_b,
        feeTier: event.parsedJson.fee_tier,
        createdAt: event.timestampMs
      }));
    } catch (error) {
      this.logger.error('Failed to fetch new pools:', error);
      return [];
    }
  }

  async getPoolLiquidity(poolId: string): Promise<LiquidityData> {
    try {
      const poolObject = await this.client.getObject({
        id: poolId,
        options: { showContent: true }
      });

      if (!poolObject.data?.content) {
        throw new Error('Pool not found');
      }

      const poolData = poolObject.data.content.fields;
      return {
        totalLiquidity: parseFloat(poolData.total_liquidity),
        currentTick: parseInt(poolData.current_tick),
        sqrtPrice: poolData.sqrt_price,
        feeTier: parseFloat(poolData.fee_tier),
        tokenA: {
          reserves: parseFloat(poolData.reserve_a),
          decimals: parseInt(poolData.decimals_a)
        },
        tokenB: {
          reserves: parseFloat(poolData.reserve_b),
          decimals: parseInt(poolData.decimals_b)
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get liquidity for pool ${poolId}:`, error);
      throw new Error(`Liquidity check failed: ${error.message}`);
    }
  }

  private async findBestPool(coinA: string, coinB: string): Promise<string> {
    // Implementation to find pool with deepest liquidity
    const pools = await this.client.getCoins({
      coinType: `${this.packageId}::spot::Pool<${coinA},${coinB}>`
    });

    if (pools.data.length === 0) {
      throw new Error(`No pool found for ${coinA}/${coinB} pair`);
    }

    // Sort by liquidity descending
    const sortedPools = await Promise.all(
      pools.data.map(async pool => ({
        id: pool.coinObjectId,
        liquidity: (await this.getPoolLiquidity(pool.coinObjectId)).totalLiquidity
      }))
    );

    sortedPools.sort((a, b) => b.liquidity - a.liquidity);
    return sortedPools[0].id;
  }

  // Additional DEX-specific functionality
  async addLiquidity(
    txb: TransactionBlock,
    coinA: string,
    coinB: string,
    amountA: number,
    amountB: number,
    lowerTick: number,
    upperTick: number
  ): Promise<TransactionBlock> {
    txb.moveCall({
      target: `${this.packageId}::spot::add_liquidity`,
      arguments: [
        txb.object(await this.findBestPool(coinA, coinB)),
        txb.pure(amountA.toString()),
        txb.pure(amountB.toString()),
        txb.pure(lowerTick),
        txb.pure(upperTick),
        txb.object('0x6') // Sui clock
      ],
      typeArguments: [coinA, coinB]
    });
    return txb;
  }

  async removeLiquidity(
    txb: TransactionBlock,
    poolId: string,
    lpAmount: number
  ): Promise<TransactionBlock> {
    txb.moveCall({
      target: `${this.packageId}::spot::remove_liquidity`,
      arguments: [
        txb.object(poolId),
        txb.pure(lpAmount.toString()),
        txb.object('0x6') // Sui clock
      ]
    });
    return txb;
  }
}