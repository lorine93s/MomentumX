import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { DEXInterface, PoolData, LiquidityData, SwapParams, PriceData, LiquidityParams, RemoveLiquidityParams } from './interfaces';
import { normalizeSuiAddress } from '../utils/address';
import { Logger } from '../utils/logger';

export class TurbosDEX implements DEXInterface {
  private client: SuiClient;
  private packageId: string;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(client: SuiClient, packageId?: string) {
    this.client = client;
    this.packageId = packageId || '0x91bfbc386a41af6d3f9c8c308dcaa68c2540e725'; // Turbos package ID
    this.logger = new Logger('TurbosDEX');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify package exists on chain
      await this.client.getNormalizedMoveModules({
        package: this.packageId
      });
      
      this.initialized = true;
      this.logger.info('Turbos DEX initialized successfully');
    } catch (error) {
      this.logger.error('Turbos DEX initialization failed:', error);
      throw new Error(`Failed to initialize TurbosDEX: ${error.message}`);
    }
  }

  async swap(
    txb: TransactionBlock,
    { coinIn, coinOut, amount, slippage, poolId, recipient }: SwapParams
  ): Promise<TransactionBlock> {
    if (!this.initialized) {
      throw new Error('TurbosDEX not initialized');
    }

    try {
      const normalizedCoinIn = normalizeSuiAddress(coinIn);
      const normalizedCoinOut = normalizeSuiAddress(coinOut);
      
      txb.moveCall({
        target: `${this.packageId}::pool::swap`,
        arguments: [
          txb.object(poolId || await this.findBestPool(normalizedCoinIn, normalizedCoinOut)),
          txb.pure(amount.toString()),
          txb.pure(Math.floor(slippage * 100)), // Convert to basis points
          txb.pure(recipient || this.client.getAddress()),
          txb.object('0x6') // Sui clock
        ],
        typeArguments: [normalizedCoinIn, normalizedCoinOut]
      });

      this.logger.trade('swap_configured', {
        dex: 'turbos',
        coinIn: normalizedCoinIn,
        coinOut: normalizedCoinOut,
        amount,
        slippage
      });

      return txb;
    } catch (error) {
      this.logger.error('Turbos swap failed:', error);
      throw new Error(`Turbos swap execution error: ${error.message}`);
    }
  }

  async monitorNewPools(): Promise<PoolData[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::pool::PoolCreated`
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
      this.logger.error('Failed to fetch Turbos new pools:', error);
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
        throw new Error('Turbos pool not found');
      }

      const poolData = poolObject.data.content.fields;
      return {
        totalLiquidity: parseFloat(poolData.total_liquidity || '0'),
        currentTick: parseInt(poolData.current_tick || '0'),
        sqrtPrice: poolData.sqrt_price || '0',
        feeTier: parseFloat(poolData.fee_tier || '0'),
        tokenA: {
          reserves: parseFloat(poolData.reserve_a || '0'),
          decimals: parseInt(poolData.decimals_a || '0')
        },
        tokenB: {
          reserves: parseFloat(poolData.reserve_b || '0'),
          decimals: parseInt(poolData.decimals_b || '0')
        },
        tvl: parseFloat(poolData.tvl || '0')
      };
    } catch (error) {
      this.logger.error(`Failed to get Turbos liquidity for pool ${poolId}:`, error);
      throw new Error(`Turbos liquidity check failed: ${error.message}`);
    }
  }

  async getPoolPrice(poolId: string): Promise<PriceData> {
    try {
      const liquidityData = await this.getPoolLiquidity(poolId);
      
      // Calculate price from sqrt price
      const sqrtPrice = parseFloat(liquidityData.sqrtPrice);
      const price = sqrtPrice * sqrtPrice;
      
      return {
        price,
        priceImpact: 0, // Would need to calculate based on trade size
        fee: liquidityData.feeTier / 10000, // Convert from basis points
        minimumReceived: 0, // Would need to calculate based on slippage
        maximumSpent: 0 // Would need to calculate based on slippage
      };
    } catch (error) {
      this.logger.error(`Failed to get Turbos price for pool ${poolId}:`, error);
      throw new Error(`Turbos price check failed: ${error.message}`);
    }
  }

  async addLiquidity(
    txb: TransactionBlock,
    { coinA, coinB, amountA, amountB, lowerTick, upperTick, poolId }: LiquidityParams
  ): Promise<TransactionBlock> {
    try {
      const targetPoolId = poolId || await this.findBestPool(coinA, coinB);
      
      txb.moveCall({
        target: `${this.packageId}::pool::add_liquidity`,
        arguments: [
          txb.object(targetPoolId),
          txb.pure(amountA.toString()),
          txb.pure(amountB.toString()),
          txb.pure(lowerTick),
          txb.pure(upperTick),
          txb.object('0x6') // Sui clock
        ],
        typeArguments: [coinA, coinB]
      });

      return txb;
    } catch (error) {
      this.logger.error('Turbos add liquidity failed:', error);
      throw new Error(`Turbos add liquidity error: ${error.message}`);
    }
  }

  async removeLiquidity(
    txb: TransactionBlock,
    { poolId, lpAmount, minAmountA, minAmountB }: RemoveLiquidityParams
  ): Promise<TransactionBlock> {
    try {
      txb.moveCall({
        target: `${this.packageId}::pool::remove_liquidity`,
        arguments: [
          txb.object(poolId),
          txb.pure(lpAmount.toString()),
          txb.pure(minAmountA.toString()),
          txb.pure(minAmountB.toString()),
          txb.object('0x6') // Sui clock
        ]
      });

      return txb;
    } catch (error) {
      this.logger.error('Turbos remove liquidity failed:', error);
      throw new Error(`Turbos remove liquidity error: ${error.message}`);
    }
  }

  private async findBestPool(coinA: string, coinB: string): Promise<string> {
    try {
      // Implementation to find pool with deepest liquidity
      const pools = await this.client.getCoins({
        coinType: `${this.packageId}::pool::Pool<${coinA},${coinB}>`
      });

      if (pools.data.length === 0) {
        throw new Error(`No Turbos pool found for ${coinA}/${coinB} pair`);
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
    } catch (error) {
      this.logger.error(`Failed to find best Turbos pool for ${coinA}/${coinB}:`, error);
      throw error;
    }
  }
}
