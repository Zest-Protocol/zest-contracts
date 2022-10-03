(use-trait lp-token .lp-token-trait.lp-token-trait)

(define-trait payment-trait
  (
    (make-next-payment (<lp-token> <lp-token> uint uint) (response { reward: uint, repayment: bool } uint))
    (make-full-payment (<lp-token> <lp-token> uint uint) (response { reward: uint, full-payment: uint } uint))
  )
)