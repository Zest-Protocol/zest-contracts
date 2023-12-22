(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)


(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (taylor-6 (x uint))
  (contract-call? .math taylor-6 x)
)


(define-read-only (is-isolated (who principal))
  (begin
    (contract-call? .pool-0-reserve get-user-isolated who)
  )
)

(define-read-only (can-be-used-as-collateral (asset principal))
  (get usage-as-collateral-enabled (contract-call? .pool-0-reserve get-reserve-state asset))
)


(define-read-only (get-asset-supply-apy
    (reserve principal)
  )
  (let (
    (reserve-resp (get-reserve-state reserve))
  )
    (match reserve-resp
      reserve-data (begin
        (some
          (taylor-6 (get current-variable-borrow-rate reserve-data))
        )
      )
      none
    )
  )
)

(define-read-only (get-asset-borrow-apy
    (reserve principal)
  )
  (let (
    (reserve-resp (get-reserve-state reserve))
  )
    (match reserve-resp
      reserve-data (begin
        (some
          (+ u100000000 (get current-liquidity-rate reserve-data))
        )
      )
      none
    )
  )
)

(define-read-only (get-user-assets (who principal))
  (let (
    (assets (contract-call? .pool-0-reserve get-user-assets who))
  )
    assets
  )
)

(define-read-only (get-supplied-balance
  (assets (list 100 { asset: principal, amount: uint}))
  )
  (map token-to-usd-internal assets)
)

(define-read-only (get-collateral-available
  (assets (list 100 { asset: principal, amount: uint}))
  (oracle principal)
  )
  (begin
    (map token-to-available-collateral assets)
    ;; (mul (get amount item) (contract-call? .oracle get-unit-price (get asset item) ))
    ;; (contract-call? .pool-0-reserve get-collateral-available assets oracle)
  )
)

(define-read-only (get-borrow-balance-amount (who principal) (asset <ft>))
  (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who asset))
)

(define-read-only (get-borrow-balance-value (who principal) (asset <ft>) (oracle principal))
  (token-to-usd
    who
    asset
    oracle
    (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who asset))
  )
)

(define-private (token-to-available-collateral
  (item { asset: principal, amount: uint})
)
  (contract-call? .pool-0-reserve value-to-collateral (token-to-usd-internal item))
)

(define-private (token-to-usd-internal
  (item { asset: principal, amount: uint})
)
  (mul (get amount item) (contract-call? .oracle get-unit-price (get asset item) ))
)

;; (define-read-only (get-balance (asset <ft>) (who principal))
;;   (contract-call? asset get-balance who)
;; )

(define-read-only (token-to-usd
  (who principal)
  (asset <ft>)
  (oracle principal)
  (amount uint)
  )
  (let (
    (unit-price (contract-call? .oracle get-unit-price (contract-of asset)))
  )
    (mul amount unit-price)
  )
)

;; (define-private (agg-assets
;;   (asset principal)
;;   (agg { who: principal, assets: (list 100 principal) })
;;   )
;;   (begin
;;     ;; (match (contract-call? .pool-0-reserve get-user-state-optional (get who agg) asset)
;;     ;;   ret (begin
;;     ;;     {
;;     ;;       who: (get who agg),
;;     ;;       assets:
;;     ;;         (unwrap-panic
;;     ;;           (as-max-len?
;;     ;;             (append
;;     ;;               (get assets agg)
;;     ;;               asset
;;     ;;             )
;;     ;;             u100
;;     ;;           )
;;     ;;         )
;;     ;;     }
;;     ;;   )
;;     ;;   agg
;;     ;; )
;;     u0
;;   )
;; )

(define-read-only (get-reserve-state
    (reserve principal)
  )
  (contract-call? .pool-0-reserve get-reserve-state-optional reserve)
)
;; u1416667