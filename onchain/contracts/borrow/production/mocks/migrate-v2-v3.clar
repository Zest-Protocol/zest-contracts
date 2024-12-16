;; Used to simulate mainnet migration from v1 to v2 in the test suite
;; Must be called after deploying migrate-v0-v1.clar

(define-data-var executed bool false)
(define-data-var executed-burn-mint bool false)
(define-data-var executed-reserve-data-update bool false)
(define-data-var executed-usda-borrower-block-height bool false)

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

(define-constant usda-borrowers (list { borrower: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND, new-height: u117 }))
(define-constant ststx-holders (list 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND))

(define-constant reserve-stacks-block-height-ststx u118)
(define-constant reserve-stacks-block-height-sbtc u118)
(define-constant reserve-stacks-block-height-usda u118)
(define-constant reserve-stacks-block-height-xusd u118)
(define-constant reserve-stacks-block-height-wstx u118)
(define-constant reserve-stacks-block-height-diko u118)

(define-public (set-reserve-block-height)
  (begin
    (asserts! (not (var-get executed-reserve-data-update)) (err u11))
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) true))

    (try! (set-reserve-burn-block-height-to-stacks-block-height .ststx reserve-stacks-block-height-ststx))
    (try! (set-reserve-burn-block-height-to-stacks-block-height .sbtc reserve-stacks-block-height-sbtc))
    (try! (set-reserve-burn-block-height-to-stacks-block-height .usda reserve-stacks-block-height-usda))
    (try! (set-reserve-burn-block-height-to-stacks-block-height .xusd reserve-stacks-block-height-xusd))
    (try! (set-reserve-burn-block-height-to-stacks-block-height .wstx reserve-stacks-block-height-wstx))
    (try! (set-reserve-burn-block-height-to-stacks-block-height .diko reserve-stacks-block-height-diko))

    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) false))
    
    (var-set executed-reserve-data-update true)
    (ok true)
  )
)

(define-public (set-usda-borrower-block-height)
  (begin
    (asserts! (not (var-get executed-usda-borrower-block-height)) (err u12))
    ;; enabled access
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) true))

    ;; set to last updated block height of the v2 version for borrowers
    ;; only addr-2 is a borrower in this case
    (try! (fold check-err (map set-usda-user-burn-block-height-lambda usda-borrowers) (ok true)))

    ;; disable access
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) false))

    (var-set executed-usda-borrower-block-height true)
    (ok true)
  )
)

(define-public (burn-mint-ststx)
  (begin
    (asserts! (not (var-get executed-burn-mint)) (err u13))
    ;; enabled access
    (try! (contract-call? .lp-ststx set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract (as-contract tx-sender) true))
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) true))

    ;; burn/mint v2 to v3
    (try! (fold check-err (map consolidate-ststx-lambda ststx-holders) (ok true)))

    ;; disable access
    (try! (contract-call? .lp-ststx set-approved-contract (as-contract tx-sender) false))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract (as-contract tx-sender) false))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract (as-contract tx-sender) false))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract (as-contract tx-sender) false))
    (try! (contract-call? .pool-reserve-data set-approved-contract (as-contract tx-sender) false))

    (var-set executed-burn-mint true)
    (ok true)
  )
)

(define-private (set-usda-user-burn-block-height-lambda (usda-borrower (tuple (borrower principal) (new-height uint))))
  (set-user-burn-block-height-to-stacks-block-height
    (get borrower usda-borrower)
    .usda
    (get new-height usda-borrower))
)

(define-private (consolidate-ststx-lambda (account principal))
  (consolidate-ststx-balance-to-v3 account)
)

(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior ok-value result err-value (err err-value))
)

(define-private (set-user-burn-block-height-to-stacks-block-height
  (account principal)
  (asset principal)
  (new-stacks-block-height uint))
  (begin
    (try!
      (contract-call? .pool-reserve-data set-user-reserve-data
        account
        asset
          (merge
            (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read account asset))
            { last-updated-block: new-stacks-block-height })))
    (ok true)
  )
)

(define-private (set-reserve-burn-block-height-to-stacks-block-height
  (asset principal)
  (new-stacks-block-height uint))
  (begin
    (try!
      (contract-call? .pool-reserve-data set-reserve-state
        asset
        (merge
          (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset))
          { last-updated-block: new-stacks-block-height })))
    (ok true)
  )
)

(define-private (consolidate-ststx-balance-to-v3 (account principal))
  (let (
    ;; burns old balances and mints to the latest version
    (v0-balance (unwrap-panic (contract-call? .lp-ststx get-principal-balance account)))
    (v1-balance (unwrap-panic (contract-call? .lp-ststx-v1 get-principal-balance account)))
    (v2-balance (unwrap-panic (contract-call? .lp-ststx-v2 get-principal-balance account)))
    )
    (if (> v0-balance u0)
      (begin
        (try! (contract-call? .lp-ststx burn v0-balance account))
        (try! (contract-call? .lp-ststx-v3 mint v0-balance account))
        true
      )
      ;; if doesn't have v0 balance, then check if has v1 balance
      (if (> v1-balance u0)
        (begin
          (try! (contract-call? .lp-ststx-v1 burn v1-balance account))
          (try! (contract-call? .lp-ststx-v3 mint v1-balance account))
          true
        )
        ;; if doesn't have v1 balance, then check if has v2 balance
        (if (> v2-balance u0)
          (begin
            (try! (contract-call? .lp-ststx-v2 burn v2-balance account))
            (try! (contract-call? .lp-ststx-v3 mint v2-balance account))
            true
          )
          false
        )
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
(burn-mint-ststx)
(set-reserve-block-height)
(set-usda-borrower-block-height)