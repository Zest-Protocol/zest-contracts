(use-trait ft 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.ft-trait.ft-trait)
(use-trait ft-mint-trait 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.ft-mint-trait.ft-mint-trait)
(use-trait oracle-trait 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.oracle-trait.oracle-trait)
(use-trait redeemeable-trait 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N.redeemeable-trait-v1-2.redeemeable-trait)

(define-constant placeholder 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N)

(define-constant one-8 u100000000)
(define-constant max-value u340282366920938463463374607431768211455)
(define-constant e-mode-disabled-type 0x00)

(define-constant default-user-reserve-data
  {
    principal-borrow-balance: u0,
    last-variable-borrow-cumulative-index: u0,
    origination-fee: u0,
    stable-borrow-rate: u0,
    last-updated-block: u0,
    use-as-collateral: false,
  }
)

;; ERROR START 7000
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_INVALID_Z_TOKEN (err u7001))
(define-constant ERR_INVALID_ORACLE (err u7002))
(define-constant ERR_NON_CORRESPONDING_ASSETS (err u7003))
(define-constant ERR_DOES_NOT_EXIST (err u7004))
(define-constant ERR_NON_ZERO (err u7005))
(define-constant ERR_OPTIMAL_UTILIZATION_RATE_NOT_SET (err u7006))
(define-constant ERR_BASE_VARIABLE_BORROW_RATE_NOT_SET (err u7007))
(define-constant ERR_VARIABLE_RATE_SLOPE_1_NOT_SET (err u7008))
(define-constant ERR_VARIABLE_RATE_SLOPE_2_NOT_SET (err u7009))
(define-constant ERR_HEALTH_FACTOR_LIQUIDATION_THRESHOLD (err u7010))
(define-constant ERR_FLASHLOAN_FEE_TOTAL_NOT_SET (err u7011))
(define-constant ERR_FLASHLOAN_FEE_PROTOCOL_NOT_SET (err u7012))
(define-constant ERR_INVALID_VALUE (err u7013))
(define-constant ERR_E_MODE_DOES_NOT_EXIST (err u7014))
(define-constant ERR_CANNOT_BORROW_DIFFERENT_E_MODE_TYPE (err u7015))

(define-public (calculate-user-global-data
  (user principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> })))
    (let (
      (aggregate (try!
          (fold
            aggregate-user-data
            assets-to-calculate
            (ok
              {
                total-liquidity-balanceUSD: u0,
                total-collateral-balanceUSD: u0,
                total-borrow-balanceUSD: u0,
                user-total-feesUSD: u0,
                current-ltv: u0,
                current-liquidation-threshold: u0,
                user: user
              }))))
      (total-collateral-balanceUSD (get total-collateral-balanceUSD aggregate))
      (current-ltv
        (if (> total-collateral-balanceUSD u0)
          (contract-call? .pool-0-reserve-v2-0 div (get current-ltv aggregate) total-collateral-balanceUSD)
          u0))
      (current-liquidation-threshold
        (if (> total-collateral-balanceUSD u0)
          (div (get current-liquidation-threshold aggregate) total-collateral-balanceUSD)
          u0))
      (health-factor
        (contract-call? .pool-0-reserve-v2-0 calculate-health-factor-from-balances
          (get total-collateral-balanceUSD aggregate)
          (get total-borrow-balanceUSD aggregate)
          (get user-total-feesUSD aggregate)
          current-liquidation-threshold
        )
      )
      (is-health-factor-below-treshold (< health-factor (contract-call? .pool-0-reserve-v2-0 get-health-factor-liquidation-threshold)))
      )

      (ok {
        total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
        total-collateral-balanceUSD: total-collateral-balanceUSD,
        total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
        user-total-feesUSD: (get user-total-feesUSD aggregate),
        current-ltv: current-ltv,
        current-liquidation-threshold: current-liquidation-threshold,
        health-factor: health-factor,
        is-health-factor-below-treshold: is-health-factor-below-treshold
      })
    )
)

(define-private (aggregate-user-data
    (asset (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
    (aggregate-data (ok {
        total-liquidity-balanceUSD: u0,
        total-collateral-balanceUSD: u0,
        total-borrow-balanceUSD: u0,
        user-total-feesUSD: u0,
        current-ltv: u0,
        current-liquidation-threshold: u0,
        user: user
    }))
    )
  
  (contract-call? .pool-0-reserve-v2-0 aggregate-user-data aggregate-data asset)
)
