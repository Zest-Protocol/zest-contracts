(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

;; prices are fixed to 8 decimals
(define-read-only (get-asset-price (token <ft>))
  (match (map-get? tickers (contract-of token))
    ret (ok ret)
    (err u99999)
  )
)

(define-public (set-price (asset <ft>) (price uint))
  (ok (map-set tickers (contract-of asset) price)))

(define-map tickers principal uint)

;; (map-set tickers .stSTX u160000000)
;; (map-set tickers .sBTC u4000000000000)
;; (map-set tickers .diko u40000000)
;; (map-set tickers .USDA u99000000)
;; (map-set tickers .xUSD u100000000)