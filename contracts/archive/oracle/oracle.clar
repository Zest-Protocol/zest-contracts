(impl-trait .oracle-trait.oracle-trait)

(define-map assets principal
    {
        price: uint,
        decimals: uint
    }
)

(define-data-var last-asset-id uint u0)

(define-constant ERR_ASSET_NOT_FOUND u401)

(define-read-only (get-asset (asset-id principal))
    (ok (unwrap! (map-get? assets asset-id) (err ERR_ASSET_NOT_FOUND)))
)

(define-public (set-price (asset principal) (price uint))
    (begin
        (map-set assets asset
            (merge
                (unwrap! (map-get? assets asset) (err ERR_ASSET_NOT_FOUND))
                { price: price }
            )
        )
        (ok true)
    )
)

(define-public (add-asset (asset-contract principal) (asset {  price: uint, decimals: uint }))
    (begin
        (ok (map-set assets asset-contract asset))
    )
)
