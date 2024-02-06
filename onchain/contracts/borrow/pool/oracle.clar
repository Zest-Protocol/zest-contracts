(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

;; prices are fixed to 8 decimals
(define-read-only (get-asset-price (token <ft>))
  (match (map-get? tickers (contract-of token))
    ret (ok ret)
    ERR_NOT_FOUND
  )
)

(define-public (set-price (asset <ft>) (price uint))
  (ok (map-set tickers (contract-of asset) price)))

(define-map tickers principal uint)

(define-constant ERR_NOT_FOUND (err u900000))