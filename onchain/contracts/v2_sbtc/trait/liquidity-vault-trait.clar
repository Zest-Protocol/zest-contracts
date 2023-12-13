(use-trait ft .ft-trait.ft-trait)

(define-trait liquidity-vault-trait
  (
    ;; transfer ft from the contract to a new principal
    ;; amount sender recipient <token-contract>
    (transfer (uint principal <ft>) (response bool uint))
    (add-asset (<ft> uint uint principal) (response uint uint))
    (remove-asset (<ft> uint uint principal) (response uint uint))
    (draw (<ft> uint principal) (response uint uint))
    (get-asset (uint) (response (optional uint) uint))
  )
)
