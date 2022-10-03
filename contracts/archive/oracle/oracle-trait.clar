
(define-trait oracle-trait
    (
        ;; get price for asset-id
        (get-asset (principal) (response (tuple (price uint) (decimals uint)) uint))
        ;; set price for asset-id
        (set-price (principal uint) (response bool uint))
    )
)
