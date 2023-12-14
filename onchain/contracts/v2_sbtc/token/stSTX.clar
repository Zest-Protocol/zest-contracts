(impl-trait .ft-trait.ft-trait)

(define-constant err-unauthorised (err u3000))
(define-constant err-not-token-owner (err u4))

(define-fungible-token stSTX)

(define-data-var token-name (string-ascii 32) "stSTX")
(define-data-var token-symbol (string-ascii 10) "stSTX")
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-decimals uint u8)

;; --- Public functions

;; sip010-ft-trait

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) err-not-token-owner)
		(ft-transfer? stSTX amount sender recipient)
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
	(ok (ft-get-balance stSTX who))
)

(define-read-only (get-total-supply)
	(ok (ft-get-supply stSTX))
)

(define-read-only (get-token-uri)
	(ok (var-get token-uri))
)

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? stSTX amount recipient)
)
