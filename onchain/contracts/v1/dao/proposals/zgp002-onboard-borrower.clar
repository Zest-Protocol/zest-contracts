(impl-trait .extension-trait.extension-trait)

(define-constant err-unauthorised (err u3000))
(define-constant err-not-a-borrower (err u3001))

;; --- Authorisation check

(define-map borrowers principal bool)

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)


(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
