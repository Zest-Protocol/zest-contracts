(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

;; prices are fixed to 8 decimals
(define-read-only (get-asset-price (token <ft>))
  (ok (var-get price))
)

(define-data-var price uint u100000000)

;; (var-set price u100000000)

(define-constant ERR_NOT_FOUND (err u900000))