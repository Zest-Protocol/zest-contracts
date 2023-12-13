(use-trait ft .ft-trait.ft-trait)


(define-trait coll-vault-trait
  (
    (transfer (uint principal <ft>) (response bool uint))
    (store (<ft> uint uint principal) (response bool uint))
    (add-collateral (<ft> uint uint principal) (response bool uint))
    (remove-collateral (<ft> uint uint principal) (response bool uint))
    (draw (<ft> uint principal) (response uint uint))
    (get-loan-coll (uint) (response { coll-type: principal, amount: uint } uint))
  )
)