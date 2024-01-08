
(use-trait ft .ft-trait.ft-trait)

(define-constant max-value (contract-call? .math get-max-value))
(define-constant one-8 (contract-call? .math get-one))
(use-trait oracle-trait .oracle-trait.oracle-trait)

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-read-only (taylor-6 (x uint))
  (contract-call? .math taylor-6 x)
)

(define-read-only (get-reserve-state (asset principal))
  (contract-call? .pool-0-reserve get-reserve-state asset)
)

(define-read-only (get-assets)
  (contract-call? .pool-0-reserve get-assets)
)

(define-read-only (get-user-reserve-data (who principal) (reserve principal))
  (contract-call? .pool-0-reserve get-user-reserve-data who reserve)
)

(define-read-only (get-user-index (who principal) (asset principal))
  (contract-call? .pool-0-reserve get-user-index who asset)
)

(define-read-only (get-seconds-in-block)
  (contract-call? .math get-seconds-in-block)
)

(define-read-only (get-seconds-in-year)
  (contract-call? .math get-seconds-in-year)
)

(define-read-only (calculate-linear-interest
  (current-liquidity-rate uint)
  (delta uint)
  )
  (let (
    (years-elapsed (div (* delta (get-seconds-in-block)) (get-seconds-in-year)))
  )
    (+ one-8 (mul years-elapsed current-liquidity-rate))
  )
)

(define-read-only (calculate-compounded-interest
  (current-liquidity-rate uint)
  (delta uint)
  )
  (let (
    (rate-per-second (div current-liquidity-rate (get-seconds-in-year)))
    (time (* delta (get-seconds-in-block)))
  )
    (taylor-6 (mul rate-per-second time))
  )
)

(define-read-only (get-normalized-income
  (current-liquidity-rate uint)
  (last-updated-block uint)
  (last-liquidity-cumulative-index uint)
)
  (let (
    (cumulated 
      (calculate-linear-interest
        current-liquidity-rate
        (- block-height last-updated-block)
      )
    )
  )
    (mul cumulated last-liquidity-cumulative-index)
  )
)


(define-read-only (get-cumulated-balance
  (who principal)
  (balance uint)
  (asset principal)
  )
  (let (
    (current-user-index (get-user-index who asset))
    (reserve-data (get-reserve-state asset))
    (normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)))
    )
    (asserts! true (err u0))
    ;; TODO: update user index
    (ok
      (div
        (mul
          balance
          normalized-income)
        current-user-index
      )
    )
  )
)

(define-public (get-balance (lp-token <ft>) (asset principal) (who principal))
  (let (
    (balance (try! (contract-call? lp-token get-balance who)))
  )
    (if (is-eq balance u0)
      (ok u0)
      (let (
        (cumulated-balance (try! (get-cumulated-balance who balance asset)))
      )
        (ok cumulated-balance)
      )
    )
  )
)

(define-public (get-user-underlying-asset-balance
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (let (
    (user-data (get-user-reserve-data user (contract-of asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (get-balance lp-token (contract-of asset) user)))
  )
    (ok underlying-balance)
  )
)

(define-read-only (get-compounded-borrow-balance
  ;; user-data
  (principal-borrow-balance uint)
  (stable-borrow-rate uint)
  (last-updated-block uint)
  (last-variable-borrow-cumulative-index uint)
  ;; reserve-data
  (current-variable-borrow-rate uint)
  (last-variable-borrow-cumulative-index-reserve uint)
  (last-updated-block-reserve uint)
  )
  (let (
    (cumulated-interest
      (if (> stable-borrow-rate u0)
        u0
        (div
          (mul
            (calculate-compounded-interest
              current-variable-borrow-rate
              (- block-height last-updated-block)
            )
            last-variable-borrow-cumulative-index-reserve
          )
          last-variable-borrow-cumulative-index
        )
      )
    )
    (compounded-balance (mul principal-borrow-balance cumulated-interest))
  )
    (if (is-eq compounded-balance principal-borrow-balance)
      (if (is-eq last-updated-block block-height)
        (+ principal-borrow-balance u1)
        compounded-balance
      )
      compounded-balance
    )
  )
)

(define-public (get-user-balance-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  (oracle <oracle-trait>)
  )
  (let (
    (user-data (get-user-reserve-data user (contract-of asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (get-user-underlying-asset-balance lp-token asset user)))
    (compounded-borrow-balance
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)

        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )
    )
  )
    (if (is-eq (get principal-borrow-balance user-data) u0)
      (ok {
        underlying-balance: underlying-balance,
        compounded-borrow-balance: u0,
        origination-fee: u0,
        use-as-collateral: (get use-as-collateral user-data)
      })
      (ok {
        underlying-balance: underlying-balance,
        compounded-borrow-balance: compounded-borrow-balance,
        origination-fee: (get origination-fee user-data),
        use-as-collateral: (get use-as-collateral user-data)
      })
    )
  )
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (oracle <oracle-trait>)
  (aggregate {
    total-liquidity-balanceUSD: uint,
    total-collateral-balanceUSD: uint,
    total-borrow-balanceUSD: uint,
    user-total-feesUSD: uint,
    current-ltv: uint,
    current-liquidation-threshold: uint,
    user: principal
  })
  )
  (let (
    (user (get user aggregate))
    (user-reserve-state (try! (get-user-balance-reserve-data lp-token asset user oracle)))
  )
    (if (is-eq (+ (get underlying-balance user-reserve-state) (get compounded-borrow-balance user-reserve-state)) u0)
      ;; do nothing this loop
      (begin
        (ok
          {
            total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
            total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
            total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
            user-total-feesUSD: (get user-total-feesUSD aggregate),
            current-ltv: (get current-ltv aggregate),
            current-liquidation-threshold: (get current-liquidation-threshold aggregate),
            user: user
          }
        )
      )
      (let (
        (reserve-data (get-reserve-state (contract-of asset)))
        (reserve-unit-price (try! (contract-call? oracle get-asset-price asset)))
        ;; liquidity and collateral balance
        (liquidity-balanceUSD (mul-to-fixed-precision (get underlying-balance user-reserve-state) (get decimals reserve-data) reserve-unit-price))
        (ret-1
          (let (
            (total-liquidity-balance (+ (get total-liquidity-balanceUSD aggregate) liquidity-balanceUSD))
          )
            (if (> (get underlying-balance user-reserve-state) u0)
              (begin
                (if (and (get usage-as-collateral-enabled reserve-data) (get use-as-collateral user-reserve-state))
                  (begin
                    {
                      total-liquidity-balanceUSD:  total-liquidity-balance,
                      total-collateral-balanceUSD: (+ (get total-collateral-balanceUSD aggregate) liquidity-balanceUSD),
                      current-ltv: (+ (get current-ltv aggregate) (mul liquidity-balanceUSD (get base-ltv-as-collateral reserve-data)) ),
                      current-liquidation-threshold: (+ (get current-liquidation-threshold aggregate) (mul liquidity-balanceUSD (get liquidation-threshold reserve-data)))
                    }
                  )
                  {
                    total-liquidity-balanceUSD: total-liquidity-balance,
                    total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
                    current-ltv: (get current-ltv aggregate),
                    current-liquidation-threshold: (get current-liquidation-threshold aggregate)
                  }
                )
              )
              {
                total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
                total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
                current-ltv: (get current-ltv aggregate),
                current-liquidation-threshold: (get current-liquidation-threshold aggregate)
              }
            )
          )
        )
        (ret-2
          (if (> (get compounded-borrow-balance user-reserve-state) u0)
            {
              total-borrow-balanceUSD:
                (+ 
                  (get total-borrow-balanceUSD aggregate)
                  (mul-to-fixed-precision (get compounded-borrow-balance user-reserve-state) (get decimals reserve-data) reserve-unit-price)
                ),
              user-total-feesUSD:
                (+
                  (get user-total-feesUSD aggregate)
                  (mul-to-fixed-precision (get origination-fee user-reserve-state) (get decimals reserve-data) reserve-unit-price)
                )
            }
            {
              total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
              user-total-feesUSD: (get user-total-feesUSD aggregate)
            }
          )
        )
      )        
        (ok
          (merge
            (merge
              ret-1
              ret-2
            )
            { user: user }
          )
        )
      )
    )
  )
)

(define-read-only (get-health-factor-liquidation-treshold)
  (contract-call? .pool-0-reserve get-health-factor-liquidation-treshold)
)

(define-public (aggregate-user-data
  (reserve { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> })
  (total
    (response
      (tuple
        (total-liquidity-balanceUSD uint)
        (total-collateral-balanceUSD uint)
        (total-borrow-balanceUSD uint)
        (user-total-feesUSD uint)
        (user principal)
        (current-ltv uint)
        (current-liquidation-threshold uint)
      )
      uint
    )
  ))
  (let (
    (result (unwrap-panic total))
  )
    (asserts! true (err u1))
    (get-user-basic-reserve-data
      (get lp-token reserve)
      (get asset reserve)
      (get oracle reserve)
      result
    )
  )
)

(define-public (calculate-user-global-data
  (user principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
)
  (let (
    (reserves (get-assets))
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
            }
          )
        )
      )
    )
    (total-collateral-balanceUSD (get total-collateral-balanceUSD aggregate))
    (current-ltv
      (if (> total-collateral-balanceUSD u0)
        (div (get current-ltv aggregate) total-collateral-balanceUSD)
        u0
      )
    )
    (current-liquidation-threshold
      (if (> total-collateral-balanceUSD u0)
        (div (get current-liquidation-threshold aggregate) total-collateral-balanceUSD)
        u0
      )
    )
    (health-factor
      (calculate-health-factor-from-balances
        (get total-collateral-balanceUSD aggregate)
        (get total-borrow-balanceUSD aggregate)
        (get user-total-feesUSD aggregate)
        current-liquidation-threshold
      )
    )
    (is-health-factor-below-treshold (< health-factor (get-health-factor-liquidation-treshold)))
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

(define-public (calculate-collateral-needed-in-USD
  (asset <ft>)
  (oracle <oracle-trait>)
  (amount uint)
  (fee uint)
  (user-borrow-balance-USD uint)
  (user-total-fees-USD uint)
  (current-ltv uint)
  )
  (let (
    (asset-price (try! (contract-call? oracle get-asset-price asset)))
    (reserve-data (get-reserve-state (contract-of asset)))
    (requested-borrow-amount-USD (mul-to-fixed-precision (+ amount fee) (get decimals reserve-data) asset-price))
    (collateral-needed-in-USD
      (div
        (+
          user-borrow-balance-USD
          user-total-fees-USD
          requested-borrow-amount-USD
        )
        current-ltv
      )
    )
  )
    (ok collateral-needed-in-USD)
  )
)

(define-read-only (calculate-health-factor-from-balances
  (total-collateral-balanceUSD uint)
  (total-borrow-balanceUSD uint)
  (total-feesUSD uint)
  (current-liquidation-threshold uint)
  )
  (begin
    (if (is-eq total-borrow-balanceUSD u0)
      max-value
      (div
        (mul
          total-collateral-balanceUSD
          current-liquidation-threshold
        )
        (+ total-borrow-balanceUSD total-feesUSD)
      )
    )
  )
)
