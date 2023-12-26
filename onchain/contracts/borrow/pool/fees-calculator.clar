;; 0.0025%
(define-constant origination-fee-prc u250000)


(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-public (calculate-origination-fee (user principal) (amount uint))
  (begin
    (asserts! true (err u1))
    (ok (mul amount origination-fee-prc))
  )
)