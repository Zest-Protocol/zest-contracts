(use-trait asset .asset-trait.asset-trait)


(define-trait reserves-trait
    (
        (withdraw-asset (uint <asset>) (response uint uint))
        (deposit-asset (uint <asset>) (response uint uint))
    )
)

