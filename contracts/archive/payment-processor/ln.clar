(impl-trait .payment-processor-trait.payment-processor-trait)

(define-constant ERR_VAULT_EXISTS u403)

(define-map vault-dest
    uint
    { dest: (buff 1024), owner: principal })

(define-public (map-vault (vault-id uint) (dest (buff 1024)) (owner principal))
    (begin
        (unwrap! (map-get? vault-dest vault-id) (err ERR_VAULT_EXISTS))
        (map-set vault-dest vault-id { dest: 0x, owner: owner })
        (ok u1)
    )
)

