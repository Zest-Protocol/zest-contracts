;; Title: ZGE000 Governance Token
;; Author: Marvin Janssen
;; Depends-On: 
;; Synopsis:
;; This extension defines the governance token of ExecutorDAO.
;; Description:
;; The governance token is a simple SIP010-compliant fungible token
;; with some added functions to make it easier to manage by
;; ExecutorDAO proposals and extensions.

(impl-trait .governance-token-trait.governance-token-trait)
(impl-trait .ft-trait.ft-trait)
(impl-trait .extension-trait.extension-trait)

(define-constant err-unauthorised (err u3000))
(define-constant err-not-token-owner (err u4))

(define-fungible-token zest)
(define-fungible-token zest-locked)

(define-data-var token-name (string-ascii 32) "Zest")
(define-data-var token-symbol (string-ascii 10) "ZEST")
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-decimals uint u8)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions

;; governance-token-trait

(define-public (edg-transfer (amount uint) (sender principal) (recipient principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-transfer? zest amount sender recipient)
	)
)

(define-public (edg-lock (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(try! (ft-burn? zest amount owner))
		(ft-mint? zest-locked amount owner)
	)
)

(define-public (edg-unlock (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(try! (ft-burn? zest-locked amount owner))
		(ft-mint? zest amount owner)
	)
)

(define-public (edg-mint (amount uint) (recipient principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-mint? zest amount recipient)
	)
)

(define-public (edg-burn (amount uint) (owner principal))
	(begin
		(try! (is-dao-or-extension))
		(ft-burn? zest amount owner)
	)
)

;; Other

(define-public (set-name (new-name (string-ascii 32)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set token-name new-name))
	)
)

(define-public (set-symbol (new-symbol (string-ascii 10)))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set token-symbol new-symbol))
	)
)

(define-public (set-decimals (new-decimals uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set token-decimals new-decimals))
	)
)

(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set token-uri new-uri))
	)
)

(define-private (edg-mint-many-iter (item {amount: uint, recipient: principal}))
	(ft-mint? zest (get amount item) (get recipient item))
)

(define-public (edg-mint-many (recipients (list 200 {amount: uint, recipient: principal})))
	(begin
		(try! (is-dao-or-extension))
		(ok (map edg-mint-many-iter recipients))
	)
)

;; --- Public functions

;; sip010-ft-trait

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
	(begin
		(asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) err-not-token-owner)
		(ft-transfer? zest amount sender recipient)
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
	(ok (+ (ft-get-balance zest who) (ft-get-balance zest-locked who)))
)

(define-read-only (get-total-supply)
	(ok (+ (ft-get-supply zest) (ft-get-supply zest-locked)))
)

(define-read-only (get-token-uri)
	(ok (var-get token-uri))
)

;; governance-token-trait

(define-read-only (edg-get-balance (who principal))
	(get-balance who)
)

(define-read-only (edg-has-percentage-balance (who principal) (factor uint))
	(ok (>= (* (unwrap-panic (get-balance who)) factor) (* (unwrap-panic (get-total-supply)) u1000)))
)

(define-read-only (edg-get-locked (owner principal))
	(ok (ft-get-balance zest-locked owner))
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
