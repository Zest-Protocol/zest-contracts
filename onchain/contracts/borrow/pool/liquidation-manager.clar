(use-trait ft .ft-trait.ft-trait)


(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft> }))
)
  (let (
    (reserves (contract-call? .pool-0-reserve get-reserves))
  )
    (try! (fold aggregate-user-data assets (ok { agg: u0, user: user })))
    (ok u0)
  )
)

(define-private (aggregate-user-data (reserve { asset: <ft>, lp-token: <ft> }) (total (response (tuple (agg uint) (user principal)) uint)))
  (begin
    (asserts! true (err u1))
    ;; (try! (get-user-basic-reserve-data (get lp-token reserve) (get asset reserve) (get user (unwrap-panic total))))
    total
  )
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-public (liquidation-call
  (lp-token <ft>)
  (collateral <ft>)
  (reserve principal)
  (user principal)
  (purchase-amount uint)
  (to-receive-underlying bool)
  )
  (begin
    (try!
      (get-user-basic-reserve-data lp-token collateral user {
        total-liquidity-balanceSTX: u0,
        total-collateral-balanceSTX: u0,
        total-borrow-balanceSTX: u0,
        total-feesSTX: u0,
      })
    )

    (ok {
      total-liquidity-balanceSTX:
        (+ 
          u0
        )
    })
  )
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  (aggregate {
    total-liquidity-balanceSTX: uint,
    total-collateral-balanceSTX: uint,
    total-borrow-balanceSTX: uint,
    total-feesSTX: uint,
  })
  )
  (let (
    (user-reserve-data (try! (contract-call? .pool-0-reserve get-user-basic-reserve-data lp-token asset user)))
  )
    (if (is-eq (+ (get compounded-borrow-balance user-reserve-data) (get compounded-borrow-balance user-reserve-data)) u0)
      ;; do nothing this loop
      (ok u0)
      (let (
        (reserve-data (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
        (token-unit (* u10 (get decimals reserve-data)))
        ;; TODO: Correct for fixed-point arithemetic
        (reserve-unit-price u100000000)
        (liquidity-collateral
          (if (> (get underlying-balance user-reserve-data) u0)
            {
              total-liquidity-balanceSTX:
                (+ (get total-liquidity-balanceSTX aggregate)
                  (div
                    (mul
                      reserve-unit-price
                      (get underlying-balance user-reserve-data)
                    )
                    token-unit
                  )
                )
            }
            {
              total-liquidity-balanceSTX: (get total-liquidity-balanceSTX aggregate)
            }
          )
        )
      )

        ;; (total-liquidity-balanceSTX reverse-unit-price)
        (if (> (get underlying-balance user-reserve-data) u0)
          (let (
            ;; TODO: calculate liquidity
            (liquidity-balanceSTX u100000)
          )
            (if (and (get usage-as-collateral-enabled reserve-data) (get use-as-collateral user-reserve-data))
              (let (
                (total-collateral-balanceSTX u0)
                (current-ltv u0)
                (current-liquidation-threshold u0)
              )
                (ok u0)
              )
              (ok u0)
            )
          )
          (if (> (get compounded-borrow-balance user-reserve-data) u0)
            (let (
              (total-borrow-balanceSTX u0)
              (total-feesSTX u0)
            )
              (ok u0)
            )
            (ok u0)
          )
        )
      )
    )
  )
)

;; total-liquidity-balanceSTX,
;; total-collateral-balanceSTX,
;; total-borrow-balanceSTX,
;; total-feesSTX,
;; current-ltv,
;; current-liquidation-threshold,
;; health-factor,
;; health-factor-below-threshold
