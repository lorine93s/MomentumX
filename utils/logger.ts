import pino from 'pino';

export class Logger {
  private logger: pino.Logger;

  constructor(name: string) {
    this.logger = pino({
      name,
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: { 
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      },
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    });
  }

  info(message: string, data?: any) {
    this.logger.info(data || message);
  }

  log(message: string, data?: any) {
    this.logger.info(data || message);
  }

  error(message: string, error?: any) {
    this.logger.error(error || message);
  }

  warn(message: string, data?: any) {
    this.logger.warn(data || message);
  }

  debug(message: string, data?: any) {
    this.logger.debug(data || message);
  }

  trace(message: string, data?: any) {
    this.logger.trace(data || message);
  }

  // Structured logging for trading operations
  trade(operation: string, data: any) {
    this.logger.info({ operation, ...data }, `Trade: ${operation}`);
  }

  // Structured logging for arbitrage opportunities
  arbitrage(opportunity: any) {
    this.logger.info({ 
      type: 'arbitrage',
      profit: opportunity.profit,
      profitPercentage: opportunity.profitPercentage,
      riskScore: opportunity.riskScore,
      gasEstimate: opportunity.gasEstimate
    }, 'Arbitrage opportunity detected');
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any) {
    this.logger.info({ 
      type: 'performance',
      operation,
      duration,
      ...data
    }, `Performance: ${operation} took ${duration}ms`);
  }
}
