(impl-trait .loan-payment-trait.loan-payment-trait)

(define-data-var parameters
    { 
        rate-num: uint,
        rate-den: uint,
        debt-coll-ratio: uint
    }
    { 
        rate-num: u57078, ;; 0.000057078 per block
        rate-den: (pow u10 u10),
        debt-coll-ratio: u150
    }
)

(define-constant BLOCKS_PER_YEAR u52560)
(define-constant PRECISION (pow u10 u9))

(define-public (get-rate)
    (ok (get rate-num (var-get parameters)))
)

(define-public (set-parameters)
    (ok true)
)

(define-public (get-ratio)
    (ok (get debt-coll-ratio (var-get parameters)))
)

;; yield at a fixed rate (no compounding)
;; u100 could change if we use rates with more precision.
(define-public (get-interest-payment (amount uint) (apr uint) (block-delta uint))
    ;; P * r * t => Amount * perc_rate * blocks
    ;; perform division last
    (let (
        (payment (/
            (/ (* amount block-delta  apr PRECISION) BLOCKS_PER_YEAR) ;; amount * delta * (APR / blocks_per_year)
            PRECISION
            u10000))
    )
        ;; 10 percent increase
        (ok (+ payment (/ (* payment u10) u100)))
    )
)
