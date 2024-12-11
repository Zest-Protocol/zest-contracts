;; Used to simulate mainnet migration from v1 to v2 in the test suite
;; Must be called after deploying migrate-v0-v1.clar

(define-data-var executed bool false)

(define-constant ststx-address .ststx)
(define-constant usda-address .usda)
(define-constant sbtc-address .sbtc)
(define-constant xusd-address .xusd)
(define-constant diko-address .diko)
(define-constant wstx-address .wstx)

(define-constant v0-version-ststx .lp-ststx)
(define-constant v1-version-ststx .lp-ststx-v1)
(define-constant v2-version-ststx .lp-ststx-v2)
(define-constant v3-version-ststx .lp-ststx-v3)

(define-constant v0-version-usda .lp-usda)
(define-constant v1-version-usda .lp-usda-v1)
(define-constant v2-version-usda .lp-usda-v2)
(define-constant v3-version-usda .lp-usda-v3)

(define-constant v0-version-sbtc .lp-sbtc)
(define-constant v1-version-sbtc .lp-sbtc-v1)
(define-constant v2-version-sbtc .lp-sbtc-v2)
(define-constant v3-version-sbtc .lp-sbtc-v3)

(define-constant v0-version-xusd .lp-xusd)
(define-constant v1-version-xusd .lp-xusd-v1)
(define-constant v2-version-xusd .lp-xusd-v2)
(define-constant v3-version-xusd .lp-xusd-v3)

(define-constant v0-version-diko .lp-diko)
(define-constant v1-version-diko .lp-diko-v1)
(define-constant v2-version-diko .lp-diko-v2)
(define-constant v3-version-diko .lp-diko-v3)

(define-constant v0-version-wstx .lp-wstx)
(define-constant v1-version-wstx .lp-wstx-v1)
(define-constant v2-version-wstx .lp-wstx-v2)
(define-constant v3-version-wstx .lp-wstx-v3)

(define-constant pool-0-reserve-v0 .pool-0-reserve)
(define-constant pool-0-reserve-v1-2 .pool-0-reserve-v1-2)
(define-constant pool-0-reserve-v2-0 .pool-0-reserve-v2-0)

(define-public (run-update)
  (let (
    (reserve-data-1 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read ststx-address)))
    (reserve-data-2 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read usda-address)))
    (reserve-data-3 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read sbtc-address)))
    (reserve-data-4 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read xusd-address)))
    (reserve-data-5 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read diko-address)))
    (reserve-data-6 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read wstx-address)))
  )
    (asserts! (not (var-get executed)) (err u10))
    (try!
      (contract-call? .pool-borrow set-reserve ststx-address
        (merge reserve-data-1 { a-token-address: v3-version-ststx })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve usda-address
        (merge reserve-data-2 { a-token-address: v3-version-usda })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve sbtc-address
        (merge reserve-data-3 { a-token-address: v3-version-sbtc })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve xusd-address
        (merge reserve-data-4 { a-token-address: v3-version-xusd })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve diko-address
        (merge reserve-data-5 { a-token-address: v3-version-diko })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve wstx-address
        (merge reserve-data-6 { a-token-address: v3-version-wstx })
      )
    )

    (try! (contract-call? .liquidation-manager-v2-0 set-lending-pool .pool-borrow-v2-0))
    
    ;; pass permission to new pool-0-reserve. pool-0-reserve is used for transferring from pool-vault
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-0-reserve-v2-0))
    (try! (contract-call? .pool-0-reserve set-liquidator .pool-0-reserve-v2-0))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow false))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow-v1-2 false))

    ;; disable previous permissions
    (try! (contract-call? .pool-0-reserve-v1-2 set-approved-contract .pool-borrow-v1-2 false))

    (try! (contract-call? .pool-0-reserve-v2-0 set-liquidator .liquidation-manager-v2-0))
    (try! (contract-call? .pool-0-reserve-v2-0 set-lending-pool .pool-borrow-v2-0))
    (try! (contract-call? .pool-0-reserve-v2-0 set-approved-contract .pool-borrow-v2-0 true))
    ;; END pool-0-reserve permissions

    ;; update helper caller
    (try! (contract-call? .pool-borrow-v2-0 set-approved-contract .borrow-helper-v2-0 true))
    (try! (contract-call? .pool-borrow-v1-2 set-approved-contract .borrow-helper-v1-2 false))

    ;; update pool-reserve-data controller
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v1-2 false))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v2-0 true))

    ;; STSTX UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-ststx-token set-approved-contract v3-version-ststx true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-ststx set-approved-contract v2-version-ststx false))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract v2-version-ststx false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===

    ;; USDA UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-usda-token set-approved-contract v3-version-usda true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-usda-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-usda-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-usda-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-usda-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-usda set-approved-contract v2-version-usda false))
    (try! (contract-call? .lp-usda-v1 set-approved-contract v2-version-usda false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===

    ;; SBTC UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-sbtc-token set-approved-contract v3-version-sbtc true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-sbtc set-approved-contract v2-version-sbtc false))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract v2-version-sbtc false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===

    ;; XUSD UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-xusd-token set-approved-contract v3-version-xusd true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-xusd set-approved-contract v2-version-xusd false))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract v2-version-xusd false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===

    ;; DIKO UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-diko-token set-approved-contract v3-version-diko true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-diko-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-diko-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-diko-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-diko-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-diko set-approved-contract v2-version-diko false))
    (try! (contract-call? .lp-diko-v1 set-approved-contract v2-version-diko false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===

    ;; wstx UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    ;; permission to lp token contract
    (try! (contract-call? .lp-wstx-token set-approved-contract v3-version-wstx true))
    ;; permission to logic lp token
    ;; revoke pool-borrow permissions to v2 version
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .liquidation-manager-v1-2 false))
    (try! (contract-call? .lp-wstx-v2 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0, v1 from v2
    (try! (contract-call? .lp-wstx set-approved-contract v2-version-wstx false))
    (try! (contract-call? .lp-wstx-v1 set-approved-contract v2-version-wstx false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract pool-0-reserve-v2-0 true))
    ;; ===
    
    (var-set executed true)
    (ok true)
  )
)

(define-public (burn-mint-v3)
  (let (
    (addr-1 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
    (addr-2 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND)
    (balance-1 (unwrap-panic (contract-call? .lp-ststx-v2 get-principal-balance addr-1))) 
    (balance-2 (unwrap-panic (contract-call? .lp-ststx-v2 get-principal-balance addr-2)))
  )
    (try! (contract-call? .lp-ststx set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) true))

    ;; set to last updated block height of the v2 version for borrowers
    (try!
      (contract-call? .pool-reserve-data set-user-reserve-data
      addr-2 .usda
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read addr-2 .usda))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u117 })))
    
    ;; set to last updated block height of the v2 version for the reserve
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .ststx
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .ststx))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .sbtc
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .sbtc))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .diko
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .diko))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .usda
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .usda))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .xusd
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .xusd))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
      .wstx
      (merge
        (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read .wstx))
        ;; last updated block height is converted from burn-block-height to stacks-block-height
        { last-updated-block: u118 })))

    ;; burn/mint v2 to v3
    (try!
      (contract-call? .lp-ststx
        burn
        balance-1
        addr-1
      )
    )
    (try!
      (contract-call? .lp-ststx-v3
        mint
        balance-1
        addr-1
      )
    )
    (try!
      (contract-call? .lp-ststx
        burn
        balance-2
        addr-2
      )
    )
    (try!
      (contract-call? .lp-ststx-v3
        mint
        balance-2
        addr-2
      )
    )
    (ok true)
  )
)

(define-read-only (can-execute)
  (begin
    (asserts! (not (var-get executed)) (err u10))
    (ok (not (var-get executed)))
  )
)

(run-update)
(burn-mint-v3)