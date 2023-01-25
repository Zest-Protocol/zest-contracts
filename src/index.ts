// import { drawdownSteps } from "./drawdown";
// import { sendFundsSteps } from "./send-funds.js"
// import { generateRandomBitcoinSigner } from "./util";
import { initializePoolSteps } from "./initialize-pool.js";

const deploymentScript = process.argv[2] as string;

(async function () {
  // let signers;
  switch(deploymentScript) {
    case "initialize-pool":
      await initializePoolSteps();
      break;
    case "send-funds":
      // signers = { supplierBtcSigner: await initializePoolSteps() };
      // await sendFundsSteps(signers.supplierBtcSigner);
      break;
    case "drawdown":
      // signers = await initializePoolSteps();
      // await sendFundsSteps(signers.supplierBtcSigner, signers.lp1BtcSigner);
      // await drawdownSteps(signers.supplierBtcSigner, signers.lp1BtcSigner);
      break;
    default:
      console.error("Invalid deployment script");
      process.exit(1);
  }
  console.log("OK!")
})()