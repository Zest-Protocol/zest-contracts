## pool-reserve-data-2.clar

This file is an addition to the pool-reserve-data.clar file. It is used to store the user's e-mode data.

#### user-e-mode (principal -> buff 1)
The user's e-mode is a boolean value that indicates whether the user has enabled e-mode for a given asset.

#### e-mode-types (buff 1 -> bool)
The e-mode-types is a boolean value that indicates whether the e-mode type is enabled.

#### asset-e-mode-type (principal -> buff 1)
The asset-e-mode-type is a buff 1 value that indicates the e-mode type for a given asset address.

STX, stSTX, and other STX derivative would have the same e-mode type. USDA, aeUSDC, and other USD stablecoins would have the same e-mode buffer value.

#### e-mode-type-config (buff 1 -> { ltv: uint, liquidation-threshold: uint })
The e-mode-type-config is a tuple that contains the ltv and liquidation-threshold for a given e-mode type. These are higher than the values from reserve-data in pool-reserve-data.clar.


## math.clar

This file contains the math functions to calculate interest and multiplication/division of large numbers.

### Changes

#### get-rt-by-block

This function is used to calculate the interest rate for a given block. It's adjusted for getting the timestamp from a stacks block height. An additional 5 seconds is added to the timestamp because it's not possible to get the current timestamp from a stacks block height only the timestamp from a previous block.


## pool-0-reserve.clar

### Additions

#### get-e-mode-config

It's used to get the ltv and liquidation threshold for a given user and asset. It gets the e-mode config if it's enabled on the user and the asset is of the same e-mode type. If not, it gets the base ltv and liquidation threshold from the reserve-data.

#### can-enable-e-mode

This function is used to check if the user can enable e-mode for a type of asset.

#### e-mode-type-enabled

This function is used to check if a given e-mode type is enabled in the protocol.

#### get-user-e-mode

This function is used to get the user's active e-mode.

#### is-in-e-mode

This function is used to check if the user is in e-mode.

#### get-asset-e-mode-type

This function is used to get the e-mode type for a given asset.

#### get-e-mode-type-config

This function is used to get the e-mode config for a given e-mode type.

#### e-mode-allows-borrowing

This function is used to check if the user can borrow a given asset. It checks if the user is in e-mode and if the e-mode type is enable and applies its ltv and liquidation threshold.

### Changes
Every instance of burn-block-height is replaced by stacks-block-height to reflect the new use of timestamps. Now using math-v2-0 library instead of math-v1-2.

#### check-balance-decrease-allowed

This function is used to check if the user can decrease their balance of a given asset. It's used to check if the user can decrease their balance of a given asset before repaying a borrow. It now checks if the user is in e-mode and if the e-mode type is enable and applies its ltv and liquidation threshold.


## liquidation-manager.clar

### Changes
Functions are now using math-v2-0 library instead of math-v1-2, pool-borrow-v2-0 instead of pool-borrow-v1-2 and pool-reserve-v2-0 instead of pool-reserve-v1-2.

## pool-borrow.clar

### Additions

#### set-e-mode

This function is used to set the user's e-mode for a given asset. It's used to set the user's e-mode for a given asset before borrowing. It checks if the user can enable e-mode for a type of asset and if the user is not borrowing any assets of the same e-mode type. Checks if the health factor does not go below the threshold with the new e-mode.

### Changes

#### borrow
This function is used to borrow a given asset. Checks if the user is in e-mode and if the e-mode type is enable and applies its ltv and liquidation threshold.

#### flashloan
The function now forces the transfer of assets to the vault.


# Z tokens and the separation of logic and token storage

Every token has a *-token.clar (e.g. lp-ststx-token.clar) that contains the base fungible token logic of transfer, mint, burn. These actions are permitted by approved contracts.

The logic token (e.g. lp-ststx.clar) contains the logic used by the core zest contracts. These rules are enforced here. These are meant to to upgraded.


