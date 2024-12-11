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
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-ststx-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; sbtc upgrade
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-sbtc-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; diko upgrade
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-diko-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; usda upgrade
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-usda-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; wstx upgrade
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-wstx-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; xusd upgrade
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .liquidation-manager-v2-0 true))
    (try! (contract-call? .lp-xusd-v3 set-approved-contract .pool-0-reserve-v2-0 true))

    ;; set lending-pool in liquidation-manager
    (try! (contract-call? .liquidation-manager-v2-0 set-lending-pool .pool-borrow-v2-0))
    
    ;; update liquidator and lending-pool in logic calls
    (try! (contract-call? .pool-0-reserve-v2-0 set-liquidator .liquidation-manager-v2-0))
    (try! (contract-call? .pool-0-reserve-v2-0 set-lending-pool .pool-borrow-v2-0))

    ;; drop old pool-0-reserve permissions
    (try! (contract-call? .pool-0-reserve set-lending-pool .pool-0-reserve-v2-0))
    (try! (contract-call? .pool-0-reserve set-liquidator .pool-0-reserve-v2-0))
    (try! (contract-call? .pool-0-reserve set-approved-contract .pool-borrow false))

    ;; update pool-0-reserve-v2-0 permissions
    ;; (try! (contract-call? .pool-0-reserve-v2-0 set-liquidator .liquidation-manager-v2-0))
    ;; (try! (contract-call? .pool-0-reserve-v2-0 set-lending-pool .pool-borrow-v1-2))
    (try! (contract-call? .pool-0-reserve-v2-0 set-approved-contract .pool-borrow-v2-0 true))

    ;; update for helper caller
    (try! (contract-call? .pool-borrow-v2-0 set-approved-contract .borrow-helper-v2-0 true))

    ;; disable previous permission
    (try! (contract-call? .pool-borrow-v1-1 set-approved-contract .borrow-helper false))

    ;; update pool-reserve-data controller
    (try! (contract-call? .pool-reserve-data delete-approved-contract .pool-0-reserve))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-0-reserve-v2-0 true))
    (try! (contract-call? .pool-reserve-data set-approved-contract .pool-borrow-v2-0 true))

    ;; give permission for burn/mint of previos version to new version
    (try! (contract-call? .lp-ststx-token set-approved-contract ststx-version-3_0 true))

    (try! (contract-call? .lp-ststx set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-ststx set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-ststx set-approved-contract .pool-0-reserve false))


    (try! (contract-call? .lp-usda-token set-approved-contract usda-version-3_0 true))

    (try! (contract-call? .lp-usda set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-usda set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-usda set-approved-contract .pool-0-reserve false))


    (try! (contract-call? .lp-sbtc-token set-approved-contract sbtc-version-3_0 true))

    (try! (contract-call? .lp-sbtc set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-sbtc set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-sbtc set-approved-contract .pool-0-reserve false))


    (try! (contract-call? .lp-xusd-token set-approved-contract xusd-version-3_0 true))

    (try! (contract-call? .lp-xusd set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-xusd set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-xusd set-approved-contract .pool-0-reserve false))


    (try! (contract-call? .lp-diko-token set-approved-contract diko-version-3_0 true))

    (try! (contract-call? .lp-diko set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-diko set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-diko set-approved-contract .pool-0-reserve false))


    (try! (contract-call? .lp-wstx-token set-approved-contract wstx-version-3_0 true))

    (try! (contract-call? .lp-wstx set-approved-contract .pool-borrow false))
    (try! (contract-call? .lp-wstx set-approved-contract .liquidation-manager false))
    (try! (contract-call? .lp-wstx set-approved-contract .pool-0-reserve false))

    ;; give setting permission
    (try! (contract-call? .pool-reserve-data-1 set-approved-contract .pool-borrow-v2-0 true))
    (try! (contract-call? .pool-reserve-data-2 set-approved-contract .pool-borrow-v2-0 true))
    ;; add grace-period variables
    ;; 7 days (144 * 7)
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-1 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-1 u1008))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-2 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-2 u1008))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-3 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-3 u1008))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-4 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-4 u1008))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-5 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-5 u1008))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-enabled updated-reserve-asset-6 false))
    (try! (contract-call? .pool-borrow-v2-0 set-grace-period-time updated-reserve-asset-6 u1008))

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