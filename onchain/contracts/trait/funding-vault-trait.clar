(use-trait ft .ft-trait.ft-trait)


(define-trait funding-vault-trait
  (
    (transfer (uint principal <ft>) (response bool uint))
    (add-asset (<ft> uint uint principal) (response uint uint))
    (remove-asset (<ft> uint uint principal) (response uint uint))
    (draw (<ft> uint principal) (response uint uint))
    (get-asset (uint) (response uint uint))
  )
)