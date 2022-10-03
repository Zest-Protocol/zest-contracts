(impl-trait .asset-trait.asset-trait)

(define-fungible-token usda)
(define-data-var token-uri (string-utf8 256) u"")

(define-constant DEPLOYER tx-sender)

(define-constant ERR-UNAUTHORIZED u300)

(define-read-only (get-asset-name)
    (ok "USDA")
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply usda))
)

(define-read-only (get-name)
  (ok "USDA")
)

(define-read-only (get-symbol)
  (ok "USDA")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usda account))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (if (is-eq tx-sender DEPLOYER)
    (ok (var-set token-uri value))
    (err ERR-UNAUTHORIZED)
  )
)

(define-read-only (get-token-uri)
    (ok (some (var-get token-uri)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-UNAUTHORIZED))
    
    (match (ft-transfer? usda amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)


;; (ft-mint? usda u10000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
;; (ft-mint? usda u10000000000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
;; (ft-mint? usda u10000000000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
;; (ft-mint? usda u10000000000 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)
