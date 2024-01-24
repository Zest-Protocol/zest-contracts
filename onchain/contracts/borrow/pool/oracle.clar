(impl-trait .oracle-trait.oracle-trait)
(use-trait ft .ft-trait.ft-trait)

;; prices are fixed to 8 decimals
(define-read-only (get-asset-price (token <ft>))
  (match (map-get? tickers (contract-of token))
    ret (ok ret)
    (err u99999)
  )
)

;; (define-read-only (get-price (token <ft>))
;;   (contract-call? 'SP2T5JKWWP3FYYX4YRK8GK5BG2YCNGEAEY2P2PKN0.pyth-oracle-v2
;;     read-feed-price
;;     0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17
;;     'SP2T5JKWWP3FYYX4YRK8GK5BG2YCNGEAEY2P2PKN0.pyth-store-v1
;;   )
;; )

(define-public (set-price (asset <ft>) (price uint))
  (ok (map-set tickers (contract-of asset) price)))

(define-map tickers principal uint)

;; (map-set tickers .stSTX u160000000)
;; (map-set tickers .sBTC u4000000000000)
;; (map-set tickers .diko u40000000)
;; (map-set tickers .USDA u99000000)
;; (map-set tickers .xUSD u100000000)