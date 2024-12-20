import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl} from "@stacks/transactions";
import { readFileSync } from "fs";
import * as config from "./config";

export const deployV2Contracts = (simnet: Simnet, deployerAddress: string) => {
  simnet.deployContract(
    "math-v2-0",
    readFileSync(config.mathV2_0_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pool-reserve-data-2",
    readFileSync(config.pool_reserve_data_2_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pool-0-reserve-v2-0",
    readFileSync(config.pool0ReserveV2_0_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "liquidation-manager-v2-0",
    readFileSync(config.liquidation_manager_v2_0_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  let callResponse = simnet.deployContract(
    "pool-0-reserve-read",
    readFileSync(config.pool0ReserveRead_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  // console.log(Cl.prettyPrint(callResponse.result));
  simnet.deployContract(
    "pool-borrow-v2-0",
    readFileSync(config.pool_borrow_v2_0_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "borrow-helper-v2-0",
    readFileSync(config.borrow_helper_v2_0_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
}

export const deployV2TokenContracts = (simnet: Simnet, deployerAddress: string) => {
  simnet.deployContract(
    "lp-diko-token",
    readFileSync(config.lp_diko_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-diko-v3",
    readFileSync(config.lp_diko_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-sbtc-token",
    readFileSync(config.lp_sbtc_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-sbtc-v3",
    readFileSync(config.lp_sbtc_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-ststx-token",
    readFileSync(config.lp_ststx_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-ststx-v3",
    readFileSync(config.lp_ststx_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-usda-token",
    readFileSync(config.lp_usda_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-usda-v3",
    readFileSync(config.lp_usda_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-wstx-token",
    readFileSync(config.lp_wstx_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-wstx-v3",
    readFileSync(config.lp_wstx_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-xusd-token",
    readFileSync(config.lp_xusd_token_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "lp-xusd-v3",
    readFileSync(config.lp_xusd_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
}
