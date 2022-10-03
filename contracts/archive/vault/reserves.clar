(use-trait asset .asset-trait.asset-trait)

(define-constant ERR_UNAUTHORIZED u300)

(define-map caller-contracts principal bool)

(define-private (is-approved-caller (caller principal))
    (default-to false (map-get? caller-contracts caller))
)

(define-public (withdraw (asset <asset>) (amount uint) (recipient principal))
    (begin
        (asserts! (is-approved-caller contract-caller) (err ERR_UNAUTHORIZED))
        (as-contract (contract-call? asset transfer amount tx-sender recipient none))
    )
)


(map-set caller-contracts .vault-accounting true)