
(define-read-only (get-origination-fee-prc (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-origination-fee-prc-read asset))
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (mul-to-fixed-precision  (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (mul-perc  (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-perc a decimals-a b-fixed)
)

(define-read-only (from-fixed-to-precision (a uint) (decimals-a uint))
  (contract-call? .math from-fixed-to-precision a decimals-a)
)

(define-read-only (calculate-origination-fee (user principal) (asset principal) (amount uint) (decimals uint))
  (begin
    (asserts! true (err u9999))
    (ok (mul-perc amount decimals (get-origination-fee-prc asset)))
  )
)