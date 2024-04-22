(define-data-var executed bool false)

(define-constant updated-reserve-asset-1 .ststx)
(define-constant updated-reserve-asset-2 .usda)
(define-constant updated-reserve-asset-3 .sbtc)
(define-constant updated-reserve-asset-4 .xusd)
(define-constant updated-reserve-asset-5 .diko)

(define-constant previous-version-1 .lp-ststx)
(define-constant new-version-1 .lp-ststx-v1)

(define-constant previous-version-2 .lp-usda)
(define-constant new-version-2 .lp-usda-v1)

(define-constant previous-version-3 .lp-sbtc)
(define-constant new-version-3 .lp-sbtc-v1)

(define-constant previous-version-4 .lp-xusd)
(define-constant new-version-4 .lp-xusd-v1)

(define-constant previous-version-5 .lp-diko)
(define-constant new-version-5 .lp-diko-v1)

(define-public (run-update)
  (let (
    (reserve-data-1 u0)
  )
    (asserts! (not (var-get executed)) (err u10))
  
    ;; ststx upgrade
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-ststx-v1 set-approved-contract .borrow-helper true))

    ;; sbtc upgrade
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-sbtc-v1 set-approved-contract .borrow-helper true))

    ;; diko upgrade
    (try! (contract-call? .lp-diko-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-diko-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-diko-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-diko-v1 set-approved-contract .borrow-helper true))

    ;; usda upgrade
    (try! (contract-call? .lp-usda-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-usda-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-usda-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-usda-v1 set-approved-contract .borrow-helper true))

    ;; wstx upgrade
    (try! (contract-call? .lp-wstx-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-wstx-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-wstx-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-wstx-v1 set-approved-contract .borrow-helper true))

    ;; xusd upgrade
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .pool-borrow-v1-1 true))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .liquidation-manager-v1-1 true))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .pool-0-reserve true))
    (try! (contract-call? .lp-xusd-v1 set-approved-contract .borrow-helper true))

    (try! (contract-call? .liquidation-manager-v1-1 set-lending-pool .pool-borrow-v1-1))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve set-liquidator .liquidation-manager-v1-1))
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-borrow-v1-1))

    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v1-1 set-approved-contract .borrow-helper true))

    ;; give permission for burn/mint of previos version to new version
    (try! (contract-call? .lp-ststx set-approved-contract new-version-1 true))
    (try! (contract-call? .lp-ststx set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-ststx set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-ststx set-approved-contract .pool-0-reserve false))
    (try! (contract-call? .lp-usda set-approved-contract new-version-2 true))
    (try! (contract-call? .lp-usda set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-usda set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-usda set-approved-contract .pool-0-reserve false))
    (try! (contract-call? .lp-sbtc set-approved-contract new-version-3 true))
    (try! (contract-call? .lp-sbtc set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-sbtc set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-sbtc set-approved-contract .pool-0-reserve false))
    (try! (contract-call? .lp-xusd set-approved-contract new-version-4 true))
    (try! (contract-call? .lp-xusd set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-xusd set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-xusd set-approved-contract .pool-0-reserve false))
    (try! (contract-call? .lp-diko set-approved-contract new-version-5 true))
    (try! (contract-call? .lp-diko set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-diko set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-diko set-approved-contract .pool-0-reserve false))
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