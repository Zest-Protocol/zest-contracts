
(use-trait ft .ft-trait.ft-trait)

(define-public (get-asset-price (token <ft>))
  (begin
    (asserts! true (err u1))
    (ok (unwrap-panic (map-get? tickers (contract-of token))))
  )
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-public (token-to-usd
  (who principal)
  (asset <ft>)
  (oracle principal)
  (amount uint)
  )
  (let (
    (unit-price (try! (get-asset-price asset)))
  )
    (ok (mul amount unit-price))
  )
)

;; read-versions

(define-read-only (get-asset-price-read (token <ft>))
  (begin
    (unwrap-panic (map-get? tickers (contract-of token)))
  )
)

(define-read-only (token-to-usd-read
  (who principal)
  (asset <ft>)
  (oracle principal)
  (amount uint)
  )
  (let (
    (unit-price (get-asset-price-read asset))
  )
    (ok (mul amount unit-price))
  )
)

(define-map tickers principal uint)

(map-set tickers .stSTX u160000000)
(map-set tickers .sBTC u4000000000000)
(map-set tickers .diko u4000000)
(map-set tickers .USDA u9900000)
(map-set tickers .xUSD u10000000)