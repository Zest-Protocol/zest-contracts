(use-trait ft .ft-trait.ft-trait)


(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft> }))
)
  (let (
    (reserves (contract-call? .pool-0-reserve get-assets))
    (aggregate (try!
        (fold
          aggregate-user-data
          assets
          (ok
            {
              total-liquidity-balanceSTX: u0,
              total-collateral-balanceSTX: u0,
              total-borrow-balanceSTX: u0,
              total-feesSTX: u0,
              current-ltv: u0,
              current-liquidation-threshold: u0,
              user: user
            }
          )
        )
      )
    )
  )
    ;; TODO: ADD currentLtv
    ;; TODO: ADD currentLiquidationTreshold
    ;; TODO: ADD healthFactor
    ;; TODO: ADD healthFactorBelowTreshold

    (ok u0)
  )
)


(define-private (aggregate-user-data
  (reserve
    {
      asset: <ft>,
      lp-token: <ft>
    }
  )
  (total
    (response
      (tuple
        (total-liquidity-balanceSTX uint)
        (total-collateral-balanceSTX uint)
        (total-borrow-balanceSTX uint)
        (total-feesSTX uint)
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
    (try!
      (get-user-basic-reserve-data
        (get lp-token reserve)
        (get asset reserve)
        result
      )
    )
    total
  )
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (aggregate {
    total-liquidity-balanceSTX: uint,
    total-collateral-balanceSTX: uint,
    total-borrow-balanceSTX: uint,
    total-feesSTX: uint,
    current-ltv: uint,
    current-liquidation-threshold: uint,
    user: principal
  })
  )
  (let (
    (user (get user aggregate))
    (user-reserve-data (try! (contract-call? .pool-0-reserve get-user-basic-reserve-data lp-token asset user)))
  )
    (if (is-eq (+ (get compounded-borrow-balance user-reserve-data) (get compounded-borrow-balance user-reserve-data)) u0)
      ;; do nothing this loop
      (begin
        (ok 
          {
            total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate),
            total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
            total-borrow-balanceSTX: (get total-borrow-balanceSTX aggregate),
            total-feesSTX: (get total-feesSTX aggregate),
            current-ltv: (get current-ltv aggregate),
            current-liquidation-threshold: (get current-liquidation-threshold aggregate),
            user: user
          }
        )
      )
      (let (
        (reserve-data (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
        (token-unit (* u10 (get decimals reserve-data)))
        ;; TODO: Correct for fixed-point arithemetic
        (reserve-unit-price u100000000)
        ;; liquidity and collateral balance
        (liquidity-balanceSTX (/ (* reserve-unit-price (get underlying-balance user-reserve-data)) token-unit))
        (ret-1
          (let (
            (total-liquidity-balance (+ (get total-liquidity-balanceSTX aggregate) liquidity-balanceSTX))
          )
            (if (> (get underlying-balance user-reserve-data) u0)
              (if (and (get usage-as-collateral-enabled reserve-data) (get use-as-collateral user-reserve-data))
                {
                  total-liquidity-balanceSTX:  total-liquidity-balance,
                  total-collateral-balanceSTX: (+ (get total-collateral-balanceSTX aggregate) liquidity-balanceSTX),
                  current-ltv: (+ (get current-ltv aggregate) ),
                  current-liquidation-threshold:
                    (+
                      (get current-liquidation-threshold aggregate)
                      (/ (* (get origination-fee user-reserve-data) reserve-unit-price) token-unit)
                    )
                }
                {
                  total-liquidity-balanceSTX: total-liquidity-balance,
                  total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
                  current-ltv: (get current-ltv aggregate),
                  current-liquidation-threshold: (get current-liquidation-threshold aggregate)
                }
              )
              {
                total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate),
                total-collateral-balanceSTX: (get total-collateral-balanceSTX aggregate),
                current-ltv: (get current-ltv aggregate),
                current-liquidation-threshold: (get current-liquidation-threshold aggregate)
              }
            )
          )
        )
        (ret-2
          (if (> (get compounded-borrow-balance user-reserve-data) u0)
            {
              total-borrow-balanceSTX:
                (+ 
                  (get total-borrow-balanceSTX aggregate)
                  (/ (* reserve-unit-price (get compounded-borrow-balance user-reserve-data)) token-unit)
                ),
              total-feesSTX:
                (+
                  (get total-feesSTX aggregate)
                  (/ (* (get origination-fee user-reserve-data) reserve-unit-price) token-unit)
                )
            }
            {
              total-borrow-balanceSTX: (get total-borrow-balanceSTX aggregate),
              total-feesSTX: (get total-feesSTX aggregate)
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

(define-public (liquidation-call
  (lp-token <ft>)
  (collateral <ft>)
  (reserve principal)
  (user principal)
  (purchase-amount uint)
  (to-receive-underlying bool)
  )
  ;; (get-user-basic-reserve-data lp-token collateral user {
  ;;   total-liquidity-balanceSTX: u0,
  ;;   total-collateral-balanceSTX: u0,
  ;;   total-borrow-balanceSTX: u0,
  ;;   total-feesSTX: u0,
  ;; })
  (ok u0)
)

;; total-liquidity-balanceSTX,
;; total-collateral-balanceSTX,
;; total-borrow-balanceSTX,
;; total-feesSTX,
;; current-ltv,
;; current-liquidation-threshold,
;; health-factor,
;; health-factor-below-threshold
