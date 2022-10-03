(impl-trait .ownable-trait.ownable-trait)
(impl-trait .vault-trait.vault-trait)

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

(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
    (begin
        (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
        (as-contract (contract-call? ft transfer amount tx-sender recipient none))
    )
)

(define-constant ERR_UNAUTHORIZED (err u300))
