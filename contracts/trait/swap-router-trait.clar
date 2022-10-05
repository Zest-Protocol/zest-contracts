(use-trait ft .ft-trait.ft-trait)

(define-trait swap-router-trait
  (
    (swap-x-for-y (principal <ft> <ft> uint (optional uint)) (response uint uint))
    (swap-y-for-x (principal <ft> <ft> uint (optional uint)) (response uint uint))
    (get-x-given-y (<ft> <ft> uint) (response uint uint))
    (get-y-given-x (<ft> <ft> uint) (response uint uint))
  )
)