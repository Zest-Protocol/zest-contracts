;; 0.0025%
(define-constant origination-fee-prc u250000)


(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-public (calculate-orgination-fee (user principal) (amount uint))
  (mul amount origination-fee-prc)
)