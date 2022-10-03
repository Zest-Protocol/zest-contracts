(use-trait ft .sip-010-trait.sip-010-trait)


;; dummy tuple -> x-to-y-rate in BP
(define-map lp { token-x: principal, token-y: principal } uint )


;; swap token x for y if minimum of dy possible
(define-public (swap-x-for-y (x-token <ft>) (y-token <ft>) (dx uint) (min-dy (optional uint)))
  (begin
    (asserts! (is-some min-dy) ERR_INVALID_VALUES)
    (ok (unwrap-panic min-dy))
  )
)

;; get amount of x needed to get dy value of token y
(define-public (get-y-given-x  (x-token <ft>) (y-token <ft>) (dy uint))
  (begin
    (asserts! (> dy u0) ERR_INVALID_VALUES)
    (ok dy)
  )
)

(map-set lp { token-x: .xbtc, token-y: .xbtc } u10000)


(define-constant ERR_INVALID_VALUES (err u5001))