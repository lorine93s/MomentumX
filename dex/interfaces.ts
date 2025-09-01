import { TransactionBlock } from '@mysten/sui.js/transactions';

export interface DEXInterface {
  initialize(): Promise<void>;
  swap(txb: TransactionBlock, params: SwapParams): Promise<TransactionBlock>;
  monitorNewPools(): Promise<PoolData[]>;
  getPoolLiquidity(poolId: string): Promise<LiquidityData>;
  getPoolPrice(poolId: string): Promise<PriceData>;
  addLiquidity(txb: TransactionBlock, params: LiquidityParams): Promise<TransactionBlock>;
  removeLiquidity(txb: TransactionBlock, params: RemoveLiquidityParams): Promise<TransactionBlock>;
}

export interface SwapParams {
  coinIn: string;
  coinOut: string;
  amount: number;
  slippage: number;
  poolId?: string;
  recipient?: string;
}

export interface PoolData {
  poolId: string;
  coinA: string;
  coinB: string;
  feeTier: number;
  createdAt: number;
  liquidity?: number;
  volume24h?: number;
}

export interface LiquidityData {
  totalLiquidity: number;
  currentTick: number;
  sqrtPrice: string;
  feeTier: number;
  tokenA: TokenReserves;
  tokenB: TokenReserves;
  tvl: number;
}

export interface TokenReserves {
  reserves: number;
  decimals: number;
  symbol?: string;
}

export interface PriceData {
  price: number;
  priceImpact: number;
  fee: number;
  minimumReceived: number;
  maximumSpent: number;
}

export interface LiquidityParams {
  coinA: string;
  coinB: string;
  amountA: number;
  amountB: number;
  lowerTick: number;
  upperTick: number;
  poolId?: string;
}

export interface RemoveLiquidityParams {
  poolId: string;
  lpAmount: number;
  minAmountA: number;
  minAmountB: number;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'triangular' | 'two-point' | 'flash-loan';
  profit: number;
  profitPercentage: number;
  riskScore: number;
  gasEstimate: number;
  executionPath: ExecutionStep[];
  timestamp: number;
  expiry: number;
}

export interface ExecutionStep {
  dex: string;
  action: 'swap' | 'add_liquidity' | 'remove_liquidity';
  coinIn: string;
  coinOut: string;
  amount: number;
  expectedOutput: number;
  poolId: string;
}

export interface TriangularArbitrage extends ArbitrageOpportunity {
  type: 'triangular';
  dex1: string;
  dex2: string;
  dex3: string;
  coin1: string;
  coin2: string;
  coin3: string;
  amount: number;
  slippage: number;
}

export interface TwoPointArbitrage extends ArbitrageOpportunity {
  type: 'two-point';
  dex1: string;
  dex2: string;
  coinA: string;
  coinB: string;
  amount: number;
  slippage: number;
}

export interface FlashLoanArbitrage extends ArbitrageOpportunity {
  type: 'flash-loan';
  loanAmount: number;
  loanToken: string;
  executionSteps: ExecutionStep[];
  repaymentAmount: number;
}

export interface DEXConfig {
  packageId: string;
  name: string;
  version: string;
  supportedTokens: string[];
  feeStructure: FeeStructure;
  gasEstimates: GasEstimates;
}

export interface FeeStructure {
  swapFee: number;
  liquidityFee: number;
  protocolFee: number;
  feeRecipient: string;
}

export interface GasEstimates {
  swap: number;
  addLiquidity: number;
  removeLiquidity: number;
  flashLoan: number;
}
