import { getWallets } from "./accounts";
import { networks, payments, Psbt, address, script as bScript } from 'bitcoinjs-lib';
import { generateBitcoinSignerFromStxPrivKey, generateRandomBitcoinSigner } from "./util";
import { blockchainRequest, generateHTLCAddress, generateRandomHexString, sendToAddress, waitForBitcoinBlock, waitForTxConfirmation } from "./bitcoin";
import { getPublicKeyFromPrivate, hashSha256Sync } from "@stacks/encryption";

const toSats = (amount: number) =>  amount * 10**8;

(async function() {
  let accounts = await getWallets();
  const lp1Account = accounts["lp"].accounts[0];
  const minerAccount = accounts["miner"].accounts[0];
  
  const network = networks.regtest;

  const supplierBtcSigner = generateRandomBitcoinSigner(network);
  const minerBtcSigner = generateBitcoinSignerFromStxPrivKey(network, minerAccount.stxPrivateKey);
  const lp1BtcSigner = generateRandomBitcoinSigner(network);
  const lp1StxAccountSigner = generateBitcoinSignerFromStxPrivKey(network, lp1Account.stxPrivateKey);
  const returnSigner = generateRandomBitcoinSigner(network);


  const minerAddress = payments.p2pkh({ pubkey: minerBtcSigner.publicKey, network }).address!;
  const lp1Address = payments.p2pkh({ pubkey: lp1BtcSigner.publicKey, network }).address!;
  const returnFundsAddress = payments.p2pkh({ pubkey: returnSigner.publicKey, network }).address!;

  let unspent = (await blockchainRequest("listunspent", [1, 99999999, [minerAddress]]))[0];

  let fundingTxid = await sendToAddress(unspent.txid, minerBtcSigner, minerAddress, unspent.vout, lp1Address, toSats(unspent.amount), toSats(5));
  await waitForTxConfirmation(fundingTxid);

  let preimage1 = Buffer.from(generateRandomHexString(20), "hex");
  let hash1 = hashSha256Sync(preimage1);

  const expiration = 4;

  const swap1Addr = generateHTLCAddress(
    Buffer.from(hash1),
    Buffer.from(getPublicKeyFromPrivate(lp1Account.stxPrivateKey), "hex"),
    supplierBtcSigner.publicKey,
    expiration,
    0
  )!;

  const htlcAmount = 1
  const htlcSatsAmount = toSats(1);

  let paymentTxId = await sendToAddress(fundingTxid, lp1BtcSigner, lp1Address, 0, swap1Addr.address!, toSats(5), htlcSatsAmount);
  let tx = await waitForTxConfirmation(paymentTxId);

  const script = address.toOutputScript(
    swap1Addr.address!,
    network,
  );

  await waitForBitcoinBlock();
  await waitForBitcoinBlock();
  await waitForBitcoinBlock();
  await waitForBitcoinBlock();
  await waitForBitcoinBlock();
  await waitForBitcoinBlock();

  let htlcOut = tx.vout.find((vout) => vout.scriptPubKey.hex == script.toString("hex") && vout.value == htlcAmount);

  if(htlcOut == undefined)
    throw("We didn't find the corresponding vout");

  const psbt = new Psbt({ network });
  const weight = 312;
  const feeRate = 3;
  const fee = weight * feeRate;

  psbt.addInput({
    hash: paymentTxId,
    index: htlcOut.n,
    nonWitnessUtxo: Buffer.from(tx.hex, "hex"),
    redeemScript: swap1Addr.redeem!.output,
    sequence: expiration
  });

  psbt.addOutput({
    address: returnFundsAddress,
    value: htlcSatsAmount - fee
  });

  psbt.signInput(0, lp1StxAccountSigner);

  psbt.finalizeInput(0, (index, input, script) => {
    const partialSigs = input.partialSig;
    if (!partialSigs) throw new Error('Error when finalizing HTLC input');
    const inputScript = bScript.compile([
      partialSigs[0].signature,
      Buffer.from('00', 'hex'), // OP_FALSE
    ]);
    const payment = payments.p2sh({
      redeem: {
        output: script,
        input: inputScript,
      },
    });
    return {
      finalScriptSig: payment.input,
      finalScriptWitness: undefined,
    };
  });

  let resultTxId = await blockchainRequest("sendrawtransaction", [psbt.extractTransaction().toHex()]);
  tx = await waitForTxConfirmation(resultTxId);
})();