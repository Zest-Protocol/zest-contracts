(use-trait ft .sip-010-trait.sip-010-trait)
(impl-trait .ownable-trait.ownable-trait)
(impl-trait .coll-vault-trait.coll-vault-trait)

(define-constant ACTIVE 0x00)
(define-constant INACTIVE 0x01)

(define-map loan-coll uint { coll-type: principal, amount: uint})

(define-read-only (is-loan)
    (is-eq contract-caller .loan-v1-0)
)

(define-data-var loan-contract principal tx-sender)

(define-public (set-loan-contract (loan principal))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set loan-contract loan))
  )
)

(define-read-only (get-loan-contract)
  (var-get loan-contract)
)

(define-public (get-loan-coll (loan-id uint))
  (ok (unwrap! (map-get? loan-coll loan-id) ERR_INVALID_VALUES))
)

(define-public (store (coll-type <ft>) (amount uint) (loan-id uint))
    (begin
        (asserts! (is-loan) ERR_UNAUTHORIZED)
        (try! (contract-call? coll-type transfer amount tx-sender (as-contract tx-sender) none))
        (map-insert loan-coll loan-id { coll-type: (contract-of coll-type), amount: amount })
        (ok true)
    )
)

(define-public (add-collateral (coll-type <ft>) (amount uint) (loan-id uint))
  (let (
    (coll (unwrap! (map-get? loan-coll loan-id) ERR_LOAN_DOES_NOT_EXIST))
  )
    (asserts! (is-loan) ERR_UNAUTHORIZED)
    (try! (contract-call? coll-type transfer amount tx-sender (as-contract tx-sender) none))
    (map-set loan-coll loan-id { coll-type: (contract-of coll-type), amount: (+ (get amount coll) amount) })
    (ok true)
  )
)

(define-public (draw (coll-type <ft>) (loan-id uint) (recipient principal))
    (let (
        (coll (unwrap! (map-get? loan-coll loan-id) ERR_LOAN_DOES_NOT_EXIST))
        (sender (as-contract tx-sender))
    )
        (asserts! (is-loan) ERR_UNAUTHORIZED)
        ;; empty collateral from Loan
        (try! (as-contract (contract-call? coll-type transfer (get amount coll) sender recipient none)))
        (map-set loan-coll loan-id { coll-type: (contract-of coll-type), amount: u0 })
        (ok (get amount coll))
    )
)

(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
    (begin
      (asserts! (is-loan) ERR_UNAUTHORIZED)
      (as-contract (contract-call? ft transfer amount tx-sender recipient none))
    )
)

;; --- ownable trait

(define-data-var contract-owner principal tx-sender)
(define-data-var late-fee uint u10) ;; late fee in Basis Points

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_LOAN_DOES_NOT_EXIST (err u304))
(define-constant ERR_INVALID_VALUES (err u5001))