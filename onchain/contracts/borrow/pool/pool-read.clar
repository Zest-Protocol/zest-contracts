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

;; (define-read-only (can-be-used-as-collateral (asset principal))
;;   (get usage-as-collateral-enabled (contract-call? .pool-0-reserve get-reserve-state-optional asset))
;; )

(define-read-only (get-reserve-state (reserve principal))
  (contract-call? .pool-0-reserve get-reserve-state-optional reserve)
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
  ;; (map token-to-usd-internal assets)
  u0
)

(define-read-only (get-collateral-available
  (assets (list 100 { asset: principal, amount: uint}))
  (oracle principal)
  )
  (begin
    ;; (map token-to-available-collateral assets)
    u0
    ;; (mul (get amount item) (contract-call? .oracle get-unit-price (get asset item) ))
    ;; (contract-call? .pool-0-reserve get-collateral-available assets oracle)
  )
)

(define-read-only (get-borrow-balance-amount (who principal) (asset <ft>))
  (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who (contract-of asset)))
)

(define-read-only (get-borrow-balance-value (who principal) (asset <ft>) (oracle principal))
  (token-to-usd
    who
    asset
    oracle
    (get principal-borrow-balance (contract-call? .pool-0-reserve get-user-reserve-data who (contract-of asset)))
  )
)

(define-private (token-to-available-collateral
  (item { asset: <ft>, amount: uint})
)
  (contract-call? .pool-0-reserve value-to-collateral (token-to-usd-internal item))
)

(define-private (token-to-usd-internal
  (item { asset: <ft>, amount: uint})
)
  (mul (get amount item) (contract-call? .oracle get-asset-price-read (get asset item) ))
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
    (unit-price (contract-call? .oracle get-asset-price-read asset))
  )
    (mul amount unit-price)
  )
)

;; Define a helper function to get reserve data
(define-read-only (get-reserve-data (asset principal))
  (contract-call? .pool-0-reserve get-reserve-state asset)
)

;; Getter for each field in the tuple

(define-read-only (get-last-liquidity-cumulative-index (asset principal))
  (get last-liquidity-cumulative-index (get-reserve-data asset))
)

(define-read-only (get-current-liquidity-rate (asset principal))
  (get current-liquidity-rate (contract-call? .pool-0-reserve get-reserve-state asset))
)

(define-read-only (get-total-borrows-stable (asset principal))
  (get total-borrows-stable (contract-call? .pool-0-reserve get-reserve-state asset))
)

(define-read-only (get-total-borrows-variable (asset principal))
  (get total-borrows-variable (get-reserve-data asset))
)

(define-read-only (get-current-variable-borrow-rate (asset principal))
  (get current-variable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-current-stable-borrow-rate (asset principal))
  (get current-stable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-current-average-stable-borrow-rate (asset principal))
  (get current-average-stable-borrow-rate (get-reserve-data asset))
)

(define-read-only (get-last-variable-borrow-cumulative-index (asset principal))
  (get last-variable-borrow-cumulative-index (get-reserve-data asset))
)

(define-read-only (get-base-ltv-as-collateral (asset principal))
  (get base-ltv-as-collateral (get-reserve-data asset))
)

(define-read-only (get-liquidation-threshold (asset principal))
  (get liquidation-threshold (get-reserve-data asset))
)

(define-read-only (get-liquidation-bonus (asset principal))
  (get liquidation-bonus (get-reserve-data asset))
)

(define-read-only (get-decimals (asset principal))
  (get decimals (get-reserve-data asset))
)

(define-read-only (get-a-token-address (asset principal))
  (get a-token-address (get-reserve-data asset))
)

(define-read-only (get-interest-rate-strategy-address (asset principal))
  (get interest-rate-strategy-address (get-reserve-data asset))
)

(define-read-only (get-last-updated-block (asset principal))
  (get last-updated-block (get-reserve-data asset))
)

(define-read-only (get-borrowing-enabled (asset principal))
  (get borrowing-enabled (get-reserve-data asset))
)

(define-read-only (get-usage-as-collateral-enabled (asset principal))
  (get usage-as-collateral-enabled (get-reserve-data asset))
)

(define-read-only (get-is-stable-borrow-rate-enabled (asset principal))
  (get is-stable-borrow-rate-enabled (get-reserve-data asset))
)

(define-read-only (get-is-active (asset principal))
  (get is-active (get-reserve-data asset))
)

(define-read-only (get-is-freezed (asset principal))
  (get is-freezed (get-reserve-data asset))
)
