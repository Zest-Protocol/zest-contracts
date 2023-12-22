
(use-trait ft .ft-trait.ft-trait)

(define-read-only (get-unit-price (token principal))
  (begin
    (unwrap-panic (map-get? tickers token))
  )
)

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (token-to-usd
  (who principal)
  (asset <ft>)
  (oracle principal)
  (amount uint)
  )
  (let (
    (unit-price (get-unit-price (contract-of asset)))
  )
    (mul amount unit-price)
  )
)

(define-map tickers principal uint)

(map-set tickers .stSTX u160000000)
(map-set tickers .sBTC u4000000000000)