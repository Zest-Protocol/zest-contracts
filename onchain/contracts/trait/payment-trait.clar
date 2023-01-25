(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .ft-trait.ft-trait)

(define-trait payment-trait
  (
    (make-next-payment (<lp-token> <lv> uint <cp-token> <dt> <dt> <swap> uint uint uint <ft> principal) (response { reward: uint, z-reward: uint, repayment: bool } uint))
    (make-full-payment (<lp-token> <lv> uint <cp-token> <dt> <dt> <swap> uint uint uint <ft> principal) (response { reward: uint, z-reward: uint, full-payment: uint } uint))
  )
)
