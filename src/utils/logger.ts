// src/utils/logger.ts
/**
 * Logging utility for Zest Protocol operations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableJson: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private static instance: Logger | null = null;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableColors: process.stdout.isTTY ?? true,
      enableTimestamps: true,
      enableJson: false,
      ...config,
    };
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  public static reset(): void {
    Logger.instance = null;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      case 'info':
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(
    level: string,
    message: string,
    context?: Record<string, unknown>,
  ): string {
    const timestamp = this.config.enableTimestamps
      ? new Date().toISOString()
      : '';
    const color = this.config.enableColors
      ? this.getColor(Number(level))
      : '';
    const reset = this.config.enableColors ? '\x1b[0m' : '';

    const prefix = timestamp ? `[${timestamp}] ` : '';
    const contextStr = context
      ? ` ${JSON.stringify(context, null, 2)}`
      : '';

    return `${prefix}${color}[${level.toUpperCase()}]${reset} ${message}${contextStr}`;
  }

  private getColor(level: number): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      default:
        return '';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (this.config.enableJson) {
      const logObject = {
        timestamp: new Date().toISOString(),
        level: levelName.toUpperCase(),
        message,
        context,
      };
      console.log(JSON.stringify(logObject, null, 2));
    } else {
      console.log(this.formatMessage(levelName, message, context));
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, 'info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, 'warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, 'error', message, context);
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public getLevel(): LogLevel {
    return this.config.level;
  }

  // Convenience methods for specific operations
  public deployment(message: string, context?: Record<string, unknown>): void {
    this.info(`🚀 DEPLOYMENT: ${message}`, context);
  }

  public transaction(message: string, context?: Record<string, unknown>): void {
    this.info(`📤 TRANSACTION: ${message}`, context);
  }

  public network(message: string, context?: Record<string, unknown>): void {
    this.info(`🌐 NETWORK: ${message}`, context);
  }

  public contract(message: string, context?: Record<string, unknown>): void {
    this.info(`📋 CONTRACT: ${message}`, context);
  }
}

// Export default logger instance
export const logger = Logger.getInstance();

// Export function to create scoped loggers
export function createScopedLogger(scope: string) {
  const baseLogger = Logger.getInstance();
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      baseLogger.debug(`[${scope}] ${message}`, context),
    info: (message: string, context?: Record<string, unknown>) =>
      baseLogger.info(`[${scope}] ${message}`, context),
    warn: (message: string, context?: Record<string, unknown>) =>
      baseLogger.warn(`[${scope}] ${message}`, context),
    error: (message: string, context?: Record<string, unknown>) =>
      baseLogger.error(`[${scope}] ${message}`, context),
    deployment: (message: string, context?: Record<string, unknown>) =>
      baseLogger.deployment(`[${scope}] ${message}`, context),
    transaction: (message: string, context?: Record<string, unknown>) =>
      baseLogger.transaction(`[${scope}] ${message}`, context),
    network: (message: string, context?: Record<string, unknown>) =>
      baseLogger.network(`[${scope}] ${message}`, context),
    contract: (message: string, context?: Record<string, unknown>) =>
      baseLogger.contract(`[${scope}] ${message}`, context),
    setLevel: (level: LogLevel) => baseLogger.setLevel(level),
    getLevel: () => baseLogger.getLevel(),
  };
}
