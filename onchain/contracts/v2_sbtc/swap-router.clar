;; Currently only provides fake values to simulate a swapping interface with DEXes

(impl-trait .swap-router-trait.swap-router-trait)
(use-trait ft .ft-trait.ft-trait)

;; dummy tuple -> x-to-y-rate in BP
(define-map lp { token-x: principal, token-y: principal } uint)

;; x-token: xBTC
;; y-token: Zest

;; swap token x for y if minimum of dy possible
(define-public (swap-x-for-y (recipient principal) (x-token <ft>) (y-token <ft>) (dx uint) (min-dy (optional uint)))
  (let (
    (dy (unwrap-panic min-dy))
  )
    (as-contract (try! (contract-call? y-token transfer dy tx-sender recipient none)))
    (ok dy)
  )
)

;; swap token x for y if minimum of dy possible
(define-public (swap-y-for-x (recipient principal) (x-token <ft>) (y-token <ft>) (dy uint) (min-dx (optional uint)))
  (let (
    (dx (unwrap-panic min-dx))
  )
    (as-contract (try! (contract-call? y-token transfer dx tx-sender recipient none)))
    (ok dx)
  )
)

(define-constant PRECISION u100000000)

;; get amount of x needed to get dy value of token y
;; xBTC -> Zest, divide by 10
;; convert xBTC to Zest
(define-public (get-x-given-y (x-token <ft>) (y-token <ft>) (dy uint))
  (let (
    (bp (unwrap! (get-pair y-token x-token) ERR_INVALID_POOL))
  )
    (asserts! (> dy u0) ERR_PANIC)
    (ok (/ (* bp dy) PRECISION))
  )
)

;; get amount of y needed to get dx value of token x
;; Zest -> xBTC, multiply by 10
;; Convert Zest to xBTC
(define-public (get-y-given-x (x-token <ft>) (y-token <ft>) (dx uint))
  (let (
    (bp (unwrap! (get-pair x-token y-token) ERR_INVALID_POOL))
  )
    (asserts! (> dx u0) ERR_PANIC)
    (ok  (/ (* bp dx) PRECISION))
  )
)

(define-read-only (get-pair (x-token <ft>) (y-token <ft>))
  (map-get? lp { token-x: (contract-of x-token), token-y: (contract-of y-token) })
)

(define-read-only (get-relative-value-bp (x-token <ft>) (y-token <ft>))
  (unwrap-panic (map-get? lp { token-x: (contract-of x-token), token-y: (contract-of y-token) }))
)

(define-public (set-pair-value (x-token <ft>) (y-token <ft>) (new-val uint))
  (ok (map-set lp { token-x: (contract-of x-token), token-y: (contract-of y-token) } new-val))
)

(map-set lp { token-x: xbtc, token-y: xbtc } PRECISION)
(map-set lp { token-x: xbtc, token-y: governance-token } u1000000000)
(map-set lp { token-x: Wrapped-Bitcoin, token-y: Wrapped-Bitcoin } PRECISION)
(map-set lp { token-x: Wrapped-Bitcoin, token-y: Wrapped-USD } u1972690000000)
(map-set lp { token-x: sBTC, token-y: governance-token } u1000000000)

(map-set lp { token-x: Wrapped-Bitcoin, token-y: governance-token } u1000000000)

(map-set lp { token-x: Wrapped-USD, token-y: Wrapped-USD } PRECISION)
(map-set lp { token-x: Wrapped-USD, token-y: Wrapped-Bitcoin } u5060)

(map-set lp { token-x: Wrapped-Bitcoin-mainnet, token-y: Wrapped-Bitcoin-mainnet } PRECISION)
(map-set lp { token-x: Wrapped-Bitcoin-mainnet, token-y: governance-token } u100000000)
(map-set lp { token-x: Wrapped-Bitcoin-mainnet, token-y: usda-token } u100000000)

(map-set lp { token-x: governance-token, token-y: xbtc } u100000000)
(map-set lp { token-x: governance-token, token-y: Wrapped-Bitcoin } u100000000)

(map-set lp { token-x: usda-token, token-y: Wrapped-Bitcoin-mainnet } u100000000)



(define-constant xbtc .xbtc)
(define-constant Wrapped-Bitcoin .Wrapped-Bitcoin)
(define-constant sBTC .sBTC)
(define-constant governance-token .zge000-governance-token)

(define-constant Wrapped-Bitcoin-mainnet 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin)

(define-constant Wrapped-USD .Wrapped-USD)
(define-constant usda-token .usda-token)

;; ERROR START 20000
(define-constant ERR_PANIC (err u20000))
(define-constant ERR_INVALID_POOL (err u20001))
