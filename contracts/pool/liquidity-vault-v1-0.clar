(impl-trait .ownable-trait.ownable-trait)
(impl-trait .liquidity-vault-trait.liquidity-vault-trait)

(use-trait ft .sip-010-trait.sip-010-trait)

(define-data-var contract-owner principal tx-sender)


;; -- ownable-trait --
(define-public (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

(define-public (fund-loan (amount uint) (recipient principal) (ft <ft>))
  (begin
    (try! (is-approved-contract contract-caller))
    (contract-call? ft transfer amount tx-sender recipient none)
  )
)

(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
    (begin
      (try! (is-approved-contract contract-caller))
      (as-contract (contract-call? ft transfer amount tx-sender recipient none))
    )
)

;; --- approved

(define-map approved-contracts principal bool)

(define-public (add-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public (remove-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract false))
	)
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)


(define-constant ERR_UNAUTHORIZED (err u300))
