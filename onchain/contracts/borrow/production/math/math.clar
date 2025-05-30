(define-constant one-8 u100000000)
(define-constant fixed-precision u8)

(define-constant max-value u340282366920938463463374607431768211455)

(define-constant e 271828182)
;; (* u144 u365 u10 u60)
(define-constant seconds-in-year u31536000)

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
(define-read-only (get-rt-by-block (rate uint) (delta uint))
  (if (is-eq delta u0)
    u0
    (let (
      (start-time (unwrap-panic (get-stacks-block-info? time (- stacks-block-height delta))))
      ;; add 5 seconds
      (end-time (+ u5 (unwrap-panic (get-stacks-block-info? time (- stacks-block-height u1)))))
      (delta-time (- end-time start-time))
    )
      (/ (* rate delta-time) seconds-in-year)
    )
  )
)

(define-read-only (get-e) e)

(define-read-only (get-one) one-8)

(define-read-only (get-seconds-in-year)
  seconds-in-year
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