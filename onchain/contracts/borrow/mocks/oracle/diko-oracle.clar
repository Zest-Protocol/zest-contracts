(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

(define-read-only (to-fixed (a uint) (decimals-a uint))
  (contract-call? .math-v1-2 to-fixed a decimals-a)
)

(define-constant one-diko u1000000)
(define-constant one-stx u1000000)
(define-constant one-usda u1000000)

(define-constant dex-stx .wstx)
;; (define-constant dex-stx .wstx)
(define-constant dex-diko .diko)
;; (define-constant dex-diko .diko)

;; maximum difference of 1% from average dex diko price
(define-constant max-delta u1000000)
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
    (average-dex-diko-price (unwrap-panic (get-average-dex-diko-price)))
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
    (random-bytes (unwrap! (get-random-bytes block-height u2) (err u88)))
    (rand-1 (mod (buff-to-uint-le (unwrap! (slice? random-bytes u0 u1) (err u234))) u10) )
    (rand-2 (mod (buff-to-uint-le (unwrap! (slice? random-bytes u1 u2) (err u235))) u10) )
    (last-height (- block-height u1))
    (heights (list last-height (- last-height rand-1) (- last-height rand-2)))
    (prices (get-diko-prices heights))
  )
    ;; average price from the last 3 blocks
    (ok (/ (try! (fold add-resp prices (ok u0))) (len heights)))
  )
)

(define-read-only (add-resp (amount-to-add (response uint uint)) (total (response uint uint)))
  (match amount-to-add
    amount (ok (+ (unwrap-panic total) amount))
    bad-resp (err bad-resp)
  )
)

(define-read-only (get-pseudo-random-uint (height uint))
  (match (get-block-info? vrf-seed height)
    vrf-seed (some (buff-to-uint-le (unwrap-panic (as-max-len? (unwrap-panic (slice? vrf-seed u0 u16)) u16))))
    none)
)

(define-read-only (get-random-bytes (height uint) (size uint))
  (match (get-block-info? vrf-seed height)
    vrf-seed (some (unwrap! (as-max-len? (unwrap! (slice? vrf-seed u0 size) none) u16) none))
    none)
)

(define-read-only (get-diko-prices (heights (list 10 uint)))
  (map get-diko-price-at heights)
)

(define-read-only (get-diko-price-at (height uint))
  (ok
    (at-block
      (unwrap-panic (get-block-info? id-header-hash height))
      (try! (get-diko-dex-price))
    )
  )
)

;; get exchange rate between stx/diko, convert stx amount to it's currency value
(define-read-only (get-diko-dex-price)
  (ok (mul-to-fixed-precision (get-y-for-x .wstx .diko one-diko) u6 (try! (get-stx-price))))
)

(define-read-only (get-stx-price)
  (let (
    (oracle-data (contract-call? .arkadiko-oracle get-price "STX"))
    )
    (asserts! (< (- block-height (get last-block oracle-data)) u10) (err u8))
    (ok (to-fixed (get last-price oracle-data) u6))
  )
)

;; get the value of 1 DIKO in STX using x*y=k curve
(define-read-only (get-y-for-x (contract-x principal) (contract-y principal) (dx uint))
  (let (
    ;; ref: https://github.com/arkadiko-dao/arkadiko/blob/master/clarity/contracts/swap/arkadiko-swap-v2-1.clar#L473
    (pair (unwrap-panic (contract-call? .dex get-pair-details contract-x contract-y)))
    (balance-x (get balance-x pair))
    (balance-y (get balance-y pair))
    (dx-with-fees (/ (* u997 dx) u1000))
    (dy (/ (* balance-x dx-with-fees) (+ balance-y dx-with-fees)))
    )
    dy
  )
)


;; prices are fixed to 8 decimals
(define-read-only (get-price)
  (let (
    (oracle-data (contract-call? .arkadiko-oracle get-price "DIKO"))
    (last-price (to-fixed (get last-price oracle-data) u6))
    (average-dex-diko-price (unwrap! (get-average-dex-diko-price) (err u84213)))
    (diff (mul average-dex-diko-price max-delta))
  )
    ;; check for stale oracle
    (asserts! (< (- block-height (get last-block oracle-data)) u10) (err u8))
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
