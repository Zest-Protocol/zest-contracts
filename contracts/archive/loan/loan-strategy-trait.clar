(use-trait asset .asset-trait.asset-trait)
(use-trait oracle .oracle-trait.oracle-trait)

(define-trait loan-strategy-trait
    (
        ;; get price for asset-id
        ;; maybe we want to variable parameters so we compare instead to a fixed h160
        (get-rate () (response uint uint))
        (get-ratio () (response uint uint))

        (get-borrowing-potential (<oracle> <asset> <asset> uint) (response uint uint))
    )
)
