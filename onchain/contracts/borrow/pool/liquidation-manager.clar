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
    (try! (get-user-basic-reserve-data (get lp-token reserve) (get asset reserve) (get user (unwrap-panic total))))
    total
  )
)

(define-public (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (let (
    (user-reserve-data (try! (contract-call? .pool-0-reserve get-user-basic-reserve-data lp-token asset user)))
  )
    (if (is-eq (+ (get compounded-borrow-balance user-reserve-data) (get compounded-borrow-balance user-reserve-data)) u0)
      ;; do nothing this loop
      (ok u0)
      (let (
        (reserve-data (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
        (token-uint (* u10 (get decimals reserve-data)))
        ;; TODO: Correct for fixed-point arithemetic
        (reserve-unit-price u100000000)
      )
        (if (> (get underlying-balance user-reserve-data) u0)
          (ok u0)
          (ok u0)
        )
      )
    )
  )
)