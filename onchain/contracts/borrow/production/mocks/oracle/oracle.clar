(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

(define-constant deployer tx-sender)

;; prices are fixed to 8 decimals
(define-read-only (get-asset-price (token <ft>))
  (match (map-get? tickers (contract-of token))
    ret (ok ret)
    ERR_NOT_FOUND
  )
)

(define-public (set-price (asset <ft>) (price uint))
  (begin
    (asserts! (is-eq tx-sender deployer) ERR_UNAUTHORIZED)
    (ok (map-set tickers (contract-of asset) price))
  )
)

(define-map tickers principal uint)

(define-constant ERR_NOT_FOUND (err u900000))
(define-constant ERR_UNAUTHORIZED (err u900001))