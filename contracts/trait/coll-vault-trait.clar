(use-trait ft .sip-010-trait.sip-010-trait)


(define-trait coll-vault-trait
    (
        (transfer (uint principal <ft>) (response bool uint))
        (store (<ft> uint uint) (response bool uint))
        (add-collateral (<ft> uint uint) (response bool uint))
        (draw (<ft> uint principal) (response uint uint))
        (get-loan-coll (uint) (response { coll-type: principal, amount: uint } uint))
    )
)