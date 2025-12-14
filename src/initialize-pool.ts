
import { StacksMocknet } from '@stacks/network';
import { TransactionVersion, getNonce } from '@stacks/transactions';

import { getStxAddress } from '@stacks/wallet-sdk';
import { networks } from 'bitcoinjs-lib';

import {
  createPool,
  finalizePool,
  setupContracts,
  waitForStacksTransaction,
} from './stacks.js';
import { getWallets } from './accounts.js';
import { generateRandomBitcoinSigner } from './util.js';
import { logger, createScopedLogger } from './utils/logger.js';
import { DeploymentError, ConfigurationError } from './utils/errors.js';
import {
  validateRequired,
  validateAndLog,
  validateStxAddress,
  validatePositiveNumber,
  assertValid,
} from './utils/validation.js';

const network = new StacksMocknet();
const poolLogger = createScopedLogger('initialize-pool');

export interface PoolInitializationParams {
  reserveFactor: number;
  protocolFee: number;
  totalSupplyCap: bigint;
  totalBorrowCap: bigint;
  maxUtilizationRate: number;
  loanToValue: number;
  closeFactor: number;
}

export interface PoolInitializationResult {
  supplierBtcSigner: {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };
  transactionIds: {
    setupContracts: string;
    createPool: string;
    finalizePool: string;
  };
  poolConfig: PoolInitializationParams;
}

const DEFAULT_POOL_CONFIG: PoolInitializationParams = {
  reserveFactor: 1000,
  protocolFee: 1000,
  totalSupplyCap: 10_000_000_000n,
  totalBorrowCap: 10_000_000_000n,
  maxUtilizationRate: 1,
  loanToValue: 157_680,
  closeFactor: 80,
};

/**
 * Initialize the Zest Protocol pool with comprehensive error handling and logging
 */
export async function initializePoolSteps(
  customConfig: Partial<PoolInitializationParams> = {},
): Promise<PoolInitializationResult> {
  const config = { ...DEFAULT_POOL_CONFIG, ...customConfig };
  const logContext = { config };

  try {
    poolLogger.deployment('Starting pool initialization', logContext);

    // Validate configuration
    await validatePoolConfig(config);
    logger.info('Pool configuration validated', { config });

    // Get wallets with proper error handling
    const wallets = await getWallets();
    poolLogger.info('Wallets retrieved successfully');

    // Extract and validate required wallets
    const deployerWallet = wallets.deployer;
    const delegate = wallets.delegate;

    if (!deployerWallet?.accounts?.[0]) {
      throw new ConfigurationError('Deployer wallet or account not found', { wallets: Object.keys(wallets) });
    }

    if (!delegate?.accounts?.[0]) {
      throw new ConfigurationError('Delegate wallet or account not found', { wallets: Object.keys(wallets) });
    }

    const deployerAccount = deployerWallet.accounts[0];
    const delegateAccount = delegate.accounts[0];

    // Validate STX addresses
    const deployerAddress = getStxAddress({
      account: deployerAccount,
      transactionVersion: TransactionVersion.Testnet,
    });
    assertValid(validateStxAddress, deployerAddress, 'Deployer STX Address');

    const delegateAddress = getStxAddress({
      account: delegateAccount,
      transactionVersion: TransactionVersion.Testnet,
    });
    assertValid(validateStxAddress, delegateAddress, 'Delegate STX Address');

    poolLogger.info('Wallet addresses validated', {
      deployerAddress,
      delegateAddress,
    });

    // Generate Bitcoin signer for supplier interface
    const btcNetwork = networks.regtest;
    const supplierBtcSigner = generateRandomBitcoinSigner(btcNetwork);
    
    const publicKeyHex = Buffer.from(supplierBtcSigner.publicKey).toString('hex');
    poolLogger.info('Bitcoin signer generated', { publicKey: publicKeyHex });

    // Setup contracts with proper nonce management
    const initNonce = await getNonce(deployerAddress, network);
    poolLogger.info('Initial nonce retrieved', { nonce: initNonce.toString() });

    const setupResult = await setupContracts(
      supplierBtcSigner.publicKey,
      deployerWallet,
      initNonce,
    );
    const lastNonce = setupResult;
    poolLogger.info('Contracts setup completed', { lastNonce: lastNonce.toString() });

    // Create pool
    const createPoolResult = await createPool(
      deployerAccount,
      deployerAccount,
      delegateAccount,
      config.reserveFactor,
      config.protocolFee,
      config.totalSupplyCap,
      config.totalBorrowCap,
      config.maxUtilizationRate,
      config.loanToValue,
      true, // stable rate enabled
      network,
      lastNonce + 1n,
    );

    const createPoolTxId = createPoolResult.broadcastResponse.txid;
    poolLogger.info('Pool creation transaction submitted', { txId: createPoolTxId });

    // Wait for pool creation to be mined
    await waitForStacksTransaction(createPoolTxId);
    poolLogger.info('Pool creation transaction confirmed', { txId: createPoolTxId });

    // Finalize pool
    const finalizePoolTxId = await finalizePool(
      delegateAccount,
      deployerAccount,
      0,
      network,
    );
    poolLogger.info('Pool finalization transaction submitted', { txId: finalizePoolTxId });

    const result: PoolInitializationResult = {
      supplierBtcSigner,
      transactionIds: {
        setupContracts: setupResult.toString(),
        createPool: createPoolTxId,
        finalizePool: finalizePoolTxId,
      },
      poolConfig: config,
    };

    poolLogger.deployment('Pool initialization completed successfully', { result });

    return result;

  } catch (error) {
    if (error instanceof DeploymentError || error instanceof ConfigurationError) {
      // Re-throw our custom errors
      throw error;
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorContext = {
      config,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    };

    poolLogger.error('Pool initialization failed', errorContext);
    throw new DeploymentError(`Pool initialization failed: ${errorMessage}`, errorContext);
  }
}

/**
 * Validate pool configuration parameters
 */
async function validatePoolConfig(config: PoolInitializationParams): Promise<void> {
  const validationChecks = [
    validatePositiveNumber(config.reserveFactor, 'Reserve Factor'),
    validatePositiveNumber(config.protocolFee, 'Protocol Fee'),
    validatePositiveNumber(config.totalSupplyCap, 'Total Supply Cap'),
    validatePositiveNumber(config.totalBorrowCap, 'Total Borrow Cap'),
    validatePositiveNumber(config.maxUtilizationRate, 'Max Utilization Rate'),
    validatePositiveNumber(config.loanToValue, 'Loan To Value'),
    validatePositiveNumber(config.closeFactor, 'Close Factor'),
  ];

  // Additional business logic validations
  if (config.reserveFactor > 10000) {
    throw new ConfigurationError('Reserve factor should not exceed 100% (10000 basis points)');
  }

  if (config.protocolFee > 10000) {
    throw new ConfigurationError('Protocol fee should not exceed 100% (10000 basis points)');
  }

  if (config.maxUtilizationRate > 100) {
    throw new ConfigurationError('Max utilization rate should not exceed 100%');
  }

  logger.debug('Pool configuration validation passed', { config });
}

// Export for external use
export default initializePoolSteps;
