(impl-trait .asset-trait.asset-trait)

(define-fungible-token wstx)
(define-data-var token-uri (string-utf8 256) u"")

(define-constant DEPLOYER tx-sender)

(define-constant ERR-UNAUTHORIZED u300)

(define-read-only (get-asset-name)
    (ok "wSTX")
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply wstx))
)

(define-read-only (get-name)
  (ok "wSTX")
)

(define-read-only (get-symbol)
  (ok "wSTX")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wstx account))
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
    
    (match (stx-transfer? amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)


