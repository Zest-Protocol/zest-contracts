(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

(define-read-only (to-fixed (a uint) (decimals-a uint))
  (contract-call? .math-v1-2 to-fixed a decimals-a)
)

(define-constant one-diko u1000000)
(define-constant one-usda u1000000)

;; maximum difference of 10% from average dex diko price
(define-constant max-delta u10000000)
;; 2USD
(define-constant max-possible-price u200000000)
;; 0.01USD
(define-constant min-possible-price u1000000)

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math-v1-2 mul-to-fixed-precision a decimals-a b-fixed))

(define-read-only (mul (a uint) (b uint))
  (contract-call? .math-v1-2 mul a b))


;; get the price from the oracle and use the average dex price for sanity checks
(define-public (get-asset-price (token <ft>))
  (let (
    (last-price (to-fixed (get last-price (contract-call? .arkadiko-oracle get-price "DIKO")) u6))
    (average-dex-diko-price (get-average-dex-diko-price))
    (diff (mul average-dex-diko-price max-delta))
  )
    ;; ensure that price from oracle is between a range of the average dex price
    (asserts! (< last-price (+ average-dex-diko-price diff)) (err u9))
    (asserts! (> last-price (- average-dex-diko-price diff)) (err u10))
    ;; sanity checks on oracle price
    (asserts! (> last-price min-possible-price) (err u11))
    (asserts! (< last-price max-possible-price) (err u12))
    ;; convert to fixed precision
    (ok last-price)
  )
)

(define-read-only (get-average-dex-diko-price)
  (let (
    (last-height (- block-height u1))
    (heights (list last-height (- last-height u1) (- last-height u1)))
    (prices (get-diko-prices heights))
  )
    (to-fixed
      ;; average price from the last 3 blocks
      (/ (fold + prices u0) (len heights))
      u6
    )
  )
)

(define-read-only (get-diko-prices (heights (list 10 uint)))
  (map get-diko-price-at heights)
)

(define-read-only (get-diko-price-at (height uint))
  (at-block
    (unwrap-panic (get-block-info? id-header-hash height))
    (get-diko-price)
  )
)

(define-read-only (get-diko-price)
  (mul-to-fixed-precision (get-dy .diko .usda) u6 (get-usda-price))
)

;; get the price of 1 USDA in fixed precision using x*y=k curve
;; We are using the price of STX to determine the price of 1 USDA stablecoin
(define-read-only (get-usda-price)
  (let (
    (oracle-data (contract-call? .arkadiko-oracle get-price "STX"))
    (pair (unwrap-panic (contract-call? .dex-data get-pair-details .wstx .usda)))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 one-usda) u1000))
    (dx (/ (* balance-x dx-with-fees) (+ balance-y dx-with-fees)))
    )
    (mul-to-fixed-precision dx u6 (to-fixed (get last-price oracle-data) u6))
  )
)

;; get the value of 1 DIKO in USDA using x*y=k curve
(define-read-only (get-dy (contract-x principal) (contract-y principal))
  (let (
    (pair (unwrap-panic (contract-call? .dex-data get-pair-details contract-x contract-y)))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 one-diko) u1000))
    (dy (/ (* balance-y dx-with-fees) (+ balance-x dx-with-fees)))
    )
    dy
  )
)


;; prices are fixed to 8 decimals
(define-read-only (get-price)
  (let (
    (last-price (to-fixed (get last-price (contract-call? .arkadiko-oracle get-price "DIKO")) u6))
    (average-dex-diko-price (get-average-dex-diko-price))
    (diff (mul average-dex-diko-price max-delta))
  )
    ;; ensure that price from oracle is between a range of the average dex price
    (asserts! (< last-price (+ average-dex-diko-price diff)) (err u9))
    (asserts! (> last-price (- average-dex-diko-price diff)) (err u10))
    ;; sanity checks on oracle price
    (asserts! (> last-price min-possible-price) (err u11))
    (asserts! (< last-price max-possible-price) (err u12))
    ;; convert to fixed precision
    (ok last-price)
  )
)
