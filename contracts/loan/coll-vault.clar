(use-trait ft .ft-trait.ft-trait)
(impl-trait .ownable-trait.ownable-trait)
(impl-trait .coll-vault-trait.coll-vault-trait)

(define-constant ACTIVE 0x00)
(define-constant INACTIVE 0x01)

(define-map loan-coll uint { coll-type: principal, amount: uint})

(define-public (get-loan-coll (loan-id uint))
  (ok (unwrap! (map-get? loan-coll loan-id) ERR_INVALID_LOAN_ID))
)

;; --- approved

(define-map approved-contracts principal bool)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; stores collateral into the contract
;;
;; @restricted loan-contract
;; @returns true
;;
;; @param coll-type: new loan contract
;; @param amount: amount of collateral stored
;; @param loan-id: loan associated to the amount of collateral
(define-public (store (coll-type <ft>) (amount uint) (loan-id uint) (sender principal))
  (let (
    (data { coll-type: (contract-of coll-type), amount: amount })
  )
    (try! (is-approved-contract contract-caller))
    (asserts! (is-none (map-get? loan-coll loan-id)) ERR_MUST_ADD_COLLATERAL)
    (try! (contract-call? coll-type transfer amount sender (as-contract tx-sender) none))
    (map-insert loan-coll loan-id data)

    (print { type: "store-coll-vault", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)

;; add collateral for a loan that is already initiated
;;
;; @restricted loan-contract
;; @returns true
;;
;; @param coll-type: new loan contract
;; @param amount: amount of collateral stored
;; @param loan-id: loan associated to the amount of collateral
(define-public (add-collateral (coll-type <ft>) (amount uint) (loan-id uint) (sender principal))
  (let (
    (coll (unwrap! (map-get? loan-coll loan-id) ERR_INVALID_LOAN_ID))
    (data { coll-type: (contract-of coll-type), amount: (+ (get amount coll) amount) })
  )
    (try! (is-approved-contract contract-caller))
    (try! (contract-call? coll-type transfer amount sender (as-contract tx-sender) none))
    (map-set loan-coll loan-id { coll-type: (contract-of coll-type), amount: (+ (get amount coll) amount) })

    (print { type: "add-collateral-coll-vault", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)


;; add collateral for a loan that is already initiated
;;
;; @restricted loan-contract
;; @returns true
;;
;; @param coll-type: new loan contract
;; @param amount: amount of collateral stored
;; @param loan-id: loan associated to the amount of collateral
(define-public (remove-collateral (coll-type <ft>) (amount uint) (loan-id uint) (recipient principal))
  (let (
    (coll (unwrap! (map-get? loan-coll loan-id) ERR_INVALID_LOAN_ID))
    (data { coll-type: (contract-of coll-type), amount: (- (get amount coll) amount) })
  )
    (try! (is-approved-contract contract-caller))
    (try! (as-contract (contract-call? coll-type transfer amount tx-sender recipient none)))
    (map-set loan-coll loan-id { coll-type: (contract-of coll-type), amount: (- (get amount coll) amount) })

    (print { type: "remove-collateral-coll-vault", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)

;; empties the amount of collateral stored for a loan
;;
;; @restricted loan-contract
;; @returns true
;;
;; @param coll-type: new loan contract
;; @param loan-id: loan associated to the amount of collateral
;; @param recipient: recipient of the collateral
(define-public (draw (coll-type <ft>) (loan-id uint) (recipient principal))
  (let (
    (coll (unwrap! (map-get? loan-coll loan-id) ERR_INVALID_LOAN_ID))
    (sender (as-contract tx-sender))
  )
    (try! (is-approved-contract contract-caller))
    ;; empty collateral from Loan
    (try! (as-contract (contract-call? coll-type transfer (get amount coll) sender recipient none)))
    (map-delete loan-coll loan-id)

    (print { type: "coll-vault-delete", payload: { loan-id: loan-id } })
    (ok (get amount coll))
  )
)

;; transfers funds from the collateral vault to recipient
;;
;; @restricted loan-contract
;; @returns true
;;
;; @param amount: amount of collateral
;; @param recipient: recipient of the collateral
;; @param ft: SIP-010 token contract
(define-public (transfer (amount uint) (recipient principal) (ft <ft>))
  (begin
    (try! (is-approved-contract contract-caller))
    (print { type: "transfer-coll-vault", payload: { amount: amount, recipient: recipient, asset: ft } })
    (as-contract (contract-call? ft transfer amount tx-sender recipient none))
  )
)

;; --- ownable trait

;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)
(define-data-var late-fee uint u10) ;; late fee in Basis Points

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-coll-vault", payload: owner })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)


(map-set approved-contracts .loan-v1-0 true)

;; ERROR START 2000
(define-constant ERR_UNAUTHORIZED (err u2000))
(define-constant ERR_INVALID_LOAN_ID (err u2001))
(define-constant ERR_MUST_ADD_COLLATERAL (err u2002))

