;; Used to simulate mainnet migration from v1 to v2 in the test suite
;; Must be called after deploying migrate-v0-v1.clar

(define-data-var executed bool false)

(define-constant updated-reserve-asset-1 .ststx)
(define-constant updated-reserve-asset-2 .usda)
(define-constant updated-reserve-asset-3 .sbtc)
(define-constant updated-reserve-asset-4 .xusd)
(define-constant updated-reserve-asset-5 .diko)

(define-constant v0-version-1 .lp-ststx)
(define-constant v1-version-1 .lp-ststx-v1)
(define-constant v2-version-1 .lp-ststx-v2)

(define-constant v0-version-2 .lp-usda)
(define-constant v1-version-2 .lp-usda-v1)
(define-constant v2-version-2 .lp-usda-v2)

(define-constant v0-version-3 .lp-sbtc)
(define-constant v1-version-3 .lp-sbtc-v1)
(define-constant v2-version-3 .lp-sbtc-v2)

(define-constant v0-version-4 .lp-xusd)
(define-constant v1-version-4 .lp-xusd-v1)
(define-constant v2-version-4 .lp-xusd-v2)

(define-constant v0-version-5 .lp-diko)
(define-constant v1-version-5 .lp-diko-v1)
(define-constant v2-version-5 .lp-diko-v2)

(define-constant pool-0-reserve-v0 .pool-0-reserve)
;; (define-constant pool-0-reserve-v1-2 .pool-0-reserve-v1-2)

(define-public (run-update)
  (let (
    (reserve-data-1 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-1)))
    (reserve-data-2 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-2)))
    (reserve-data-3 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-3)))
    (reserve-data-4 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-4)))
    (reserve-data-5 (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read updated-reserve-asset-5)))
  )
    (asserts! (not (var-get executed)) (err u10))
    (print reserve-data-1)
    (print reserve-data-2)
    (print reserve-data-3)
    (print reserve-data-4)
    (print reserve-data-5)
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-1
        (merge reserve-data-1 { a-token-address: v2-version-1 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-2
        (merge reserve-data-2 { a-token-address: v2-version-2 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-3
        (merge reserve-data-3 { a-token-address: v2-version-3 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-4
        (merge reserve-data-4 { a-token-address: v2-version-4 })
      )
    )
    (try!
      (contract-call? .pool-borrow set-reserve updated-reserve-asset-5
        (merge reserve-data-5 { a-token-address: v2-version-5 })
      )
    )

    (try! (contract-call? .liquidation-manager-v1-2 set-lending-pool .pool-borrow-v1-2))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve set-liquidator .liquidation-manager-v1-2))
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-borrow-v1-2))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow-v1-2 true))

    ;; update helper caller
    (try! (contract-call? .pool-borrow-v1-2 set-approved-contract .borrow-helper-v1-2 true))
    (try! (contract-call? .pool-borrow-v1-2 set-approved-contract .borrow-helper false))

    ;; STSTX UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    (try! (contract-call? .lp-ststx set-approved-contract v2-version-1 true))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract v2-version-1 true))
    ;; revoke pool-borrow permissions to v1 version
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0 from v1
    (try! (contract-call? .lp-ststx set-approved-contract v1-version-1 false))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract v1-version-1 false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract pool-0-reserve-v0 true))
    ;; ===

    ;; USDA UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    (try! (contract-call? .lp-usda set-approved-contract v2-version-2 true))
    (try! (contract-call? .lp-usda-v1 set-approved-contract v2-version-2 true))
    ;; revoke pool-borrow permissions to v1 version
    (try! (contract-call? .lp-usda-v1 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-usda-v1 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-usda-v1 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0 from v1
    (try! (contract-call? .lp-usda set-approved-contract v1-version-2 false))
    (try! (contract-call? .lp-usda-v1 set-approved-contract v1-version-2 false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-usda-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-usda-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-usda-v2 set-approved-contract pool-0-reserve-v0 true))
    ;; ===

    ;; SBTC UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    (try! (contract-call? .lp-sbtc set-approved-contract v2-version-3 true))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract v2-version-3 true))
    ;; revoke pool-borrow permissions to v1 version
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0 from v1
    (try! (contract-call? .lp-sbtc set-approved-contract v1-version-3 false))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract v1-version-3 false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract pool-0-reserve-v0 true))
    ;; ===

    ;; XUSD UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    (try! (contract-call? .lp-xusd set-approved-contract v2-version-4 true))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract v2-version-4 true))
    ;; revoke pool-borrow permissions to v1 version
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0 from v1
    (try! (contract-call? .lp-xusd set-approved-contract v1-version-4 false))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract v1-version-4 false))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .pool-borrow-v1-2 false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract pool-0-reserve-v0 true))
    ;; ===


    ;; DIKO UPGRADE
    ;; give permission for burn/mint of previous versions to new version
    (try! (contract-call? .lp-diko set-approved-contract v2-version-5 true))
    (try! (contract-call? .lp-diko-v1 set-approved-contract v2-version-5 true))
    ;; revoke pool-borrow permissions to v1 version
    (try! (contract-call? .lp-diko-v1 set-approved-contract .pool-borrow-v1-1 false))
    (try! (contract-call? .lp-diko-v1 set-approved-contract .liquidation-manager-v1-1 false))
    (try! (contract-call? .lp-diko-v1 set-approved-contract pool-0-reserve-v0 false))
    ;; disable access to v0 from v1
    (try! (contract-call? .lp-diko set-approved-contract v1-version-5 false))
    (try! (contract-call? .lp-diko-v1 set-approved-contract v1-version-5 false))
    (try! (contract-call? .lp-diko-v1 set-approved-contract .pool-borrow-v1-2 false))
    ;; Give permission to new pool-borrow, liquidation-manager and pool-0-reserve
    (try! (contract-call? .lp-diko-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-diko-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-diko-v2 set-approved-contract pool-0-reserve-v0 true))
    ;; ===


    ;; add grace-period variables
    ;; 7 days (144 * 7)
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-1 true))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-1 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-2 true))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-2 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-3 true))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-3 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-4 true))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-4 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-5 true))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-5 u1008))
    
    (var-set executed true)
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