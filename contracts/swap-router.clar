;; Currently only provides fake values to simulate a swapping interface with DEXes

(impl-trait .swap-router-trait.swap-router-trait)
(use-trait ft .sip-010-trait.sip-010-trait)

;; dummy tuple -> x-to-y-rate in BP
(define-map lp { token-x: principal, token-y: principal } uint)

(define-constant BP u10000)

;; x-token: xBTC
;; y-token: Zest

;; swap token x for y if minimum of dy possible
(define-public (swap-x-for-y (x-token <ft>) (y-token <ft>) (dx uint) (min-dy (optional uint)))
  (begin
    (asserts! (is-some min-dy) ERR_PANIC)
    (ok (unwrap-panic min-dy))
  )
)

;; get amount of x needed to get dy value of token y
;; xBTC -> Zest, divide by 10
;; convert xBTC to Zest
(define-public (get-x-given-y (x-token <ft>) (y-token <ft>) (dy uint))
  (let (
    (bp (unwrap! (get-pair x-token y-token) ERR_INVALID_POOL))
  )
    (asserts! (> dy u0) ERR_PANIC)
    (ok (/ (* bp dy) BP))
  )
)

;; get amount of y needed to get dx value of token x
;; Zest -> xBTC, multiply by 10
;; Convert Zest to xBTC
(define-public (get-y-given-x (x-token <ft>) (y-token <ft>) (dx uint))
  (let (
    (bp (unwrap! (get-pair y-token x-token) ERR_INVALID_POOL))
  )
    (asserts! (> dx u0) ERR_PANIC)
    (ok  (/ (* bp dx) BP))
  )
)

(define-read-only (get-pair (x-token <ft>) (y-token <ft>))
  (map-get? lp { token-x: (contract-of x-token), token-y: (contract-of y-token) })
)

(define-constant xbtc .xbtc)
(define-constant zest .zge000-governance-token)
(define-constant wrapped-bitcoin-mainnet 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin)


(map-set lp { token-x: xbtc, token-y: xbtc } BP)
(map-set lp { token-x: xbtc, token-y: zest } u1000)
(map-set lp { token-x: wrapped-bitcoin-mainnet, token-y: wrapped-bitcoin-mainnet } BP)
(map-set lp { token-x: wrapped-bitcoin-mainnet, token-y: zest } u1000)
(map-set lp { token-x: zest, token-y: xbtc } u100000)

(define-constant ERR_PANIC (err u7001))
(define-constant ERR_INVALID_POOL (err u7002))