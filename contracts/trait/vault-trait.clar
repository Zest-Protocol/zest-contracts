(use-trait ft .sip-010-trait.sip-010-trait)

(define-trait vault-trait
  (
    ;; transfer ft from the contract to a new principal
    ;; amount sender recipient <token-contract>
    (transfer (uint principal <ft>) (response bool uint))
  )
)