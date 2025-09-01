import { Logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

export class RetryManager {
  private logger: Logger;

  constructor(name: string = 'RetryManager') {
    this.logger = new Logger(name);
  }

  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true,
      retryCondition = this.defaultRetryCondition
    } = options;

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!retryCondition(error)) {
          this.logger.error('Non-retryable error encountered:', error);
          throw error;
        }
        
        if (attempt === maxRetries) {
          this.logger.error(`Max retries (${maxRetries}) exceeded. Last error:`, lastError);
          throw lastError;
        }
        
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter);
        this.logger.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`, { error: error.message });
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    if (jitter) {
      // Add random jitter (±25%)
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * jitterAmount * 2;
    }
    
    return Math.min(delay, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private defaultRetryCondition(error: any): boolean {
    // Retry on network errors, rate limits, and temporary failures
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'Too Many Requests',
      '429',
      '503',
      '502',
      '504'
    ];

    const errorMessage = error.message || error.toString();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  // Specialized retry for RPC calls
  async retryRpcCall<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    return this.retryWithBackoff(fn, {
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 10000,
      ...options,
      retryCondition: (error) => {
        // RPC-specific retry conditions
        const rpcRetryableErrors = [
          '429',
          'Too Many Requests',
          'RPC_ERROR',
          'NETWORK_ERROR',
          'TIMEOUT'
        ];
        
        const errorMessage = error.message || error.toString();
        return rpcRetryableErrors.some(retryableError => 
          errorMessage.includes(retryableError)
        );
      }
    });
  }

  // Specialized retry for transaction execution
  async retryTransaction<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    return this.retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      ...options,
      retryCondition: (error) => {
        // Transaction-specific retry conditions
        const txRetryableErrors = [
          'INSUFFICIENT_GAS',
          'GAS_ESTIMATION_FAILED',
          'NONCE_TOO_LOW',
          'BLOCK_FULL'
        ];
        
        const errorMessage = error.message || error.toString();
        return txRetryableErrors.some(retryableError => 
          errorMessage.includes(retryableError)
        );
      }
    });
  }
}
