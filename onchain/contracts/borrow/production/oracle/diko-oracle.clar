(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

(define-constant deployer tx-sender)

(define-constant err-unauthorized (err u3000))
(define-constant err-above-threshold (err u3001))

;; 2USD
(define-data-var max-price uint u200000000)

(define-public (set-min-price (amount uint))
  (begin
    (asserts! (is-eq tx-sender deployer) err-unauthorized)
    (ok (var-set min-price amount))
  )
)

(define-public (set-max-price (amount uint))
  (begin
    (asserts! (is-eq tx-sender deployer) err-unauthorized)
    (ok (var-set max-price amount))
  )
)

;; prices are fixed to 8 decimals
(define-public (get-asset-price (token <ft>))
  (let (
    (oracle-data (unwrap-panic (contract-call? 'SP1G48FZ4Y7JY8G2Z0N51QTCYGBQ6F4J43J77BQC0.dia-oracle
      get-value
      "DIKO/USD"
    )))
    (last-price (get value oracle-data))
  )

    ;; sanity check
    (asserts! (< last-price (var-get max-price)) err-above-threshold)
    ;; convert to fixed precision
    (ok last-price)
  )
)

;; prices are fixed to 8 decimals
(define-read-only (get-price)
  (let (
    (oracle-data (unwrap-panic (contract-call? 'SP1G48FZ4Y7JY8G2Z0N51QTCYGBQ6F4J43J77BQC0.dia-oracle
      get-value
      "DIKO/USD"
    )))
    (last-price (get value oracle-data))
  )
    ;; sanity check
    last-price
  )
)
