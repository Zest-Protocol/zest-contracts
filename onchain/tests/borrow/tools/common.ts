import { Simnet, tx } from "@hirosystems/clarinet-sdk";
import { Cl, cvToValue, cvToJSON} from "@stacks/transactions";
import { readFileSync } from "fs";
import * as config from "./config";
import { sBTC, stSTX, wstx, xUSD } from "./config";
import { list } from "@stacks/transactions/dist/cl";

const one_day = 144;

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
    "pool-reserve-data-3",
    readFileSync(config.pool_reserve_data_3_path).toString(),
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
  simnet.deployContract(
    "liquidation-manager-v2-1",
    readFileSync(config.liquidation_manager_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
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

export const deployV2_1Contracts = (simnet: Simnet, deployerAddress: string) => {
  simnet.deployContract(
    "pool-borrow-v2-1",
    readFileSync(config.pool_borrow_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "incentives-trait",
    readFileSync(config.incentives_trait_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "rewards-data",
    readFileSync(config.rewards_data_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "incentives-dummy",
    readFileSync(config.incentives_dummy_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "incentives",
    readFileSync(config.incentives_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "incentives-2",
    readFileSync(config.incentives_2_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "borrow-helper-v2-1",
    readFileSync(config.borrow_helper_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
}

export const deployPythContracts = (simnet: Simnet, deployerAddress: string) => {
  simnet.deployContract(
    "hk-cursor-v2",
    readFileSync(config.hk_cursor_v2_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "hk-ecc-v1",
    readFileSync(config.hk_ecc_v1_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "hk-merkle-tree-keccak160-v1",
    readFileSync(config.hk_merkle_tree_keccak160_v1_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "wormhole-traits-v1",
    readFileSync(config.wormhole_traits_v1_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "wormhole-core-v3",
    readFileSync(config.wormhole_core_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pyth-traits-v1",
    readFileSync(config.pyth_traits_v1_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pyth-governance-v2",
    readFileSync(config.pyth_governance_v2_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pyth-storage-v3",
    readFileSync(config.pyth_storage_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pyth-pnau-decoder-v2",
    readFileSync(config.pyth_pnau_decoder_v2_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
  simnet.deployContract(
    "pyth-oracle-v3",
    readFileSync(config.pyth_oracle_v3_path).toString(),
    {
      clarityVersion: 3,
    },
    deployerAddress
  );
}

export const initializeRewards = (simnet: Simnet, deployerAddress: string) => {
  simnet.callPublicFn(
    config.rewardsData,
    "set-rewards-contract",
    [
      Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
    ],
    deployerAddress
  );
}

export const initPyth = (simnet: Simnet, deployerAddress: string) => {
  let block = simnet.mineBlock([
    tx.callPublicFn(
      `${deployerAddress}.${config.wormholeCore}`,
      'update-guardians-set', 
      [
        Cl.bufferFromHex('01000000020d00ce45474d9e1b1e7790a2d210871e195db53a70ffd6f237cfe70e2686a32859ac43c84a332267a8ef66f59719cf91cc8df0101fd7c36aa1878d5139241660edc0010375cc906156ae530786661c0cd9aef444747bc3d8d5aa84cac6a6d2933d4e1a031cffa30383d4af8131e929d9f203f460b07309a647d6cd32ab1cc7724089392c000452305156cfc90343128f97e499311b5cae174f488ff22fbc09591991a0a73d8e6af3afb8a5968441d3ab8437836407481739e9850ad5c95e6acfcc871e951bc30105a7956eefc23e7c945a1966d5ddbe9e4be376c2f54e45e3d5da88c2f8692510c7429b1ea860ae94d929bd97e84923a18187e777aa3db419813a80deb84cc8d22b00061b2a4f3d2666608e0aa96737689e3ba5793810ff3a52ff28ad57d8efb20967735dc5537a2e43ef10f583d144c12a1606542c207f5b79af08c38656d3ac40713301086b62c8e130af3411b3c0d91b5b50dcb01ed5f293963f901fc36e7b0e50114dce203373b32eb45971cef8288e5d928d0ed51cd86e2a3006b0af6a65c396c009080009e93ab4d2c8228901a5f4525934000b2c26d1dc679a05e47fdf0ff3231d98fbc207103159ff4116df2832eea69b38275283434e6cd4a4af04d25fa7a82990b707010aa643f4cf615dfff06ffd65830f7f6cf6512dabc3690d5d9e210fdc712842dc2708b8b2c22e224c99280cd25e5e8bfb40e3d1c55b8c41774e287c1e2c352aecfc010b89c1e85faa20a30601964ccc6a79c0ae53cfd26fb10863db37783428cd91390a163346558239db3cd9d420cfe423a0df84c84399790e2e308011b4b63e6b8015010ca31dcb564ac81a053a268d8090e72097f94f366711d0c5d13815af1ec7d47e662e2d1bde22678113d15963da100b668ba26c0c325970d07114b83c5698f46097010dc9fda39c0d592d9ed92cd22b5425cc6b37430e236f02d0d1f8a2ef45a00bde26223c0a6eb363c8b25fd3bf57234a1d9364976cefb8360e755a267cbbb674b39501108db01e444ab1003dd8b6c96f8eb77958b40ba7a85fefecf32ad00b7a47c0ae7524216262495977e09c0989dd50f280c21453d3756843608eacd17f4fdfe47600001261025228ef5af837cb060bcd986fcfa84ccef75b3fa100468cfd24e7fadf99163938f3b841a33496c2706d0208faab088bd155b2e20fd74c625bb1cc8c43677a0163c53c409e0c5dfa000100000000000000000000000000000000000000000000000000000000000000046c5a054d7833d1e42000000000000000000000000000000000000000000000000000000000436f7265020000000000031358cc3ae5c097b213ce3c81979e1b9f9570746aa5ff6cb952589bde862c25ef4392132fb9d4a42157114de8460193bdf3a2fcf81f86a09765f4762fd1107a0086b32d7a0977926a205131d8731d39cbeb8c82b2fd82faed2711d59af0f2499d16e726f6b211b39756c042441be6d8650b69b54ebe715e234354ce5b4d348fb74b958e8966e2ec3dbd4958a7cd15e7caf07c4e3dc8e7c469f92c8cd88fb8005a2074a3bf913953d695260d88bc1aa25a4eee363ef0000ac0076727b35fbea2dac28fee5ccb0fea768eaf45ced136b9d9e24903464ae889f5c8a723fc14f93124b7c738843cbb89e864c862c38cddcccf95d2cc37a4dc036a8d232b48f62cdd4731412f4890da798f6896a3331f64b48c12d1d57fd9cbe7081171aa1be1d36cafe3867910f99c09e347899c19c38192b6e7387ccd768277c17dab1b7a5027c0b3cf178e21ad2e77ae06711549cfbb1f9c7a9d8096e85e1487f35515d02a92753504a8d75471b9f49edb6fbebc898f403e4773e95feb15e80c9a99c8348d'), 
        Cl.list(
          [
            Cl.bufferFromHex('2a953a2e8b1052eb70c1d7b556b087deed598b55608396686c1c811b9796c763078687ce10459f4f25fb7a0fbf8727bb0fb51e00820e93a123f652ee843cf08d'),
            Cl.bufferFromHex('2766db08820e311b22e109801ab8ea505b12e3df3d91ebc87c999ffb6929d1abb0ade987c74aa37db26eea4086ee738a2f34a5594edb8760da0eac5be356b731'),
            Cl.bufferFromHex('54177ff4a8329520b76efd86f8bfce5c942554db16e673267dc1133b3f5e230b2d8cbf90fe274946045d4491de288d736680edc2ee9ee5b1b15416b0a34806c4'),
            Cl.bufferFromHex('7fa3e98fcc2621337b217b61408a98facaabd25bad2b158438728ce863c14708cfcda1f3b50a16ca0211199079fb338d479a54546ec3c5f775af23a7d7f4fb24'),
            Cl.bufferFromHex('0bdcbccc0297c2a4f92a7c39358c42f22a8ed700a78bd05c39c8b61aaf2338e825b6c0d26d1f2a2ae4129cd751201f73d7234c753bd0735212a5288b19748fd2'),
            Cl.bufferFromHex('cfd90084be68de514fe14a7c281f492223f045566f859ea5c166d6e60bc650c23940909a8e96c2fbffbd15a598b4e6a5b5aa14c126bf58cc1a9e396fe7771965'),
            Cl.bufferFromHex('8edf3f9d997357a0e2c916ee090392c3a645ebac4f6cd8f826d3ecc0173b33bf06b7c14e8002fc9a5d01af9824a5cb3778472cd477e0ab378091448bca6f0417'),
            Cl.bufferFromHex('47b15c5039dcb2850b59bea323db662cc597dd7d48fe6b8dbb6cd8704c45854bf0e92fa267c844ba1a700105e157c8099d55c82316cb5e50c56a5d0920ff91c2'),
            Cl.bufferFromHex('d5225476d7849b362226952ffc561bab99832f3f8b99741f6d81bbeaffa8e7f6e54a85e5029a3b510707eaa9684df496e4b1268075ad0328693a30bf1b1e0033'),
            Cl.bufferFromHex('d9fa78b5b958bea1929080b8ad96dc555d34b051a27aebf711eb1186b807b0448316d994606ac807121838d6c41a58f308bc6307acdf69491fa4b17282f3e66f'),
            Cl.bufferFromHex('cc64af75ec2e2741fb9af9f6191cb9ee187d6d26af4d1e96d7bab47e6ec09be12d3192030dc4bbf54d1da319a7a2acfc7a9dd4c644af6646a4aaa02b1024bbab'),
            Cl.bufferFromHex('b5943b6e284682ad2e011d6962d41febf86af2f5fc0c9c8f4b81358ff077f9c96ba0880eaf93541eae94b4fa41dba66dab7fb0201cc9af7c75681e5719b0c95f'),
            Cl.bufferFromHex('0cfc9d5b5dcf702a1525f9d4ed1841e8eb8b34434cc82470dd35435f1dbdc73ffb51544b7500394eac9c7fa567868b495326075147a2d809ebbfd43273eeec91'),
            Cl.bufferFromHex('0aa78894d894a15933969f5826347439e2c309f2049277a10066c9197840499498ad19ee3d1b291f932ec0890bbdafcec292c4f02a446670cd0084f997e25e2f'),
            Cl.bufferFromHex('00f400e3fe40f64032485aad9240ead45a8e1fc83ec08c96db861c0eca155ac898df8673e778e3ccaae8a0f9e6af415fe40e99b0cbc88d7610e536b6041b07fb'),
            Cl.bufferFromHex('604f384174c7ed3a0dc5f476569a978266a7943bd775449d1b8b27f4eb8beb99cdf095f9200a2dabb1bc5d68c3d96ea3d47f4d34499d59953669b6c8c093d578'),
            Cl.bufferFromHex('4881345cbb299fa7c60ab2d16cb7fe7bf8d14675506ef6eb6037038b5b7092ea0a9e4d0b53ba3904edd99f86717d6ba81dffe44eb5b23c6fd22c91ab73c33021'),
            Cl.bufferFromHex('ee3d4cc17633afe7e1794fcfd728e0643325e3d130eb1daa39c0c5cb05a200b43876117a182cabdcc3795632aa529473a0c8245f9e4f6e43e54c3f1da28bcb82'),
            Cl.bufferFromHex('21f338444e96af31cf44958acf5764844efbddace3b823ed761c340c59ed2685d829818c83eebe8f00f783f1048a53515845536668a9e0c059ade7579a0f4204'),
          ]
        ),
      ], 
      deployerAddress
    ),
    tx.callPublicFn(
      `${deployerAddress}.${config.wormholeCore}`,
      'update-guardians-set', 
      [
        Cl.bufferFromHex('01000000030d03d4a37a6ff4361d91714730831e9d49785f61624c8f348a9c6c1d82bc1d98cadc5e936338204445c6250bb4928f3f3e165ad47ca03a5d63111168a2de4576856301049a5df10464ea4e1961589fd30fc18d1970a7a2ffaad617e56a0f7777f25275253af7d10a0f0f2494dc6e99fc80e444ab9ebbbee252ded2d5dcb50cbf7a54bb5a01055f4603b553b9ba9e224f9c55c7bca3da00abb10abd19e0081aecd3b352be061a70f79f5f388ebe5190838ef3cd13a2f22459c9a94206883b739c90b40d5d74640006a8fade3997f650a36e46bceb1f609edff201ab32362266f166c5c7da713f6a19590c20b68ed3f0119cb24813c727560ede086b3d610c2d7a1efa66f655bad90900080f5e495a75ea52241c59d145c616bfac01e57182ad8d784cbcc9862ed3afb60c0983ccbc690553961ffcf115a0c917367daada8e60be2cbb8b8008bac6341a8c010935ab11e0eea28b87a1edc5ccce3f1fac25f75b5f640fe6b0673a7cd74513c9dc01c544216cf364cc9993b09fda612e0cd1ced9c00fb668b872a16a64ebb55d27010ab2bc39617a2396e7defa24cd7c22f42dc31f3c42ffcd9d1472b02df8468a4d0563911e8fb6a4b5b0ce0bd505daa53779b08ff660967b31f246126ed7f6f29a7e000bdb6d3fd7b33bdc9ac3992916eb4aacb97e7e21d19649e7fa28d2dd6e337937e4274516a96c13ac7a8895da9f91948ea3a09c25f44b982c62ce8842b58e20c8a9000d3d1b19c8bb000856b6610b9d28abde6c35cb7705c6ca5db711f7be96d60eed9d72cfa402a6bfe8bf0496dbc7af35796fc768da51a067b95941b3712dce8ae1e7010ec80085033157fd1a5628fc0c56267469a86f0e5a66d7dede1ad4ce74ecc3dff95b60307a39c3bfbeedc915075070da30d0395def9635130584f709b3885e1bdc0010fc480eb9ee715a2d151b23722b48b42581d7f4001fc1696c75425040bfc1ffc5394fe418adb2b64bd3dc692efda4cc408163677dbe233b16bcdabb853a20843301118ee9e115e1a0c981f19d0772b850e666591322da742a9a12cce9f52a5665bd474abdd59c580016bee8aae67fdf39b315be2528d12eec3a652910e03cc4c6fa3801129d0d1e2e429e969918ec163d16a7a5b2c6729aa44af5dccad07d25d19891556a79b574f42d9adbd9e2a9ae5a6b8750331d2fccb328dd94c3bf8791ee1bfe85aa00661e99781981faea00010000000000000000000000000000000000000000000000000000000000000004fd4c6c55ec8dfd342000000000000000000000000000000000000000000000000000000000436f726502000000000004135893b5a76c3f739645648885bdccc06cd70a3cd3ff6cb952589bde862c25ef4392132fb9d4a42157114de8460193bdf3a2fcf81f86a09765f4762fd1107a0086b32d7a0977926a205131d8731d39cbeb8c82b2fd82faed2711d59af0f2499d16e726f6b211b39756c042441be6d8650b69b54ebe715e234354ce5b4d348fb74b958e8966e2ec3dbd4958a7cd15e7caf07c4e3dc8e7c469f92c8cd88fb8005a2074a3bf913953d695260d88bc1aa25a4eee363ef0000ac0076727b35fbea2dac28fee5ccb0fea768eaf45ced136b9d9e24903464ae889f5c8a723fc14f93124b7c738843cbb89e864c862c38cddcccf95d2cc37a4dc036a8d232b48f62cdd4731412f4890da798f6896a3331f64b48c12d1d57fd9cbe7081171aa1be1d36cafe3867910f99c09e347899c19c38192b6e7387ccd768277c17dab1b7a5027c0b3cf178e21ad2e77ae06711549cfbb1f9c7a9d8096e85e1487f35515d02a92753504a8d75471b9f49edb6fbebc898f403e4773e95feb15e80c9a99c8348d'),
        Cl.list(
          [
            Cl.bufferFromHex('9a1e801daa25d9808e70aae9981353086f958955cc94ef33a461b0e596feaef90a8474dd10cf6ae967143f86105c16d6304a3d268ea952fda9389139d4bb9da1'),
            Cl.bufferFromHex('2766db08820e311b22e109801ab8ea505b12e3df3d91ebc87c999ffb6929d1abb0ade987c74aa37db26eea4086ee738a2f34a5594edb8760da0eac5be356b731'),
            Cl.bufferFromHex('54177ff4a8329520b76efd86f8bfce5c942554db16e673267dc1133b3f5e230b2d8cbf90fe274946045d4491de288d736680edc2ee9ee5b1b15416b0a34806c4'),
            Cl.bufferFromHex('7fa3e98fcc2621337b217b61408a98facaabd25bad2b158438728ce863c14708cfcda1f3b50a16ca0211199079fb338d479a54546ec3c5f775af23a7d7f4fb24'),
            Cl.bufferFromHex('0bdcbccc0297c2a4f92a7c39358c42f22a8ed700a78bd05c39c8b61aaf2338e825b6c0d26d1f2a2ae4129cd751201f73d7234c753bd0735212a5288b19748fd2'),
            Cl.bufferFromHex('cfd90084be68de514fe14a7c281f492223f045566f859ea5c166d6e60bc650c23940909a8e96c2fbffbd15a598b4e6a5b5aa14c126bf58cc1a9e396fe7771965'),
            Cl.bufferFromHex('8edf3f9d997357a0e2c916ee090392c3a645ebac4f6cd8f826d3ecc0173b33bf06b7c14e8002fc9a5d01af9824a5cb3778472cd477e0ab378091448bca6f0417'),
            Cl.bufferFromHex('47b15c5039dcb2850b59bea323db662cc597dd7d48fe6b8dbb6cd8704c45854bf0e92fa267c844ba1a700105e157c8099d55c82316cb5e50c56a5d0920ff91c2'),
            Cl.bufferFromHex('d5225476d7849b362226952ffc561bab99832f3f8b99741f6d81bbeaffa8e7f6e54a85e5029a3b510707eaa9684df496e4b1268075ad0328693a30bf1b1e0033'),
            Cl.bufferFromHex('d9fa78b5b958bea1929080b8ad96dc555d34b051a27aebf711eb1186b807b0448316d994606ac807121838d6c41a58f308bc6307acdf69491fa4b17282f3e66f'),
            Cl.bufferFromHex('cc64af75ec2e2741fb9af9f6191cb9ee187d6d26af4d1e96d7bab47e6ec09be12d3192030dc4bbf54d1da319a7a2acfc7a9dd4c644af6646a4aaa02b1024bbab'),
            Cl.bufferFromHex('b5943b6e284682ad2e011d6962d41febf86af2f5fc0c9c8f4b81358ff077f9c96ba0880eaf93541eae94b4fa41dba66dab7fb0201cc9af7c75681e5719b0c95f'),
            Cl.bufferFromHex('0cfc9d5b5dcf702a1525f9d4ed1841e8eb8b34434cc82470dd35435f1dbdc73ffb51544b7500394eac9c7fa567868b495326075147a2d809ebbfd43273eeec91'),
            Cl.bufferFromHex('0aa78894d894a15933969f5826347439e2c309f2049277a10066c9197840499498ad19ee3d1b291f932ec0890bbdafcec292c4f02a446670cd0084f997e25e2f'),
            Cl.bufferFromHex('00f400e3fe40f64032485aad9240ead45a8e1fc83ec08c96db861c0eca155ac898df8673e778e3ccaae8a0f9e6af415fe40e99b0cbc88d7610e536b6041b07fb'),
            Cl.bufferFromHex('604f384174c7ed3a0dc5f476569a978266a7943bd775449d1b8b27f4eb8beb99cdf095f9200a2dabb1bc5d68c3d96ea3d47f4d34499d59953669b6c8c093d578'),
            Cl.bufferFromHex('4881345cbb299fa7c60ab2d16cb7fe7bf8d14675506ef6eb6037038b5b7092ea0a9e4d0b53ba3904edd99f86717d6ba81dffe44eb5b23c6fd22c91ab73c33021'),
            Cl.bufferFromHex('ee3d4cc17633afe7e1794fcfd728e0643325e3d130eb1daa39c0c5cb05a200b43876117a182cabdcc3795632aa529473a0c8245f9e4f6e43e54c3f1da28bcb82'),
            Cl.bufferFromHex('21f338444e96af31cf44958acf5764844efbddace3b823ed761c340c59ed2685d829818c83eebe8f00f783f1048a53515845536668a9e0c059ade7579a0f4204'),
          ]
        ),
      ], 
      deployerAddress
    )
  ]);

  return block;
}

export const setGracePeriodVars = (simnet: Simnet, deployerAddress: string) => {
  let callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-enabled",
    [Cl.contractPrincipal(deployerAddress, stSTX), Cl.bool(true)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-time",
    [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(one_day)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-enabled",
    [Cl.contractPrincipal(deployerAddress, sBTC), Cl.bool(true)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-time",
    [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(one_day)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-enabled",
    [Cl.contractPrincipal(deployerAddress, xUSD), Cl.bool(true)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-time",
    [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(one_day)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-enabled",
    [Cl.contractPrincipal(deployerAddress, wstx), Cl.bool(true)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-grace-period-time",
    [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(one_day)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-freeze-end-block",
    [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(simnet.burnBlockHeight)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-freeze-end-block",
    [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(simnet.burnBlockHeight)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-freeze-end-block",
    [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(simnet.burnBlockHeight)],
    deployerAddress
  );
  callResponse = simnet.callPublicFn(
    config.poolBorrow,
    "set-freeze-end-block",
    [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(simnet.burnBlockHeight)],
    deployerAddress
  );
}

export const getReserveState = async (simnet: Simnet, deployerAddress: string, asset: string) => {
  const callResponse = simnet.callReadOnlyFn(
    `${deployerAddress}.${config.poolReserveData}`,
    "get-reserve-state-read",
    [
      Cl.contractPrincipal(deployerAddress, asset)
    ],
    deployerAddress
  );
  const reserveState = cvToValue(callResponse.result).value;

  return {
    "a-token-address": Cl.contractPrincipal(
      reserveState['a-token-address'].value.split('.')[0],
      reserveState['a-token-address'].value.split('.')[1]
    ),
    "base-ltv-as-collateral": Cl.uint(reserveState['base-ltv-as-collateral'].value),
    "borrow-cap": Cl.uint(reserveState['borrow-cap'].value),
    "borrowing-enabled": Cl.bool(reserveState['borrowing-enabled'].value),
    "current-average-stable-borrow-rate": Cl.uint(reserveState['current-average-stable-borrow-rate'].value),
    "current-liquidity-rate": Cl.uint(reserveState['current-liquidity-rate'].value),
    "current-stable-borrow-rate": Cl.uint(reserveState['current-stable-borrow-rate'].value),
    "current-variable-borrow-rate": Cl.uint(reserveState['current-variable-borrow-rate'].value),
    "debt-ceiling": Cl.uint(reserveState['debt-ceiling'].value),
    "accrued-to-treasury": Cl.uint(reserveState['accrued-to-treasury'].value),
    decimals: Cl.uint(reserveState['decimals'].value),
    "flashloan-enabled": Cl.bool(reserveState['flashloan-enabled'].value),
    "interest-rate-strategy-address": Cl.contractPrincipal(
      reserveState['interest-rate-strategy-address'].value.split('.')[0],
      reserveState['interest-rate-strategy-address'].value.split('.')[1]
    ),
    "is-active": Cl.bool(reserveState['is-active'].value),
    "is-frozen": Cl.bool(reserveState['is-frozen'].value),
    "is-stable-borrow-rate-enabled": Cl.bool(reserveState['is-stable-borrow-rate-enabled'].value),
    "last-liquidity-cumulative-index": Cl.uint(reserveState['last-liquidity-cumulative-index'].value),
    "last-updated-block": Cl.uint(simnet.stacksBlockHeight),
    "last-variable-borrow-cumulative-index": Cl.uint(reserveState['last-variable-borrow-cumulative-index'].value),
    "liquidation-bonus": Cl.uint(reserveState['liquidation-bonus'].value),
    "liquidation-threshold": Cl.uint(reserveState['liquidation-threshold'].value),
    oracle: Cl.contractPrincipal(
      reserveState['oracle'].value.split('.')[0],
      reserveState['oracle'].value.split('.')[1]
    ),
    "supply-cap": Cl.uint(reserveState['supply-cap'].value),
    "total-borrows-stable": Cl.uint(reserveState['total-borrows-stable'].value),
    "total-borrows-variable": Cl.uint(reserveState['total-borrows-variable'].value),
    "usage-as-collateral-enabled": Cl.bool(reserveState['usage-as-collateral-enabled'].value),
  };
}