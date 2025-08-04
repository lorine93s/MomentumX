export interface SniperConfig {
  baseCoin: string;
  amountIn: number;
  slippage: number;
  maxGasPrice: number;
  blacklist: string[];
  whitelist: string[];
}

export interface ArbitrageConfig {
  dexPairs: {
    momentum: string[];
    cetus: string[];
    turbos: string[];
  };
  minProfitability: number;
  maxGasPerTrade: number;
}

export const DEFAULT_SNIPER_CONFIG: SniperConfig = {
  baseCoin: '0x2::sui::SUI',
  amountIn: 0.1,
  slippage: 1.5,
  maxGasPrice: 1000,
  blacklist: [],
  whitelist: []
};