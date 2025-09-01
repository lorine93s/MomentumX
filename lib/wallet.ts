import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/sui.js/utils';
import { Logger } from '../utils/logger';
import { normalizeSuiAddress } from '../utils/address';

export class Wallet {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private logger: Logger;
  private address: string;

  constructor(privateKey: string, client: SuiClient) {
    this.client = client;
    this.logger = new Logger('Wallet');
    
    try {
      // Handle different private key formats
      if (privateKey.startsWith('0x')) {
        this.keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey.slice(2)));
      } else if (privateKey.length === 88) {
        this.keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
      } else {
        throw new Error('Invalid private key format');
      }
      
      this.address = normalizeSuiAddress(this.keypair.getPublicKey().toSuiAddress());
      this.logger.info(`Wallet initialized: ${this.address}`);
    } catch (error) {
      this.logger.error('Failed to initialize wallet:', error);
      throw new Error(`Wallet initialization failed: ${error.message}`);
    }
  }

  getAddress(): string {
    return this.address;
  }

  getPublicKey(): string {
    return this.keypair.getPublicKey().toBase64();
  }

  async getBalance(coinType: string = '0x2::sui::SUI'): Promise<number> {
    try {
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType
      });

      const totalBalance = coins.data.reduce((sum, coin) => {
        return sum + Number(coin.balance);
      }, 0);

      return totalBalance;
    } catch (error) {
      this.logger.error(`Failed to get balance for ${coinType}:`, error);
      return 0;
    }
  }

  async getAllBalances(): Promise<Record<string, number>> {
    try {
      const coins = await this.client.getCoins({
        owner: this.address
      });

      const balances: Record<string, number> = {};
      
      for (const coin of coins.data) {
        const coinType = coin.coinType;
        balances[coinType] = (balances[coinType] || 0) + Number(coin.balance);
      }

      return balances;
    } catch (error) {
      this.logger.error('Failed to get all balances:', error);
      return {};
    }
  }

  async signAndExecute(txb: TransactionBlock, options?: {
    requestType?: 'WaitForLocalExecution' | 'WaitForEffectsCert' | 'WaitForTransactionBlock';
    showEffects?: boolean;
    showEvents?: boolean;
    showInput?: boolean;
    showObjectChanges?: boolean;
    showBalanceChanges?: boolean;
  }): Promise<any> {
    try {
      this.logger.debug('Signing and executing transaction');
      
      // Set the sender
      txb.setSender(this.address);

      // Sign the transaction
      const signedTx = await this.keypair.signTransactionBlock(txb);

      // Execute the transaction
      const result = await this.client.executeTransactionBlock({
        transactionBlock: signedTx,
        requestType: options?.requestType || 'WaitForLocalExecution',
        options: {
          showEffects: options?.showEffects ?? true,
          showEvents: options?.showEvents ?? true,
          showInput: options?.showInput ?? false,
          showObjectChanges: options?.showObjectChanges ?? true,
          showBalanceChanges: options?.showBalanceChanges ?? true,
        }
      });

      this.logger.trade('transaction_executed', {
        digest: result.digest,
        effects: result.effects,
        gasUsed: result.effects?.gasUsed,
        status: result.effects?.status
      });

      return result;
    } catch (error) {
      this.logger.error('Transaction execution failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async signTransaction(txb: TransactionBlock): Promise<Uint8Array> {
    try {
      txb.setSender(this.address);
      const signedTx = await this.keypair.signTransactionBlock(txb);
      return signedTx;
    } catch (error) {
      this.logger.error('Transaction signing failed:', error);
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }

  async estimateGas(txb: TransactionBlock): Promise<number> {
    try {
      txb.setSender(this.address);
      const dryRunResult = await this.client.dryRunTransactionBlock({
        transactionBlock: txb
      });

      // Extract gas estimation from dry run result
      const gasUsed = dryRunResult.effects?.gasUsed;
      return gasUsed ? Number(gasUsed.computationCost) + Number(gasUsed.storageCost) : 0;
    } catch (error) {
      this.logger.error('Gas estimation failed:', error);
      return 0;
    }
  }

  async hasSufficientBalance(amount: number, coinType: string = '0x2::sui::SUI'): Promise<boolean> {
    const balance = await this.getBalance(coinType);
    return balance >= amount;
  }

  async getCoinObjects(coinType: string = '0x2::sui::SUI'): Promise<any[]> {
    try {
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType
      });
      return coins.data;
    } catch (error) {
      this.logger.error(`Failed to get coin objects for ${coinType}:`, error);
      return [];
    }
  }

  async splitCoins(amount: number, coinType: string = '0x2::sui::SUI'): Promise<string> {
    try {
      const txb = new TransactionBlock();
      const coins = await this.getCoinObjects(coinType);
      
      if (coins.length === 0) {
        throw new Error(`No coins found for type ${coinType}`);
      }

      // Use the first coin with sufficient balance
      const coinToSplit = coins.find(coin => Number(coin.balance) >= amount);
      if (!coinToSplit) {
        throw new Error(`Insufficient balance for ${coinType}`);
      }

      const [coin] = txb.splitCoins(txb.object(coinToSplit.coinObjectId), [txb.pure(amount)]);
      
      const result = await this.signAndExecute(txb);
      return result.digest;
    } catch (error) {
      this.logger.error('Split coins failed:', error);
      throw new Error(`Split coins failed: ${error.message}`);
    }
  }

  async transferCoins(
    recipient: string, 
    amount: number, 
    coinType: string = '0x2::sui::SUI'
  ): Promise<string> {
    try {
      const txb = new TransactionBlock();
      const coins = await this.getCoinObjects(coinType);
      
      if (coins.length === 0) {
        throw new Error(`No coins found for type ${coinType}`);
      }

      const coinToTransfer = coins.find(coin => Number(coin.balance) >= amount);
      if (!coinToTransfer) {
        throw new Error(`Insufficient balance for ${coinType}`);
      }

      txb.transferObjects(
        [txb.object(coinToTransfer.coinObjectId)],
        txb.pureAddress(recipient)
      );

      const result = await this.signAndExecute(txb);
      return result.digest;
    } catch (error) {
      this.logger.error('Transfer coins failed:', error);
      throw new Error(`Transfer coins failed: ${error.message}`);
    }
  }
}
