;; Used for migrating from v0 to v1 in the beginning of test suite

(define-data-var executed bool false)

(define-constant updated-reserve-asset-1 .ststx)
(define-constant updated-reserve-asset-2 .usda)
(define-constant updated-reserve-asset-3 .sbtc)
(define-constant updated-reserve-asset-4 .xusd)
(define-constant updated-reserve-asset-5 .diko)
(define-constant updated-reserve-asset-6 .wstx)

(define-constant ststx-version-1 .lp-ststx)
(define-constant ststx-version-1_2 .lp-ststx-v1)
(define-constant ststx-version-2_0 .lp-ststx-v2)
(define-constant ststx-version-3_0 .lp-ststx-v3)

(define-constant usda-version-1 .lp-usda)
(define-constant usda-version-1_2 .lp-usda-v1)
(define-constant usda-version-2_0 .lp-usda-v2)
(define-constant usda-version-3_0 .lp-usda-v3)

(define-constant sbtc-version-1 .lp-sbtc)
(define-constant sbtc-version-1_2 .lp-sbtc-v1)
(define-constant sbtc-version-2_0 .lp-sbtc-v2)
(define-constant sbtc-version-3_0 .lp-sbtc-v3)

(define-constant xusd-version-1 .lp-xusd)
(define-constant xusd-version-1_2 .lp-xusd-v1)
(define-constant xusd-version-2_0 .lp-xusd-v2)
(define-constant xusd-version-3_0 .lp-xusd-v3)

(define-constant diko-version-1 .lp-diko)
(define-constant diko-version-1_2 .lp-diko-v1)
(define-constant diko-version-2_0 .lp-diko-v2)
(define-constant diko-version-3_0 .lp-diko-v3)

(define-constant wstx-version-1 .lp-wstx)
(define-constant wstx-version-1_2 .lp-wstx-v1)
(define-constant wstx-version-2_0 .lp-wstx-v2)
(define-constant wstx-version-3_0 .lp-wstx-v3)

(define-public (run-update)
  (let (
    (reserve-data-1 u0)
  )
    (asserts! (not (var-get executed)) (err u10))
  
    ;; ststx upgrade
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-ststx-token set-approved-contract .lp-ststx-v3 true))

    ;; sbtc upgrade
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-sbtc-token set-approved-contract .lp-sbtc-v3 true))

    ;; diko upgrade
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-diko-token set-approved-contract .lp-diko-v3 true))

    ;; usda upgrade
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-usda-token set-approved-contract .lp-usda-v3 true))

    ;; wstx upgrade
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-wstx-token set-approved-contract .lp-wstx-v3 true))

    ;; xusd upgrade
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .liquidation-manager-v2-1 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .liquidation-manager-v2-0 false))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    (try! (contract-call? .lp-xusd-token set-approved-contract .lp-xusd-v3 true))

    ;; set lending-pool in liquidation-manager
    (try! (contract-call? .liquidation-manager-v2-1 set-lending-pool .pool-borrow-v2-1))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve-v2-0 set-liquidator .liquidation-manager-v2-1))
    (try! (contract-call? .pool-0-reserve-v2-0 set-lending-pool .pool-borrow-v2-1))

    ;; update pool-0-reserve-v2-0 permissions
    (try! (contract-call? .pool-0-reserve-v2-0 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .pool-0-reserve-v2-0 set-approved-contract .pool-borrow-v2-0 false))

    ;; update pool-0-reserve vault permissions
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-0-reserve-v2-0))
    (try! (contract-call? .pool-0-reserve set-liquidator .pool-0-reserve-v2-0))

    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v2-1 set-approved-contract .borrow-helper-v2-1 true))
    (try! (contract-call? .pool-borrow-v2-0 set-approved-contract .borrow-helper-v2-0 false))

    ;; give setting permission
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .pool-reserve-data-1 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .pool-reserve-data-1 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .pool-reserve-data-2 set-approved-contract .pool-borrow-v2-1 true))
    (try! (contract-call? .pool-reserve-data-2 set-approved-contract .pool-borrow-v2-0 false))
    (try! (contract-call? .pool-reserve-data-3 set-approved-contract .pool-borrow-v2-1 true))

    ;; pool-0-reserve-v2-0 permissions
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v2-0 true))
    (try! (contract-call? .pool-reserve-data-1 set-approved-contract .pool-0-reserve-v2-0 true))
    (try! (contract-call? .pool-reserve-data-2 set-approved-contract .pool-0-reserve-v2-0 true))
    (try! (contract-call? .pool-reserve-data-3 set-approved-contract .pool-0-reserve-v2-0 true))

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