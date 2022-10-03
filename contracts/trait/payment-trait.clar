(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait swap .swap-router-trait.swap-router-trait)
(use-trait ft .sip-010-trait.sip-010-trait)

(define-trait payment-trait
  (
    (make-next-payment (<lp-token> uint <lp-token> <dt> <swap> uint uint <ft>) (response { reward: uint, z-reward: uint, repayment: bool } uint))
    (make-full-payment (<lp-token> uint <lp-token> <dt> <swap> uint uint <ft>) (response { reward: uint, z-reward: uint, full-payment: uint } uint))
  )
)
