// src/utils/errors.ts
/**
 * Custom error classes for Zest Protocol operations
 */

export abstract class ZestError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  protected constructor(
    message: string,
    code: string,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class DeploymentError extends ZestError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'DEPLOYMENT_ERROR', context);
  }
}

export class ConfigurationError extends ZestError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

export class NetworkError extends ZestError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'NETWORK_ERROR', context);
  }
}

export class TransactionError extends ZestError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'TRANSACTION_ERROR', context);
  }
}

export class ValidationError extends ZestError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, 'VALIDATION_ERROR', context);
  }
}
