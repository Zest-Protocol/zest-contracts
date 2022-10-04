(use-trait ft .sip-010-trait.sip-010-trait)

(define-trait liquidity-vault-trait
  (
    ;; transfer ft from the contract to a new principal
    ;; amount sender recipient <token-contract>
    (transfer (uint principal <ft>) (response bool uint))
    ;; (fund-loan (uint principal <ft>) (response bool uint))
  )
)
