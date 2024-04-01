import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { SupplierInterface } from './supplier_interface.ts';
import { TestUtils } from './test-utils.ts';
import { Magic } from './magic_real.ts';

import { 
  getHash,
  getReverseTxId,
  getTxId,
  generateP2SHTx,
  generateP2PKHTx,
  getExpiration,
  swapperBuff
} from "../supplier-interface/util.ts";


function setContractOwner(chain: Chain, contract: string, newOwner: string, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.${contract}`,
      'set-contract-owner',
        [
          types.principal(`${deployer.address}.${newOwner}`)
        ],
        deployer.address
    )
  ]);
}

function addBorrower(chain: Chain, borrower: Account, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.loan-v1-0`,
      'add-borrower',
        [
          types.principal(borrower.address),
        ],
        deployer.address
    )
  ]);
}

function addApprovedContract(chain: Chain, contract: string, newContract: string, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.${contract}`,
      'add-contract',
        [
          types.principal(`${deployer.address}.${newContract}`),
        ],
        deployer.address
    )
  ]);
}

function setPoolContract(chain: Chain, contract: string, newContract: string, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.${contract}`,
      'set-pool-contract',
      [
        types.principal(`${deployer.address}.${newContract}`),
      ],
      deployer.address
    )
  ]);
}

function getBP(amount: number, bps: number) {
  return Math.floor(bps * amount / 10_000);
}

function initContractOwners(chain: Chain, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.funding-vault`,
      'set-contract-owner',
      [
        types.principal(`${deployer.address}.loan-v1-0`)
      ],
      deployer.address
    ),
    // Tx.contractCall(
    //   `${deployer.address}.coll-vault`,
    //   'set-loan-contract',
    //   [
    //     types.principal(`${deployer.address}.loan-v1-0`)
    //   ],
    //   deployer.address
    // ),
    Tx.contractCall(
      `${deployer.address}.loan-v1-0`,
      'set-pool-contract',
      [
        types.principal(`${deployer.address}.pool-v1-0`)
      ],
      deployer.address
    ),
  ]);
}

function runBootstrap(chain: Chain, deployer: Account) {
  return chain.mineBlock([
    Tx.contractCall(
      `${deployer.address}.executor-dao`,
      'construct',
      [
        types.principal(`${deployer.address}.zgp000-bootstrap`)
      ],
      deployer.address
    ),
  ]);
}

function registerSupplierTxs(
  deployer: string,
  supplierAddress: string,
  recipient: string,
  inboundFee: number,
  outboundFee: number,
  outboundBaseFee: number,
  inboundBaseFee: number,
  name: string,
  funds: number,
  ) {
    return [
      Tx.contractCall(
        "Wrapped-Bitcoin",
        "transfer",
        [
          types.uint(funds),
          types.principal(supplierAddress),
          types.principal(`${deployer}.supplier-interface`),
          types.none(),
        ],
        supplierAddress
      ),
      SupplierInterface.registerSupplier(
        recipient,
        inboundFee,
        outboundFee,
        outboundBaseFee,
        inboundBaseFee,
        name,
        funds,
        deployer
      ),
    ];
}

function sendFundsP2SHTxs(
  deployer: string,
  tokenId: number,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  factor: number,
  height: number
  ) {
  let hash = getHash(preimage);
  let tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  let txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),
    SupplierInterface.sendFunds(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      stxSender,
    ),
    SupplierInterface.sendFundsFinalize(
      txid1,
      preimage,
      factor,
      `${deployer}.lp-token`,
      tokenId,
      `${deployer}.zest-reward-dist`,
      `${deployer}.liquidity-vault-v1-0`,
      `${deployer}.Wrapped-Bitcoin`,
      `${deployer}.rewards-calc`,
      stxSender
    )
  ];
}


function sendFundsP2SHTxsWrap(
  deployer: string,
  tokenId: number,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  factor: number,
  height: number
  ) {
  let hash = getHash(preimage);
  let tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  let txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),
    SupplierInterface.sendFundsWrap(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      preimage,
      factor,
      `${deployer}.lp-token`,
      tokenId,
      `${deployer}.zest-reward-dist`,
      `${deployer}.liquidity-vault-v1-0`,
      `${deployer}.Wrapped-Bitcoin`,
      `${deployer}.rewards-calc`,
      stxSender
    )
  ];
}

function makePaymentTxs(
  deployer: string,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  loanId: number,
  payment: string,
  lpToken: string,
  lv: string,
  tokenId: number,
  cpToken: string,
  cpRewards: string,
  zpToken: string,
  swapRouter: string,
  height: number,
  xbtc: string,
  ) {
  const hash = getHash(preimage);
  const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  const txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),

    // 1. Send Bitcoin to supplier address.
    // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
    SupplierInterface.sendFunds(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      stxSender
    ),
    // 3. Liquidity Provider send Stacks transaction to send funds to pool
    SupplierInterface.makePayment(
      txid1,
      preimage,
      loanId,
      payment,
      lpToken,
      lv,
      tokenId,
      cpToken,
      cpRewards,
      zpToken,
      swapRouter,
      xbtc,
      stxSender
    )
  ];
}


function makePaymentVerifyTxs(
  deployer: string,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  loanId: number,
  payment: string,
  lpToken: string,
  lv: string,
  tokenId: number,
  cpToken: string,
  cpRewards: string,
  zpToken: string,
  swapRouter: string,
  height: number,
  xbtc: string,
  ) {
  const hash = getHash(preimage);
  const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  const txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),

    // 1. Send Bitcoin to supplier address.
    // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
    SupplierInterface.sendFunds(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      stxSender
    ),
    // 3. Liquidity Provider send Stacks transaction to send funds to pool
    SupplierInterface.makePaymentVerify(
      txid1,
      preimage,
      loanId,
      payment,
      lpToken,
      lv,
      tokenId,
      cpToken,
      cpRewards,
      zpToken,
      swapRouter,
      xbtc,
      stxSender
    )
  ];
}

function makeFullPaymentTxs(
  deployer: string,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  loanId: number,
  payment: string,
  lpToken: string,
  lv: string,
  tokenId: number,
  cpToken: string,
  cpRewards: string,
  zpToken: string,
  swapRouter: string,
  height: number,
  xbtc: string,
  ) {
  const hash = getHash(preimage);
  const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  const txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),

    // 1. Send Bitcoin to supplier address.
    // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
    SupplierInterface.sendFunds(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      stxSender
    ),
    // 3. Liquidity Provider send Stacks transaction to send funds to pool
    SupplierInterface.makeFullPayment(
      txid1,
      preimage,
      loanId,
      payment,
      lpToken,
      lv,
      tokenId,
      cpToken,
      cpRewards,
      zpToken,
      swapRouter,
      xbtc,
      stxSender
    )
  ];
}

function makeResidualPayment(
  deployer: string,
  stxSender: string,
  sender: string,
  recipient: string,
  expiration: number,
  swapperId: number,
  outputValue: number,
  preimage: string,
  supplierId: number,
  minToReceive: number,
  loanId: number,
  // payment: string,
  lpToken: string,
  lv: string,
  tokenId: number,
  // cpToken: string,
  // cpRewards: string,
  // zpToken: string,
  // swapRouter: string,
  height: number,
  xbtc: string,
  ) {
  const hash = getHash(preimage);
  const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
  const txid1 = getTxId(tx1);
  return [
    TestUtils.setMinedTx(txid1, deployer),

    // 1. Send Bitcoin to supplier address.
    // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
    SupplierInterface.sendFunds(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      sender,
      recipient,
      getExpiration(expiration),
      hash,
      swapperBuff(swapperId),
      supplierId,
      minToReceive,
      stxSender
    ),
    // 3. Liquidity Provider send Stacks transaction to send funds to pool
    SupplierInterface.makeResidualPayment(
      txid1,
      preimage,
      loanId,
      lpToken,
      lv,
      tokenId,
      xbtc,
      stxSender
    )
  ];
}

function finalizeOutboundTxs(
  pubkeyHash: string,
  outputValue: number,
  swapId: number,
  height: number,
  stxSender: string,
  deployer: string,
  ) {
  let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
  let txid1 = getTxId(tx1);

  return [
    TestUtils.setMinedTx(txid1, deployer),
    SupplierInterface.finalizeOutbound(
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      swapId,
      stxSender
    )
  ]
}

function finalizeDrawdown(
  loanId: number,
  lpToken: string,
  tokenId: number,
  collToken: string,
  collVault: string,
  fv: string,
  xbtcFt: string,
  pubkeyHash: string,
  outputValue: number,
  swapId: number,
  height: number,
  stxSender: string,
  deployer: string,
  ) {
  let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
  let txid1 = getTxId(tx1);

  return [
    TestUtils.setMinedTx(txid1, deployer),
    SupplierInterface.finalizeDrawdown(
      loanId,
      lpToken,
      tokenId,
      collToken,
      collVault,
      fv,
      xbtcFt,
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      swapId,
      stxSender
    )
  ]
}

function finalizeRollover(
  loanId: number,
  lpToken: string,
  tokenId: number,
  collToken: string,
  collVault: string,
  fv: string,
  xbtcFt: string,
  pubkeyHash: string,
  outputValue: number,
  swapId: number,
  height: number,
  stxSender: string,
  deployer: string,
  ) {
  let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
  let txid1 = getTxId(tx1);

  return [
    TestUtils.setMinedTx(txid1, deployer),
    SupplierInterface.finalizeRollover(
      loanId,
      lpToken,
      tokenId,
      collToken,
      collVault,
      fv,
      xbtcFt,
      { header: "", height },
      [],
      tx1,
      { "tx-index": 0, "hashes": [], "tree-depth": 0 },
      0,
      swapId,
      stxSender
    )
  ]
}

function bootstrapApprovedContracts(chain: Chain, deployer: Account) {
  addApprovedContract(chain, "zest-reward-dist", "loan-v1-0", deployer);
  addApprovedContract(chain, "zest-reward-dist", "pool-v1-0", deployer);
  addApprovedContract(chain, "zest-reward-dist", "payment-fixed", deployer);
  addApprovedContract(chain, "lp-token", "loan-v1-0", deployer);
  addApprovedContract(chain, "lp-token", "pool-v1-0", deployer);
  addApprovedContract(chain, "lp-token", "payment-fixed", deployer);
  addApprovedContract(chain, "lp-token", "supplier-interface", deployer);
  addApprovedContract(chain, "payment-fixed", "loan-v1-0", deployer);
  addApprovedContract(chain, "liquidity-vault-v1-0", "lp-token", deployer);
  addApprovedContract(chain, "liquidity-vault-v1-0", "pool-v1-0", deployer);
  addApprovedContract(chain, "cp-token", "payment-fixed", deployer);
  addApprovedContract(chain, "cp-token", "pool-v1-0", deployer);
  addApprovedContract(chain, "cp-token", "staking-pool-v1-0", deployer);
  addApprovedContract(chain, "rewards-calc", "pool-v1-0", deployer);
  addApprovedContract(chain, "rewards-calc", "cover-pool-v1-0", deployer);
  addApprovedContract(chain, "funding-vault", "loan-v1-0", deployer);
  addApprovedContract(chain, "coll-vault", "loan-v1-0", deployer);

  setPoolContract(chain, "loan-v1-0", "pool-v1-0", deployer);
  setPoolContract(chain, "cover-pool-v1-0", "pool-v1-0", deployer);
}

function consumeUint(uint: string | String) {
  return Number(uint.replace("u", ""));
}

export {
  setContractOwner,
  initContractOwners,
  addBorrower,
  addApprovedContract,
  runBootstrap,
  bootstrapApprovedContracts,
  sendFundsP2SHTxs,
  registerSupplierTxs,
  setPoolContract,
  finalizeOutboundTxs,
  makePaymentTxs,
  consumeUint,
  finalizeDrawdown,
  finalizeRollover,
  getBP,
  sendFundsP2SHTxsWrap,
  makeFullPaymentTxs,
  makeResidualPayment,
  makePaymentVerifyTxs,
};