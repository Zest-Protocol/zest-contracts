(use-trait asset .asset-trait.asset-trait)

(define-trait payment-processor-trait
    (
        ;; map a vault-id to a buff addr
        (map-vault (uint (buff 1024) principal) (response uint uint))
        (remove-vault (uint principal) (response uint uint))
    )
)
