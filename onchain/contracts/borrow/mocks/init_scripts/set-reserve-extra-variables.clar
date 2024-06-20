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

    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-1 u0))
    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-2 u0))
    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-3 u0))
    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-4 u0))
    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-5 u0))
    (try! (contract-call? .pool-reserve-data set-base-variable-borrow-rate updated-reserve-asset-6 u0))

    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-1 u4000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-2 u4000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-3 u4000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-4 u6000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-5 u4000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-1 updated-reserve-asset-6 u4000000))

    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-1 u300000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-2 u300000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-3 u300000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-4 u300000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-5 u300000000))
    (try! (contract-call? .pool-reserve-data set-variable-rate-slope-2 updated-reserve-asset-6 u300000000))

    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-1 u80000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-2 u80000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-3 u80000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-4 u90000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-5 u80000000))
    (try! (contract-call? .pool-reserve-data set-optimal-utilization-rate updated-reserve-asset-6 u80000000))

    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-1 u50000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-2 u50000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-3 u50000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-4 u50000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-5 u50000000))
    (try! (contract-call? .pool-reserve-data set-liquidation-close-factor-percent updated-reserve-asset-6 u50000000))

    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-1 u35))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-2 u35))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-3 u35))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-4 u35))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-5 u35))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-total updated-reserve-asset-6 u35))

    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-1 u3000))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-2 u3000))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-3 u3000))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-4 u3000))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-5 u3000))
    (try! (contract-call? .pool-0-reserve set-flashloan-fee-protocol updated-reserve-asset-6 u3000))

    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-1 u25))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-2 u25))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-3 u25))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-4 u25))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-5 u25))
    (try! (contract-call? .pool-reserve-data set-origination-fee-prc updated-reserve-asset-6 u25))

    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-1 u15000000))
    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-2 u10000000))
    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-3 u10000000))
    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-4 u10000000))
    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-5 u10000000))
    (try! (contract-call? .pool-reserve-data set-reserve-factor updated-reserve-asset-6 u10000000))

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