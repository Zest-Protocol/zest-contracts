(use-trait ft .sip-010-trait.sip-010-trait)

(define-trait swap-router-trait
  (
    (swap-x-for-y (<ft> <ft> uint (optional uint)) (response uint uint))
    (get-x-given-y (<ft> <ft> uint) (response uint uint))
    (get-y-given-x (<ft> <ft> uint) (response uint uint))
  )
)