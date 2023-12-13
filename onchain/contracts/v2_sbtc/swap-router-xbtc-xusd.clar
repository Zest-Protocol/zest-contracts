;; Currently only provides fake values to simulate a swapping interface with DEXes

(impl-trait .swap-router-trait.swap-router-trait)
(use-trait ft .ft-trait.ft-trait)

;; dummy tuple -> x-to-y-rate in BP

;; x-token: xBTC
;; y-token: Zest

;; swap token x for y if minimum of dy possible
(define-public (swap-x-for-y (recipient principal) (x-token <ft>) (y-token <ft>) (dx uint) (min-dy (optional uint)))
  (contract-call? 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.swap-helper-v1-03 swap-helper x-token y-token dx min-dy)
)

;; swap token x for y if minimum of dy possible
(define-public (swap-y-for-x (recipient principal) (x-token <ft>) (y-token <ft>) (dy uint) (min-dx (optional uint)))
  (contract-call? 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.swap-helper-v1-03 swap-helper y-token x-token dy min-dx)
)

;; get amount of x needed to get dy value of token y
;; xBTC -> Zest, divide by 10
;; convert xBTC to Zest
(define-public (get-x-given-y (x-token <ft>) (y-token <ft>) (dy uint))
  (let (
    (result (try! (contract-call? 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.swap-helper-v1-03 get-given-helper x-token y-token dy)))
  )
    (asserts! (and (is-eq (contract-of x-token) wbtc) (is-eq (contract-of y-token) wxusd)) ERR_INVALID_POOL)
    (asserts! (> result u0) ERR_PANIC)
    (ok result)
  )
)

;; get amount of y needed to get dx value of token x
;; Zest -> xBTC, multiply by 10
;; Convert Zest to xBTC
(define-public (get-y-given-x (x-token <ft>) (y-token <ft>) (dx uint))
  (let (
    (result (try! (contract-call? 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.swap-helper-v1-03 get-helper x-token y-token dx)))
  )
    (asserts! (and (is-eq (contract-of x-token) wbtc) (is-eq (contract-of y-token) wxusd)) ERR_INVALID_POOL)
    (asserts! (> result u0) ERR_PANIC)
    (ok result)
  )
)
(define-constant wrapped-usd 'SP2TZK01NKDC89J6TA56SA47SDF7RTHYEQ79AAB9A.Wrapped-USD)
(define-constant wrapped-bitcoin 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin)

(define-constant xusd 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-wxusd)
(define-constant wbtc 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-wbtc)

;; ERROR START 20000
(define-constant ERR_PANIC (err u20000))
(define-constant ERR_INVALID_POOL (err u20001))
