(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

(use-trait oracle-trait .oracle-trait.oracle-trait)



;; before calculating, add up all:
;; liquidity-balanceUSD
;; current-ltv
;; current-liquidation-threshold
(define-read-only (calculate-user-limits
  (total-collateral-balanceUSD uint)
  (total-current-ltv uint)
  (total-current-liquidation-threshold uint)
  (total-borrow-balanceUSD uint)
  (total-feesUSD uint)
  )
  (let (
    (health-factor-liquidation-threshold (contract-call? .pool-reserve-data get-health-factor-liquidation-threshold-read))
    (ltv (div total-current-ltv total-collateral-balanceUSD))
    (liquidation-threshold (div total-current-liquidation-threshold total-collateral-balanceUSD))
    (health-factor (calculate-health-factor-from-balances
      total-collateral-balanceUSD
      total-borrow-balanceUSD
      total-feesUSD
      liquidation-threshold
    ))
  )
    {
      ltv: ltv,
      liquidation-threshold: liquidation-threshold,
      health-factor: health-factor,
      health-factor-below-threshold: (< health-factor health-factor-liquidation-threshold)
    }
  )
)

(define-read-only (calculate-health-factor-from-balances
  (total-collateral-balanceUSD uint)
  (total-borrow-balanceUSD uint)
  (total-feesUSD uint)
  (current-liquidation-threshold uint))
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


(define-read-only (get-user-asset-debt-data-ststx (user principal))
  (let ((unit-price (get-ststx-price)))
    (calculate-user-asset-debt user 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token unit-price)
  )
)

(define-read-only (get-user-asset-debt-data-stx (user principal))
  (let ((unit-price (contract-call? .stx-oracle-v1-3 get-price)))
    (calculate-user-asset-debt user .wstx unit-price)
  )
)

(define-read-only (get-user-asset-debt-data-aeusdc (user principal))
  (let ((unit-price (contract-call? .aeusdc-oracle-v1-0 get-price)))
    (calculate-user-asset-debt user 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc unit-price)
  )
)

;; check if can be used as collateral before calling this
(define-read-only (get-user-asset-collateral-data-ststx (user principal))
  (let (
    (reserve-data (get-reserve-data 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token))
    (user-index (get-user-index user 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token))
    (principal-balance (unwrap-panic (contract-call? .zststx-v1-2 get-principal-balance user)))
    (decimals (get decimals reserve-data))
    (unit-price (get-ststx-price))
  )
    (calculate-user-asset-collateral
      principal-balance
      decimals
      (get current-liquidity-rate reserve-data)
      (get last-updated-block reserve-data)
      (get last-liquidity-cumulative-index reserve-data)
      user-index
      unit-price
      (get base-ltv-as-collateral reserve-data)
      (get liquidation-threshold reserve-data)
    )
  )
)

;; check if can be used as collateral before calling this
(define-read-only (get-user-asset-collateral-data-stx (user principal))
  (let (
    (reserve-data (get-reserve-data .wstx))
    (user-index (get-user-index user .wstx))
    (principal-balance (unwrap-panic (contract-call? .zwstx-v1-2 get-principal-balance user)))
    (decimals (get decimals reserve-data))
    (unit-price (contract-call? .stx-oracle-v1-3 get-price))
  )
    (calculate-user-asset-collateral
      principal-balance
      decimals
      (get current-liquidity-rate reserve-data)
      (get last-updated-block reserve-data)
      (get last-liquidity-cumulative-index reserve-data)
      user-index
      unit-price
      (get base-ltv-as-collateral reserve-data)
      (get liquidation-threshold reserve-data)
    )
  )
)

;; check if can be used as collateral before calling this
(define-read-only (get-user-asset-collateral-data-aeusdc (user principal))
  (let (
    (reserve-data (get-reserve-data 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc))
    (user-index (get-user-index user 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc))
    (principal-balance (unwrap-panic (contract-call? .zaeusdc-v1-2 get-principal-balance user)))
    (decimals (get decimals reserve-data))
    (unit-price (contract-call? .aeusdc-oracle-v1-0 get-price))
  )
    (calculate-user-asset-collateral
      principal-balance
      decimals
      (get current-liquidity-rate reserve-data)
      (get last-updated-block reserve-data)
      (get last-liquidity-cumulative-index reserve-data)
      user-index
      unit-price
      (get base-ltv-as-collateral reserve-data)
      (get liquidation-threshold reserve-data)
    )
  )
)

(define-read-only (get-ststx-price)
  (let (
    (ststx-price (get last-price (contract-call? 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-oracle-v2-3 get-price "stSTX")))
  )
    (* ststx-price u100)
  )
)

(define-read-only (calculate-user-asset-debt (user principal) (asset principal) (unit-price uint))
  (let (
    (reserve-data (get-reserve-data asset))
    (user-reserve-data (get-user-reserve-data user asset))
    (compounded-borrow-balance
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-reserve-data)
        (get decimals reserve-data)
        (get stable-borrow-rate user-reserve-data)
        (get last-updated-block user-reserve-data)
        (get last-variable-borrow-cumulative-index user-reserve-data)
        (get current-variable-borrow-rate reserve-data)
        (get last-variable-borrow-cumulative-index reserve-data)
        (get last-updated-block reserve-data)
      )
    )
  )
    {
      borrow-balanceUSD: (mul-to-fixed-precision compounded-borrow-balance (get decimals reserve-data) unit-price),
      user-feesUSD: (mul-to-fixed-precision (get origination-fee user-reserve-data) (get decimals reserve-data) unit-price),
    }
  )
)

(define-read-only (calculate-user-asset-collateral
  (principal-balance uint)
  (decimals uint)
  (current-liquidity-rate uint)
  (last-updated-block uint)
  (last-liquidity-cumulative-index uint)
  (user-index uint)
  (unit-price uint)
  (base-ltv-as-collateral uint)
  (liquidation-threshold uint)
  )
  (let (
    (underlying-balance
      (from-fixed-to-precision
        (mul-to-fixed-precision
          principal-balance
          decimals
          (div (get-normalized-income
            current-liquidity-rate
            last-updated-block
            last-liquidity-cumulative-index)
            user-index)
        )
        decimals
      )
    )
    (collateral-balanceUSD (mul-to-fixed-precision underlying-balance decimals unit-price))
    )
    {
      collateral-balanceUSD: collateral-balanceUSD,
      current-ltv: (mul collateral-balanceUSD base-ltv-as-collateral),
      current-liquidation-threshold: (mul collateral-balanceUSD liquidation-threshold),
    }
  )
)

(define-read-only (get-reserve-data (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-reserve-state-read asset))
)

(define-read-only (get-user-reserve-data (who principal) (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-user-reserve-data-read who asset))
)

(define-read-only (get-user-index (who principal) (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-user-index-read who asset))
)

(define-read-only (calculate-cumulated-balance
  (who principal)
  (lp-decimals uint)
  (asset principal)
  (asset-balance uint)
  (asset-decimals uint))
  (let (
    (reserve-data (get-reserve-data asset))
    (user-index (get-user-index who asset))
    (underlying-balance
      (from-fixed-to-precision
        (mul-to-fixed-precision
          asset-balance
          asset-decimals
          (div (get-normalized-income
            (get current-liquidity-rate reserve-data)
            (get last-updated-block reserve-data)
            (get last-liquidity-cumulative-index reserve-data))
            user-index)
        )
        asset-decimals
      )
    ))
    underlying-balance
  )
)

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

(define-read-only (get-user-borrow-balance (who principal) (reserve principal))
  (let (
    (reserve-data (get-reserve-data reserve))
    (user-data (get-user-reserve-data who reserve))
    (principal (get principal-borrow-balance user-data))
    (cumulated-balance 
      (get-compounded-borrow-balance
        (get principal-borrow-balance user-data)
        (get decimals reserve-data)
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
  (decimals uint)
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
    (compounded-balance (mul-precision-with-factor principal-borrow-balance decimals cumulated-interest)))
    (if (is-eq compounded-balance principal-borrow-balance)
      (if (not (is-eq last-updated-block burn-block-height))
        (+ principal-borrow-balance u1)
        compounded-balance
      )
      compounded-balance
    )
  )
)

(define-constant one-8 u100000000)
(define-constant one-12 u1000000000000)
(define-constant fixed-precision u8)

(define-constant max-value u340282366920938463463374607431768211455)

(define-constant e 271828182)
;; (* u144 u365 u10 u60)
(define-constant seconds-in-year u31536000)
;; (* u10 u60)
(define-constant seconds-in-block u600)
;; seconds-year/seconds-block, to multiply with number of blocks to determine seconds passed in x number of blocks, is in fixed-precision
;; (/ (* seconds-in-block one-8) u31536000)
(define-constant sb-by-sy u1903)

(define-read-only (get-max-value)
  max-value
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

(define-read-only (div-precision-to-fixed (a uint) (b uint) (decimals uint))
  (let (
    (result (/ (* a (pow u10 decimals)) b)))
    (to-fixed result decimals)
  )
)

;; Multiply a number with arbitrary decimals with a fixed-precision number
;; return number with arbitrary decimals
(define-read-only (mul-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    ;; convert a and b-fixed in decimals-a precision
    ;; result is in decimals-a precision
    (mul-arbitrary a (* b-fixed (pow u10 (- decimals-a fixed-precision))) decimals-a)
    ;; convert a to fixed precision
    ;; result is in fixed precision, convert to decimals-a
    (/
      (mul-arbitrary (* a (pow u10 (- fixed-precision decimals-a))) b-fixed u8)
      (pow u10 (- fixed-precision decimals-a)))
  )
)

;; Divide a number with arbitrary decimals by a fixed-precision number, then return to
;; number with arbitrary decimals
(define-read-only (div-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    ;; convert b-fixed to decimals-a precision
    ;; final result is in decimals-a precision
    (div-arbitrary a (* b-fixed (pow u10 (- decimals-a fixed-precision))) decimals-a)
    ;; convert a to fixed precision
    ;; result is in fixed precision, convert to decimals-a
    (/
      (div-arbitrary (* a (pow u10 (- fixed-precision decimals-a))) b-fixed u8)
      (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (mul-arbitrary (x uint) (y uint) (arbitrary-prec uint))
  (/ (+ (* x y) (/ (pow u10 arbitrary-prec) u2)) (pow u10 arbitrary-prec)))

(define-read-only (div-arbitrary (x uint) (y uint) (arbitrary-prec uint))
  (/ (+ (* x (pow u10 arbitrary-prec)) (/ y u2)) y))

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

;; multiply a number of arbitrary precision with a 8-decimals fixed number
;; convert back to unit of arbitrary precision
(define-read-only (mul-perc (a uint) (decimals-a uint) (b-fixed uint))
  (mul-precision-with-factor a decimals-a b-fixed)
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

;; x-price and y-price are in fixed precision
(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (if (> x-decimals y-decimals)
    ;; decrease decimals if x has more decimals
    (/ (div-precision-with-factor (mul-precision-with-factor x x-decimals x-price) x-decimals y-price) (pow u10 (- x-decimals y-decimals)))
    ;; do operations in the amounts with greater decimals, convert x to y-decimals
    (div-precision-with-factor (mul-precision-with-factor ( * x (pow u10 (- y-decimals x-decimals))) y-decimals x-price) y-decimals y-price)
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

(define-read-only (get-sb-by-sy)
  sb-by-sy
)

(define-read-only (get-e) e)

(define-read-only (get-one) one-8)

(define-read-only (get-seconds-in-year)
  seconds-in-year
)

(define-read-only (get-seconds-in-block)
  seconds-in-block
)

(define-constant fact_2 u200000000)
;; (mul u300000000 u200000000)
(define-constant fact_3 u600000000)
;; (mul u400000000 (mul u300000000 u200000000))
(define-constant fact_4 u2400000000)
;; (mul u500000000 (mul u400000000 (mul u300000000 u200000000)))
(define-constant fact_5 u12000000000)
;; (mul u600000000 (mul u500000000 (mul u400000000 (mul u300000000 u200000000))))
(define-constant fact_6 u72000000000)

;; taylor series expansion to the 6th degree to estimate e^x
(define-read-only (taylor-6 (x uint))
  (let (
    (x_2 (mul x x))
    (x_3 (mul x x_2))
    (x_4 (mul x x_3))
    (x_5 (mul x x_4))
  )
    (+
      one-8 x
      (div x_2 fact_2)
      (div x_3 fact_3)
      (div x_4 fact_4)
      (div x_5 fact_5)
      (div (mul x x_5) fact_6)
    )
  )
)