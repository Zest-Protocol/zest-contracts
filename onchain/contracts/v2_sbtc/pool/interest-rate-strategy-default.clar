
;; 0.8 Ur
(define-constant optimal-utilization-rate u80000000)
(define-constant excess-utilization-rate (- u100000000 optimal-utilization-rate))

(define-constant one-percent u1000000)
(define-constant five-percent u5000000)
(define-constant ten-percent u10000000)

;; when Ur = 0
(define-data-var base-variable-borrow-rate uint one-percent)
(define-public (set-base-variable-borrow-rate (rate uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set base-variable-borrow-rate rate))))

(define-read-only (get-base-variable-borrow-rate)
  (ok (var-get base-variable-borrow-rate)))

;; when Ur < optimal-utilization-rate
(define-data-var variable-rate-slope-1 uint five-percent)
(define-public (set-variable-rate-slope-1 (rate uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set variable-rate-slope-1 rate))))

(define-read-only (get-variable-rate-slope-1)
  (ok (var-get variable-rate-slope-1)))

;; when Ur > optimal-utilization-rate
(define-data-var variable-rate-slope-2 uint ten-percent)
(define-public (set-variable-rate-slope-2 (rate uint))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set variable-rate-slope-2 rate))))

(define-read-only (get-variable-rate-slope-2)
  (ok (var-get variable-rate-slope-2)))

;; when Ur < optimal-utilization-rate
(define-data-var stable-rate-slope-1 uint five-percent)
;; when Ur > optimal-utilization-rate
(define-data-var stable-rate-slope-2 uint ten-percent)

(define-constant one-8 (contract-call? .math get-one))

(define-read-only (mul (x uint) (y uint))
  (/ (+ (* x y) (/ one-8 u2)) one-8))

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y))

(define-read-only (div-precision-to-fixed (a uint) (b uint) (decimals uint))
  (contract-call? .math div-precision-to-fixed a b decimals))

(define-read-only (mul-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-precision-with-factor a decimals-a b-fixed))

;; returns current liquidity rate
(define-read-only (calculate-interest-rates
    (available-liquidity uint)
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (average-stable-borrow-rate uint)
    (decimals uint)
  )
  (let (
    (total-borrows (+ total-borrows-stable total-borrows-variable))
    (utilization-rate
      (if (and (is-eq total-borrows-stable u0) (is-eq total-borrows-variable u0))
        u0
        (div-precision-to-fixed total-borrows (+ total-borrows available-liquidity) decimals)))
    (current-stable-borrow-rate u0))
    (if (> utilization-rate optimal-utilization-rate)
      (let (
        (excess-utilization-rate-ratio (div (- utilization-rate optimal-utilization-rate) excess-utilization-rate))
        (new-variable-borrow-rate
          (+
            (+ (var-get base-variable-borrow-rate) (var-get variable-rate-slope-1))
            (mul (var-get variable-rate-slope-2) excess-utilization-rate-ratio))
          ))
          {
            current-liquidity-rate:
            (mul
              new-variable-borrow-rate
              utilization-rate
            ),
            current-variable-borrow-rate: new-variable-borrow-rate,
            utilization-rate: utilization-rate,
          }
      )
      (let (
        (new-variable-borrow-rate
          (+
            (var-get base-variable-borrow-rate)
            (mul
              (div utilization-rate optimal-utilization-rate)
              (var-get variable-rate-slope-1)
            ))))
          {
            current-liquidity-rate:
              (mul 
                new-variable-borrow-rate
                utilization-rate
              ),
            current-variable-borrow-rate: new-variable-borrow-rate,
            utilization-rate: utilization-rate,
          }
      )
    )
  )
)

(define-read-only (get-overall-borrow-rate-internal
    (total-borrows-stable uint)
    (total-borrows-variable uint)
    (current-variable-borrow-rate uint)
    (current-average-stable-borrow-rate uint)
    (decimals uint)
  )
  (let (
    (total-borrows total-borrows-variable)
  )
    (if (is-eq total-borrows u0)
      u0
      (div-precision-to-fixed
        (mul-precision-with-factor total-borrows-variable decimals current-variable-borrow-rate)
        total-borrows
        decimals
      )
    )
  )
)

(define-read-only (get-utilization-rate
  (total-borrows-stable uint)
  (total-borrows-variable uint)
  (available-liquidity uint))
  (let (
    (total-borrows (+ total-borrows-stable total-borrows-variable))
  )
    (if (is-eq total-borrows u0)
      u0
      (div total-borrows (+ total-borrows available-liquidity))
    )
  )
)

(define-constant seconds-in-year (* u144 u365 u10 u60))

(define-read-only (calculate-continous-compounded-interest
  (principal uint)
  (annual-rate uint)
  (duration-seconds uint)
)
  (let (
    (immediate-rate (mul annual-rate (div duration-seconds seconds-in-year)))
    (e-rt (taylor-6 immediate-rate))
  )
    (mul principal e-rt)
  )
)

(define-read-only (is-odd (x uint))
  (not (is-even x))
)

(define-read-only (is-even (x uint))
  (is-eq (mod x u2) u0)
)

(define-constant e 271828182)

(define-data-var contract-owner principal tx-sender)
(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-reserve-data", payload: owner })
    (ok (var-set contract-owner owner))))

(define-public (get-contract-owner)
  (ok (var-get contract-owner)))
(define-read-only (get-contract-owner-read)
  (var-get contract-owner))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

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

(define-constant ERR_UNAUTHORIZED (err u7000))