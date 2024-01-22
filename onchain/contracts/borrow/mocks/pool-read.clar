(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(use-trait oracle-trait .oracle-trait.oracle-trait)

;; How to check when user is in isolation mode
;; 1) Get assets supplied with (get-user-assets)
;; 2) Filter supplied assets by assets that are isolated
;; 3) Filter isolated supplied assets by being enabled as collateral

(define-read-only (is-borroweable (asset principal))
  (and
    (contract-call? .pool-0-reserve is-active asset)
    (not (contract-call? .pool-0-reserve is-frozen asset))
    (contract-call? .pool-0-reserve is-borrowing-enabled asset)
  )
)

(define-read-only (is-active (asset principal))
  (and (contract-call? .pool-0-reserve is-active asset) (not (contract-call? .pool-0-reserve is-frozen asset)))
)

(define-constant available-assets (list .diko .sBTC .wstx .stSTX .xUSD .USDA ))

(define-read-only (get-supplieable-assets)
  ;; (filter is-active available-assets)
  available-assets
)

(define-read-only (get-borroweable-assets)
  ;; (filter is-borroweable available-assets)
  available-assets
)

(define-read-only (is-isolated-asset (asset principal))
  (contract-call? .pool-0-reserve is-isolated-type asset)
)

(define-read-only (get-isolated-mode-assets)
  (filter is-isolated-asset available-assets)
)

(define-read-only (is-borroweable-in-isolation (asset principal))
  (contract-call? .pool-0-reserve is-borroweable-isolated asset)
)

(define-read-only (get-borroweable-assets-in-isolated-mode)
  (filter is-borroweable-in-isolation available-assets)
)

(define-read-only (is-used-as-collateral (who principal) (asset principal))
  (get use-as-collateral (get-user-reserve-data who asset))
)

(define-read-only (get-user-reserve-data (who principal) (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who asset))
)

(define-read-only (get-asset-borrow-apy (reserve principal))
  (let (
    (reserve-resp (get-reserve-data reserve))
  )
    (calculate-compounded-interest
      (get current-variable-borrow-rate reserve-resp)
      (* u144 u365)
    )
  )
)

(define-read-only (token-to-usd (amount uint) (decimals uint) (unit-price uint))
  (contract-call? .math mul-to-fixed-precision amount decimals unit-price)
)

;; Define a helper function to get reserve data
(define-read-only (get-reserve-data (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset))
)

(define-read-only (get-max-borroweable
  (useable-collateral uint)
  (borrowed-collateral uint)
  (decimals uint)
  (asset-to-borrow <ft>))
  (let ((price (unwrap-panic (contract-call? .oracle get-asset-price asset-to-borrow))))
    (contract-call? .math mul-to-fixed-precision (- useable-collateral borrowed-collateral) decimals price)
  )
)

(define-read-only (get-user-assets (who principal))
  (default-to
    { assets-supplied: (list), assets-borrowed: (list) }
    (contract-call? .pool-reserve-data get-user-assets-read who)))

(define-read-only (is-isolated-type (asset principal))
  (default-to false (contract-call? .pool-reserve-data get-isolated-assets-read asset)))

(define-read-only (get-borrowed-balance-user-usd-diko (who principal))
  (let (
    (balance (get-borrowed-balance-user-diko who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
  )
    (token-to-usd (get compounded-balance balance) u6 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-usd-sBTC (who principal))
  (let (
    (balance (get-borrowed-balance-user-sBTC who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .sBTC)))
  )
    (token-to-usd (get compounded-balance balance) u8 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-usd-wstx (who principal))
  (let (
    (balance (get-borrowed-balance-user-wstx who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
  )
    (token-to-usd (get compounded-balance balance) u6 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-usd-stSTX (who principal))
  (let (
    (balance (get-borrowed-balance-user-stSTX who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .stSTX)))
  )
    (token-to-usd (get compounded-balance balance) u6 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-usd-USDA (who principal))
  (let (
    (balance (get-borrowed-balance-user-USDA who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .USDA)))
  )
    (token-to-usd (get compounded-balance balance) u6 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-usd-xUSD (who principal))
  (let (
    (balance (get-borrowed-balance-user-xUSD who))
    (unit-price (unwrap-panic (contract-call? .oracle get-asset-price .xUSD)))
  )
    (token-to-usd (get compounded-balance balance) u6 unit-price)
  )
)

(define-read-only (get-borrowed-balance-user-diko (who principal))
  (get-user-borrow-balance who .diko)
)

(define-read-only (get-borrowed-balance-user-sBTC (who principal))
  (get-user-borrow-balance who .sBTC)
)

(define-read-only (get-borrowed-balance-user-wstx (who principal))
  (get-user-borrow-balance who .wstx)
)

(define-read-only (get-borrowed-balance-user-stSTX (who principal))
  (get-user-borrow-balance who .stSTX)
)

(define-read-only (get-borrowed-balance-user-xUSD (who principal))
  (get-user-borrow-balance who .xUSD)
)

(define-read-only (get-borrowed-balance-user-USDA (who principal))
  (get-user-borrow-balance who .USDA)
)

;; util functions
(define-public (borrowing-power-in-asset
  (asset <ft>)
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (asset-principal (contract-of asset))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state asset-principal))
    (user-assets (contract-call? .pool-0-reserve get-user-assets user))
    (user-global-data (try! (contract-call? .pool-0-reserve calculate-user-global-data user assets)))
    (asset-price (try! (contract-call? .oracle get-asset-price asset)))
  )
    (calculate-available-borrowing-power-in-asset
      asset
      (get decimals reserve-state)
      asset-price
      (get total-collateral-balanceUSD user-global-data)
      (get total-borrow-balanceUSD user-global-data)
      (get user-total-feesUSD user-global-data)
      (get current-ltv user-global-data)
      user
    )
  )
)

;; calculate how much a user can borrow of a specific asset using the available collateral
(define-read-only (calculate-available-borrowing-power-in-asset
  (borrowing-asset <ft>)
  (decimals uint)
  (asset-price uint)
  (current-user-collateral-balance-USD uint)
  (current-user-borrow-balance-USD uint)
  (current-fees-USD uint)
  (current-ltv uint)
  (user principal)
  )
  (let (
    (available-borrow-power-in-base-currency
      (if (> (mul current-user-collateral-balance-USD current-ltv) (+ current-user-borrow-balance-USD current-fees-USD))
        (-
          (mul current-user-collateral-balance-USD current-ltv)
          (+ current-user-borrow-balance-USD current-fees-USD)
        )
        u0
      )
    )
    (borrow-power-in-asset-amount
      (contract-call? .math from-fixed-to-precision
        (div
          available-borrow-power-in-base-currency
          asset-price
        )
        decimals
      )
    )
    (borrow-fee (try! (contract-call? .fees-calculator calculate-origination-fee user (contract-of borrowing-asset) borrow-power-in-asset-amount decimals)))
  )
    (ok (- borrow-power-in-asset-amount borrow-fee))
  )
)


;; get amount that user can decrease based on asset that user wishes to borrow
(define-public (get-decrease-balance-allowed
  (asset <ft>)
  (oracle <oracle-trait>)
  (user principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  )
  (let (
    (reserve-data (get-reserve-data (contract-of asset)))
    (user-data (get-user-reserve-data user (contract-of asset)))
    (user-global-data (unwrap-panic (contract-call? .pool-0-reserve calculate-user-global-data user assets-to-calculate)))
    (asset-price (unwrap-panic (contract-call? oracle get-asset-price asset)))
    (useable-collateral-in-base-currency
      (mul
        (- (get total-collateral-balanceUSD user-global-data) (+ (get total-borrow-balanceUSD user-global-data) (get user-total-feesUSD user-global-data)))
        (get current-liquidation-threshold user-global-data)))
    (amount-to-decrease
      (contract-call? .math from-fixed-to-precision
        (div
          useable-collateral-in-base-currency
          asset-price
        )
        (get decimals reserve-data)
      ))
  )
    (ok { amount-to-decrease: amount-to-decrease, useable-collateral-in-base-currency: useable-collateral-in-base-currency })
  )
)

(define-read-only (get-user-borrow-balance (who principal) (reserve principal))
  (let (
    (user-data (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who reserve)))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read reserve)))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get stable-borrow-rate user-data)
        (get last-updated-block user-data)
        (get last-variable-borrow-cumulative-index user-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )))
    {
      principal-balance: principal,
      compounded-balance: cumulated-balance,
      balance-increase: (- cumulated-balance principal),
    }
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
    (user-cumulative-index
      (if (is-eq last-variable-borrow-cumulative-index u0)
        last-variable-borrow-cumulative-index-reserve
        last-variable-borrow-cumulative-index
      )
    )
    (cumulated-interest
      (div
        (mul
          (calculate-compounded-interest
            current-variable-borrow-rate
            (- burn-block-height last-updated-block))
          last-variable-borrow-cumulative-index-reserve)
        user-cumulative-index))
    (compounded-balance (mul principal-borrow-balance cumulated-interest)))
    (if (is-eq compounded-balance principal-borrow-balance)
      (if (is-eq last-updated-block burn-block-height)
        (+ principal-borrow-balance u1)
        compounded-balance
      )
      compounded-balance
    )
  )
)

;; MATH
(define-constant sb-by-sy u1903)
(define-constant one-8 u100000000)
(define-constant one-12 u1000000000000)
(define-constant fixed-precision u8)
(define-constant max-value u340282366920938463463374607431768211455)
(define-read-only (get-max-value) max-value)

(define-read-only (calculate-compounded-interest
  (current-liquidity-rate uint)
  (delta uint))
  (begin
    (taylor-6 (get-rt-by-block current-liquidity-rate delta))
  )
)

(define-read-only (mul (x uint) (y uint))
  (/ (+ (* x y) (/ one-8 u2)) one-8))

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y))

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (mul (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (mul (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (div-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (div (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (div (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

;; assumes assets used do not have more than 12 decimals
(define-read-only (div-precision-to-fixed (a uint) (b uint) (decimals uint))
  (let (
    (adjustment-difference (- one-12 decimals))
    (result (/ (* a (pow u10 decimals)) b)))
    (to-fixed result decimals)
  )
)

(define-read-only (div-reduced-loss (a uint) (b uint))
  (begin
    (/ (* a one-8) b)
  )
)

(define-read-only (mul-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (from-fixed-to-precision (mul-to-fixed-precision a decimals-a b-fixed) decimals-a)
)

(define-read-only (add-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (+ (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (+ (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (sub-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (- (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (- (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (to-fixed (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (/ a (pow u10 (- decimals-a fixed-precision)))
    (* a (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (mul-perc (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (begin
      (*
        (mul (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
        (pow u10 (- decimals-a fixed-precision))
      )
    )
    (begin
      (/
        (mul (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
        (pow u10 (- fixed-precision decimals-a))
      )
    )
  )
)

(define-read-only (fix-precision (a uint) (decimals-a uint) (b uint) (decimals-b uint))
  (let (
    (a-standard
      (if (> decimals-a fixed-precision)
        (/ a (pow u10 (- decimals-a fixed-precision)))
        (* a (pow u10 (- fixed-precision decimals-a)))
      ))
    (b-standard
      (if (> decimals-b fixed-precision)
        (/ b (pow u10 (- decimals-b fixed-precision)))
        (* b (pow u10 (- fixed-precision decimals-b)))
      ))
  )
    {
      a: a-standard,
      decimals-a: decimals-a,
      b: b-standard,
      decimals-b: decimals-b,
    }
  )
)

(define-read-only (from-fixed-to-precision (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (* a (pow u10 (- decimals-a fixed-precision)))
    (/ a (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (from-fixed-to-precision
    (mul-to-fixed-precision x x-decimals (div x-price y-price))
    y-decimals
  )
)

(define-read-only (is-odd (x uint))
  (not (is-even x))
)

(define-read-only (is-even (x uint))
  (is-eq (mod x u2) u0)
)

;; rate in 8-fixed
;; time passed in seconds
;; u31536000
(define-read-only (get-rt (rate uint) (t uint))
  (begin
    (/ (* (/ (* rate one-12) seconds-in-year) t) u100000)
  )
)

;; rate in 8-fixed
;; n-blocks
(define-read-only (get-rt-by-block (rate uint) (blocks uint))
  (begin
    (mul rate (* blocks sb-by-sy))
  )
)

;; block-seconds/year-seconds in fixed precision

(define-read-only (get-sb-by-sy)
  sb-by-sy
)

(define-read-only (get-e) e)
(define-read-only (get-one) one-8)

(define-constant e 271828182)
(define-constant seconds-in-year u31536000
  ;; (* u144 u365 u10 u60)
)
(define-constant seconds-in-block u600
  ;; (* 10 60)
)

(define-read-only (get-seconds-in-year)
  seconds-in-year
)

(define-read-only (get-seconds-in-block)
  seconds-in-block
)

(define-constant fact_2 u200000000)
(define-constant fact_3 (mul u300000000 u200000000))
(define-constant fact_4 (mul u400000000 (mul u300000000 u200000000)))
(define-constant fact_5 (mul u500000000 (mul u400000000 (mul u300000000 u200000000))))
(define-constant fact_6 (mul u600000000 (mul u500000000 (mul u400000000 (mul u300000000 u200000000)))))

(define-read-only (x_2 (x uint)) (mul x x))
(define-read-only (x_3 (x uint)) (mul x (mul x x)))
(define-read-only (x_4 (x uint)) (mul x (mul x (mul x x))))
(define-read-only (x_5 (x uint)) (mul x (mul x (mul x (mul x x)))))
(define-read-only (x_6 (x uint)) (mul x (mul x (mul x (mul x (mul x x))))))

(define-read-only (taylor-6 (x uint))
  (+
    one-8 x
    (div (x_2 x) fact_2)
    (div (x_3 x) fact_3)
    (div (x_4 x) fact_4)
    (div (x_5 x) fact_5)
    (div (x_6 x) fact_6)
  )
)
