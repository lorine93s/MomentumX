import { SuiClient } from '@mysten/sui.js/client';
import { Wallet } from './wallet';
import { Logger } from '../utils/logger';

export abstract class BaseBot {
  protected client: SuiClient;
  protected wallet: Wallet;
  protected logger: Logger;
  protected isRunning: boolean = false;

  constructor(client: SuiClient, wallet: Wallet) {
    this.client = client;
    this.wallet = wallet;
    this.logger = new Logger(this.constructor.name);
  }

  abstract initialize(): Promise<void>;
  abstract execute(): Promise<void>;
  abstract monitor(): Promise<void>;
  abstract stop(): Promise<void>;

  protected validateEnvironment(): void {
    if (!this.client || !this.wallet) {
      throw new Error('Client and wallet must be initialized');
    }
  }
}