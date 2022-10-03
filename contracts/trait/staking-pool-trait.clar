(use-trait sp-token .lp-token-trait.lp-token-trait)

(define-trait staking-pool-trait
  (
    (default-withdrawal (<sp-token>) (response uint uint))
  )
)