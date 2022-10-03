(impl-trait .sip-010-trait.sip-010-trait)

(define-fungible-token zest)
(define-data-var token-uri (string-utf8 256) u"")

(define-constant DEPLOYER tx-sender)

(define-constant ERR-UNAUTHORIZED (err u300))

(define-read-only (get-asset-name)
    (ok "zest")
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply zest))
)

(define-read-only (get-name)
  (ok "zest")
)

(define-read-only (get-symbol)
  (ok "zest")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance zest account))
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
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    
    (match (ft-transfer? zest amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

(define-public (mint (amount uint) (recipient principal))
    (begin
        ;; Check if pool can mint through DAO contract
        ;; (asserts! (contract-call? .dao get-pool-mint-permission contract-caller) ERR-UNAUTHORIZED)
        (ft-mint? zest amount recipient)
    )
)