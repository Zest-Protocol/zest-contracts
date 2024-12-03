(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)

(define-read-only (is-active (asset principal))
  (let (
    (reserve-state (get-reserve-data asset))
    )
    (and (get is-active reserve-state) (not (get is-frozen reserve-state)))
  )
)

(define-constant available-assets (list .diko .sbtc .wstx .ststx .xusd .usda ))

(define-read-only (get-supplieable-assets)
  available-assets
)

(define-read-only (get-borroweable-assets)
  available-assets
)

(define-read-only (is-isolated-asset (asset principal))
  (is-isolated-type asset)
)

(define-read-only (is-isolated-type (asset principal))
  (default-to false (contract-call? .pool-reserve-data get-isolated-assets-read asset)))

(define-read-only (is-used-as-collateral (who principal) (asset principal))
  (get use-as-collateral (get-user-reserve-data who asset))
)

;; Define a helper function to get reserve data
(define-read-only (get-reserve-data (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset))
)

(define-read-only (get-user-reserve-data (who principal) (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who asset))
)

(define-read-only (get-asset-supply-apy (reserve principal))
  (let (
    (reserve-resp (get-reserve-data reserve))
  )
    (calculate-linear-interest
      (get current-liquidity-rate reserve-resp)
      (* u144 u365)
    )
  )
)

(define-read-only (get-user-assets (who principal))
  (default-to
    { assets-supplied: (list), assets-borrowed: (list) }
    (contract-call? .pool-reserve-data get-user-assets-read who)))

(define-read-only (get-useable-collateral-usd-diko (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-diko get-principal-balance who)))
    (reserve-data (get-reserve-data .diko))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .diko)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .diko))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-sbtc (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-sbtc get-principal-balance who)))
    (reserve-data (get-reserve-data .sbtc))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .sbtc)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .sbtc))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-wstx (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-wstx get-principal-balance who)))
    (reserve-data (get-reserve-data .wstx))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .wstx)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .wstx))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-ststx (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-ststx get-principal-balance who)))
    (reserve-data (get-reserve-data .ststx))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .ststx)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .ststx))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-xusd (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-xusd get-principal-balance who)))
    (reserve-data (get-reserve-data .xusd))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .xusd)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .xusd))
      )
    )
  )
)

(define-read-only (get-useable-collateral-usd-usda (who principal))
  (let (
    (asset-balance (unwrap-panic (contract-call? .lp-usda get-principal-balance who)))
    (reserve-data (get-reserve-data .usda))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who .usda)))
    (asset-decimals (get decimals reserve-data))
    (base-ltv-as-collateral (get base-ltv-as-collateral reserve-data))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)
      )
    )   
  )
    (mul
      base-ltv-as-collateral
      (mul
      (mul-to-fixed-precision
        asset-balance
        asset-decimals
        (div reserve-normalized-income user-index))
      (unwrap-panic (contract-call? .oracle get-asset-price .usda))
      )
    )
  )
)

(define-read-only (get-supplied-balance-user-usd-diko (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-diko who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
)

(define-read-only (get-supplied-balance-user-usd-sbtc (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-sbtc who) u8 (unwrap-panic (contract-call? .oracle get-asset-price .sbtc)))
)

(define-read-only (get-supplied-balance-user-usd-wstx (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-wstx who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
)

(define-read-only (get-supplied-balance-user-usd-ststx (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-ststx who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .ststx)))
)

(define-read-only (get-supplied-balance-user-usd-usda (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-usda who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .usda)))
)

(define-read-only (get-supplied-balance-user-usd-xusd (who principal) (oracle principal))
  (token-to-usd (get-supplied-balance-user-xusd who) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xusd)))
)

(define-read-only (get-supplied-balance-user-diko (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-diko get-principal-balance who))))
    (calculate-cumulated-balance who u6 .diko principal u6)
  )
)

(define-read-only (get-supplied-balance-user-sbtc (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-sbtc get-principal-balance who))))
    (calculate-cumulated-balance who u8 .sbtc principal u8)
  )
)

(define-read-only (get-supplied-balance-user-wstx (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-wstx get-principal-balance who))))
    (calculate-cumulated-balance who u6 .wstx principal u6)
  )
)

(define-read-only (get-supplied-balance-user-ststx (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-ststx get-principal-balance who))))
    (calculate-cumulated-balance who u6 .ststx principal u6)
  )
)

(define-read-only (get-supplied-balance-user-xusd (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-xusd get-principal-balance who))))
    (calculate-cumulated-balance who u6 .xusd principal u6)
  )
)

(define-read-only (get-supplied-balance-user-usda (who principal))
  (let ((principal (unwrap-panic (contract-call? .lp-usda get-principal-balance who))))
    (calculate-cumulated-balance who u6 .usda principal u6)
  )
)

(define-read-only (get-supplied-balance-usd-diko)
  (token-to-usd (unwrap-panic (contract-call? .diko get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .diko)))
)

(define-read-only (get-supplied-balance-usd-sbtc)
  (token-to-usd (unwrap-panic (contract-call? .sbtc get-balance .pool-vault)) u8 (unwrap-panic (contract-call? .oracle get-asset-price .sbtc)))
)

(define-read-only (get-supplied-balance-usd-wstx)
  (token-to-usd (unwrap-panic (contract-call? .wstx get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .wstx)))
)

(define-read-only (get-supplied-balance-usd-ststx)
  (token-to-usd (unwrap-panic (contract-call? .ststx get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .ststx)))
)

(define-read-only (get-supplied-balance-usd-usda)
  (token-to-usd (unwrap-panic (contract-call? .usda get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .usda)))
)

(define-read-only (get-supplied-balance-usd-xusd)
  (token-to-usd (unwrap-panic (contract-call? .xusd get-balance .pool-vault)) u6 (unwrap-panic (contract-call? .oracle get-asset-price .xusd)))
)

(define-read-only (get-supplied-balance-diko)
  (unwrap-panic (contract-call? .diko get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-sbtc)
  (unwrap-panic (contract-call? .sbtc get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-wstx)
  (unwrap-panic (contract-call? .wstx get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-ststx)
  (unwrap-panic (contract-call? .ststx get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-usda)
  (unwrap-panic (contract-call? .usda get-balance .pool-vault))
)

(define-read-only (get-supplied-balance-xusd)
  (unwrap-panic (contract-call? .xusd get-balance .pool-vault))
)

;; utils functions

(define-read-only (token-to-usd (amount uint) (decimals uint) (unit-price uint))
  (contract-call? .math mul-to-fixed-precision amount decimals unit-price)
)

(define-read-only (calculate-cumulated-balance
  (who principal)
  (lp-decimals uint)
  (asset <ft>)
  (asset-balance uint)
  (asset-decimals uint))
  (let (
    (asset-principal (contract-of asset))
    (reserve-data (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset-principal)))
    (user-index (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who (contract-of asset))))
    (reserve-normalized-income
      (get-normalized-income
        (get current-liquidity-rate reserve-data)
        (get last-updated-block reserve-data)
        (get last-liquidity-cumulative-index reserve-data)))
        )
      (from-fixed-to-precision
        (mul-to-fixed-precision
          asset-balance
          asset-decimals
          (div reserve-normalized-income user-index)
        )
        asset-decimals
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

(define-read-only (get-normalized-income
  (current-liquidity-rate uint)
  (last-updated-block uint)
  (last-liquidity-cumulative-index uint))
  (let (
    (cumulated 
      (calculate-linear-interest
        current-liquidity-rate
        (- burn-block-height last-updated-block))))
    (mul cumulated last-liquidity-cumulative-index)
  )
)

(define-read-only (calculate-linear-interest
  (current-liquidity-rate uint)
  (delta uint))
  (let (
    (rate (get-rt-by-block current-liquidity-rate delta))
  )
    (+ one-8 rate)
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
;; n-blocks
(define-read-only (get-rt-by-block (rate uint) (blocks uint))
  (/ (* rate (* blocks sb-by-sy)) one-8)
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
