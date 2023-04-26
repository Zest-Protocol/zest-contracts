import { drawdownSteps } from "./drawdown.js";
// import { generateRandomBitcoinSigner } from "./util";
import { sendFundsSteps } from "./send-funds.js"
import { initializePoolSteps } from "./initialize-pool.js";

const deploymentScript = process.argv[2] as string;

(async function () {
  let signers;
  switch(deploymentScript) {
    case "initialize-pool":
      await initializePoolSteps();
      break;
    case "send-funds":
      signers = await initializePoolSteps();
      signers = await sendFundsSteps(signers?.supplierBtcPrivKey as Buffer);
      break;
    case "drawdown":
      signers = await initializePoolSteps();
      signers = await sendFundsSteps(signers?.supplierBtcPrivKey as Buffer);
      await drawdownSteps(signers?.supplierBtcPrivKey as Buffer, signers?.lp1BtcPrivKey as Buffer);
      break;
    default:
      console.error("Invalid deployment script");
      process.exit(1);
  }
  console.log("OK!")
})()