;; Used for migrating from v0 to v1 in the beginning of test suite

(define-data-var executed bool false)

(define-constant updated-reserve-asset-1 .ststx)
(define-constant updated-reserve-asset-2 .usda)
(define-constant updated-reserve-asset-3 .sbtc)
(define-constant updated-reserve-asset-4 .xusd)
(define-constant updated-reserve-asset-5 .diko)
(define-constant updated-reserve-asset-6 .wstx)

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

(define-constant previous-version-6 .lp-wstx)
(define-constant new-version-6 .lp-wstx-v1)

(define-public (run-update)
  (let (
    (reserve-data-1 u0)
  )
    (asserts! (not (var-get executed)) (err u10))
  
    ;; ststx upgrade
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-ststx-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; sbtc upgrade
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-sbtc-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; diko upgrade
    (try! (contract-call? .lp-diko-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-diko-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-diko-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; usda upgrade
    (try! (contract-call? .lp-usda-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-usda-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-usda-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; wstx upgrade
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-wstx-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; xusd upgrade
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .pool-borrow-v1-2 true))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .liquidation-manager-v1-2 true))
    (try! (contract-call? .lp-xusd-v2 set-approved-contract .pool-0-reserve-v1-2 true))

    ;; set lending-pool in liquidation-manager
    (try! (contract-call? .liquidation-manager-v1-2 set-lending-pool .pool-borrow-v1-2))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve-v1-2 set-liquidator .liquidation-manager-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-lending-pool .pool-borrow-v1-2))

    ;; drop old pool-0-reserve permissions
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-0-reserve-v1-2))
    (try! (contract-call? .pool-0-reserve set-liquidator .pool-0-reserve-v1-2))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow false))
    ;; (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow-v1-2 false))

    ;; update pool-0-reserve-v1-2 permissions
    (try! (contract-call? .pool-0-reserve-v1-2 set-liquidator .liquidation-manager-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-lending-pool .pool-borrow-v1-2))
    (try! (contract-call? .pool-0-reserve-v1-2 set-approved-contract .pool-borrow-v1-2 true))

    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v1-2 set-approved-contract .borrow-helper-v1-3 true))

    ;; disable previous permission
    (try! (contract-call? .pool-borrow-v1-1 set-approved-contract .borrow-helper false))

    ;; update pool-reserve-data controller
    (try! (contract-call? .pool-reserve-data delete-approved-contract .pool-0-reserve))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v1-2 true))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-borrow-v1-2 true))

    ;; give permission for burn/mint of previos version to new version
    ;; (try! (contract-call? .lp-ststx set-approved-contract new-version-1 true))
    (try! (contract-call? .lp-ststx set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-ststx set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-ststx set-approved-contract .pool-0-reserve false))
    ;; (try! (contract-call? .lp-usda set-approved-contract new-version-2 true))
    (try! (contract-call? .lp-usda set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-usda set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-usda set-approved-contract .pool-0-reserve false))
    ;; (try! (contract-call? .lp-sbtc set-approved-contract new-version-3 true))
    (try! (contract-call? .lp-sbtc set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-sbtc set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-sbtc set-approved-contract .pool-0-reserve false))
    ;; (try! (contract-call? .lp-xusd set-approved-contract new-version-4 true))
    (try! (contract-call? .lp-xusd set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-xusd set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-xusd set-approved-contract .pool-0-reserve false))
    ;; (try! (contract-call? .lp-diko set-approved-contract new-version-5 true))
    (try! (contract-call? .lp-diko set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-diko set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-diko set-approved-contract .pool-0-reserve false))
    ;; (try! (contract-call? .lp-wstx set-approved-contract new-version-5 true))
    (try! (contract-call? .lp-wstx set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-wstx set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-wstx set-approved-contract .pool-0-reserve false))

    ;; add grace-period variables
    ;; 7 days (144 * 7)
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-1 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-1 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-2 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-2 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-3 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-3 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-4 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-4 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-5 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-5 u1008))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-enabled updated-reserve-asset-6 false))
    (try! (contract-call? .pool-borrow-v1-2 set-grace-period-time updated-reserve-asset-6 u1008))

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