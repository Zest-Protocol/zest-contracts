
(define-trait loan-payment-trait
    (
        ;; get price for asset-id
        ;; maybe we want to variable parameters so we compare instead to a fixed h160
        (get-rate () (response uint uint))
        (get-ratio () (response uint uint))

        (get-interest-payment (uint uint uint) (response uint uint))
    )
)
