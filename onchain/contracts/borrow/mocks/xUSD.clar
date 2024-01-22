(impl-trait .ft-trait.ft-trait)

(define-constant err-unauthorised (err u3000))
(define-constant err-not-token-owner (err u4))

(define-fungible-token xusd)

(define-data-var token-name (string-ascii 32) "xUSD")
(define-data-var token-symbol (string-ascii 10) "xUSD")
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-decimals uint u6)

;; --- Public functions

;; sip010-ft-trait

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) err-not-token-owner)
		(ft-transfer? xusd amount sender recipient)
	)
)

(define-read-only (get-name)
	(ok (var-get token-name))
)

(define-read-only (get-symbol)
	(ok (var-get token-symbol))
)

(define-read-only (get-decimals)
	(ok (var-get token-decimals))
)

(define-read-only (get-balance (who principal))
	(ok (ft-get-balance xusd who))
)

(define-read-only (get-total-supply)
	(ok (ft-get-supply xusd))
)

(define-read-only (get-token-uri)
	(ok (var-get token-uri))
)

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? xusd amount recipient)
)
