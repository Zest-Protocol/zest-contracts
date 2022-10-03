(use-trait ft .sip-010-trait.sip-010-trait)

(define-read-only (is-pool)
    (is-eq contract-caller .pool)
)

(define-read-only (is-loan)
    (is-eq contract-caller .loan)
)

(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
    (begin
        (asserts! (or (is-loan) (is-pool)) ERR_UNAUTHORIZED)
        (as-contract (contract-call? ft transfer amount tx-sender recipient none))
    )
)


(define-constant ERR_UNAUTHORIZED (err u300))
