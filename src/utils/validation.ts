// src/utils/validation.ts
/**
 * Validation utilities for Zest Protocol operations
 */

import { logger } from './logger.js';
import {
  DeploymentError,
  ValidationError,
  ConfigurationError,
} from './errors.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRequired(
  value: unknown,
  fieldName: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value === null || value === undefined) {
    errors.push(`${fieldName} is required but not provided`);
  } else if (typeof value === 'string' && value.trim() === '') {
    errors.push(`${fieldName} cannot be empty`);
  } else if (Array.isArray(value) && value.length === 0) {
    warnings.push(`${fieldName} is an empty array`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validatePositiveNumber(
  value: number | bigint,
  fieldName: string,
  allowZero = false,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof value !== 'number' && typeof value !== 'bigint') {
    errors.push(`${fieldName} must be a number or bigint`);
  } else {
    const numValue = Number(value);
    if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
    } else if (!allowZero && numValue <= 0) {
      errors.push(`${fieldName} must be positive${allowZero ? ' or zero' : ''}`);
    } else if (allowZero && numValue < 0) {
      errors.push(`${fieldName} must be non-negative`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateStxAddress(address: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!address || typeof address !== 'string') {
    errors.push('STX address must be a non-empty string');
  } else if (!/^ST[1-9A-HJ-NP-Za-km-z]{39}$/.test(address)) {
    errors.push('Invalid STX address format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateBitcoinAddress(address: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!address || typeof address !== 'string') {
    errors.push('Bitcoin address must be a non-empty string');
  } else if (!/^[13bc1mnopqwy][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    errors.push('Invalid Bitcoin address format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateNetwork(network: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validNetworks = ['mainnet', 'testnet', 'regtest', 'mocknet'];

  if (!validNetworks.includes(network)) {
    errors.push(
      `Invalid network: ${network}. Must be one of: ${validNetworks.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateContractName(contractName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contractName || typeof contractName !== 'string') {
    errors.push('Contract name must be a non-empty string');
  } else if (!/^[a-z-][a-z0-9-]*$/.test(contractName)) {
    errors.push(
      'Contract name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAndLog<T>(
  validator: (value: T) => ValidationResult,
  value: T,
  fieldName: string,
  context?: Record<string, unknown>,
): T {
  const result = validator(value);

  if (result.warnings.length > 0) {
    logger.warn(`${fieldName} validation warnings`, {
      fieldName,
      value,
      warnings: result.warnings,
      ...context,
    });
  }

  if (!result.isValid) {
    const errorMessage = `${fieldName} validation failed: ${result.errors.join(', ')}`;
    logger.error(errorMessage, { fieldName, value, errors: result.errors, ...context });
    throw new ValidationError(errorMessage, { fieldName, value, errors: result.errors });
  }

  logger.debug(`${fieldName} validation passed`, { fieldName, value, ...context });
  return value;
}

export function assertValid<T>(
  validator: (value: T) => ValidationResult,
  value: T,
  fieldName: string,
): asserts value is T {
  const result = validator(value);

  if (!result.isValid) {
    throw new ValidationError(
      `${fieldName} validation failed: ${result.errors.join(', ')}`,
      { fieldName, value, errors: result.errors },
    );
  }
}

export function combineValidations(validations: ValidationResult[]): ValidationResult {
  const allErrors = validations.flatMap(v => v.errors);
  const allWarnings = validations.flatMap(v => v.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
