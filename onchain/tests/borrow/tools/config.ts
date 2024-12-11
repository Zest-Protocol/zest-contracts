// assets
export const diko = "diko";
export const sBTC = "sbtc";
export const stSTX = "ststx";
export const USDA = "usda";
export const xUSD = "xusd";
export const wstx = "wstx";

// z tokens
export const zDikoV0 = "zdiko";
export const zDikoV1 = "zdiko-v1";
export const zDikoV1_2 = "zdiko-v1-2";
export const zDiko = zDikoV1_2;

export const zSbtcV0 = "zsbtc";
export const zSbtcV1 = "zsbtc-v1";
export const zSbtcV1_2 = "zsbtc-v1-2";
export const zSbtc = zSbtcV1_2;

export const zStstxV0 = "zststx";
export const zStstxV1 = "zststx-v1";
export const zStstxV1_2 = "zststx-v1-2";
export const zStstx = zStstxV1_2;

export const zUsdaV0 = "zusda";
export const zUsdaV1 = "zusda-v1";
export const zUsdaV1_2 = "zusda-v1-2";
export const zUsda = zUsdaV1_2;

export const zwstxV0 = "zwstx";
export const zwstxv1 = "zwstx-v1";
export const zwstxv1_2 = "zwstx-v1-2";
export const zwstx = zwstxv1_2;

export const zXusdV0 = "zxusd";
export const zXusdV1 = "zxusd-v1";
export const zXusdV1_2 = "zxusd-v1-2";
export const zXusd = zXusdV1_2;

// lp tokens
export const lpDikoV0 = "lp-diko";
export const lpDikoV1 = "lp-diko-v1";
export const lpDikoV1_2 = "lp-diko-v1-2";
export const lpDikoV2_0 = "lp-diko-v2";
export const lpDikoV3_0 = "lp-diko-v3";
export const lpDiko = lpDikoV3_0;

export const lpDikoToken = "lp-diko-token";

export const lpSbtcV0 = "lp-sbtc";
export const lpSbtcV1 = "lp-sbtc-v1";
export const lpSbtcV1_2 = "lp-sbtc-v1-2";
export const lpSbtcV2_0 = "lp-sbtc-v2";
export const lpSbtcV3_0 = "lp-sbtc-v3";
export const lpSbtc = lpSbtcV3_0;

export const lpSbtcToken = "lp-sbtc-token";

export const lpStstxV0 = "lp-ststx";
export const lpStstxV1 = "lp-ststx-v1";
export const lpStstxV1_2 = "lp-ststx-v1-2";
export const lpStstxV2_0 = "lp-ststx-v2";
export const lpStstxV3_0 = "lp-ststx-v3";
export const lpStstx = lpStstxV3_0;

export const lpStstxToken = "lp-ststx-token";

export const lpUsdaV0 = "lp-usda";
export const lpUsdaV1 = "lp-usda-v1";
export const lpUsdaV1_2 = "lp-usda-v1-2";
export const lpUsdaV2_0 = "lp-usda-v2";
export const lpUsdaV3_0 = "lp-usda-v3";
export const lpUsda = lpUsdaV3_0;

export const lpUsdaToken = "lp-usda-token";

export const lpwstxV0 = "lp-wstx";
export const lpwstxv1 = "lp-wstx-v1";
export const lpwstxv1_2 = "lp-wstx-v1-2";
export const lpwstxv2_0 = "lp-wstx-v2";
export const lpwstxv3_0 = "lp-wstx-v3";
export const lpwstx = lpwstxv3_0;

export const lpwstxToken = "lp-wstx-token";

export const lpXusdV0 = "lp-xusd";
export const lpXusdV1 = "lp-xusd-v1";
export const lpXusdV1_2 = "lp-xusd-v1-2";
export const lpXusdV2_0 = "lp-xusd-v2";
export const lpXusdV3_0 = "lp-xusd-v3";
export const lpXusd = lpXusdV3_0;

export const lpXusdToken = "lp-xusd-token";

export const pool0ReserveV0 = "pool-0-reserve";
export const pool0ReserveV1_2 = "pool-0-reserve-v1-2";
export const pool0ReserveV2 = "pool-0-reserve-v2-0";
export const pool0Reserve = pool0ReserveV2;

export const borrowHelperV1 = "borrow-helper";
export const borrowHelperV1_2 = "borrow-helper-v1-2";
export const borrowHelperV1_3 = "borrow-helper-v1-3";
export const borrowHelperV2_0 = "borrow-helper-v2-0";
export const borrowHelper = borrowHelperV2_0;

export const poolBorrowV0 = "pool-borrow";
export const poolBorrowV1_2 = "pool-borrow-v1-2";
export const poolBorrowV2_0 = "pool-borrow-v2-0";
export const poolBorrow = poolBorrowV2_0;

export const poolReserveData = "pool-reserve-data";
export const poolReserveData1 = "pool-reserve-data-1";
export const poolReserveData2 = "pool-reserve-data-2";

export const mathV0 = "math";
export const mathV1_2 = "math-v1-2";
export const mathV2_0 = "math-v2-0";
export const math = mathV1_2;

export const pool0ReserveRead = "pool-0-reserve-read";

// migrating to v1-2
export const migrateV0ToV1FilePath = `contracts/borrow/production/mocks/migrate-v0-v1.clar`;
export const migrateV1ToV2FilePath = `contracts/borrow/production/mocks/migrate-v1-v2.clar`;
export const migrateV2ToV3FilePath = `contracts/borrow/production/mocks/migrate-v2-v3.clar`;

// initialize assets to v1-2
export const initContractsToV1_2 = `contracts/borrow/production/mocks/init_scripts/upgrade-contract-v1-v2.clar`;
// initialize assets to v2
export const initContractsToV2 = `contracts/borrow/production/mocks/init_scripts/upgrade-contract-v1-v2-v3.clar`;
export const reserveExtraVariables = `contracts/borrow/production/mocks/init_scripts/set-reserve-extra-variables.clar`;

// math nakamoto
export const mathV2_0_path = `contracts/borrow/production/math/math.clar`;
export const pool0ReserveV2_0_path = `contracts/borrow/production/vaults/pool-0-reserve-v2-0.clar`;
export const pool0ReserveRead_path = `contracts/borrow/production/mocks/read-only/pool-0-reserve-read.clar`;

// v3 nakamoto
export const lp_ststx_v3_path = `contracts/borrow/production/mocks/ztoken/lp-ststx.clar`;
export const lp_sbtc_v3_path  = `contracts/borrow/production/mocks/ztoken/lp-sbtc.clar`;
export const lp_diko_v3_path  = `contracts/borrow/production/mocks/ztoken/lp-diko.clar`;
export const lp_usda_v3_path  = `contracts/borrow/production/mocks/ztoken/lp-usda.clar`;
export const lp_wstx_v3_path  = `contracts/borrow/production/mocks/ztoken/lp-wstx.clar`;
export const lp_xusd_v3_path  = `contracts/borrow/production/mocks/ztoken/lp-xusd.clar`;

export const lp_diko_token_path = `contracts/borrow/production/mocks/ztoken/lp-diko-token.clar`;
export const lp_sbtc_token_path = `contracts/borrow/production/mocks/ztoken/lp-sbtc-token.clar`;
export const lp_ststx_token_path = `contracts/borrow/production/mocks/ztoken/lp-ststx-token.clar`;
export const lp_usda_token_path = `contracts/borrow/production/mocks/ztoken/lp-usda-token.clar`;
export const lp_wstx_token_path = `contracts/borrow/production/mocks/ztoken/lp-wstx-token.clar`;
export const lp_xusd_token_path = `contracts/borrow/production/mocks/ztoken/lp-xusd-token.clar`;

export const pool_borrow_v2_0_path = `contracts/borrow/production/pool/pool-borrow.clar`;
export const borrow_helper_v2_0_path = `contracts/borrow/production/wrappers/borrow-helper.clar`;
export const liquidation_manager_v2_0_path = `contracts/borrow/production/pool/liquidation-manager.clar`;
export const pool_reserve_data_2_path = `contracts/borrow/production/reserve-data/pool-reserve-data-2.clar`;

export const oracle = "oracle";

export const max_value = BigInt("340282366920938463463374607431768211455");
