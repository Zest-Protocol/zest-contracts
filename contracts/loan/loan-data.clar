(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait swap .swap-router-trait.swap-router-trait)

(define-constant INIT 0x00)
(define-constant FUNDED 0x01)
(define-constant AWAITING_DRAWDOWN 0x02)
(define-constant ACTIVE 0x03)
(define-constant INACTIVE 0x04)
(define-constant MATURED 0x05)
(define-constant LIQUIDATED 0x06)
(define-constant EXPIRED 0x07)

(define-constant REQUESTED 0x00)
(define-constant ACCEPTED 0x01)
(define-constant READY 0x02)
(define-constant COMPLETED 0x03)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))

(define-map loan uint
  {
    status: (buff 1),
    borrower: principal,
    loan-amount: uint,
    coll-ratio: uint, ;; ratio in BP
    coll-token: principal,
    next-payment: uint,
    apr: uint, ;; apr in basis points, 1 BP = 1 / 10_000
    payment-period: uint,
    remaining-payments: uint,
    coll-vault: principal,
    funding-vault: principal,
    created: uint,  ;; time in blocks (10 minutes)
    asset: principal })

(define-data-var last-loan-id uint u0)

(define-map rollover-progress uint
  {
    status: (buff 1),
    apr: uint,
    new-amount: uint,
    maturity-length: uint,
    payment-period: uint,
    coll-ratio: uint,
    coll-type: principal,
    created-at: uint,
    moved-collateral: int,
    sent-funds: int,
    residual: uint })

(define-public (create-loan
  (loan-id uint)
  (data {
  status: (buff 1),
  borrower: principal,
  loan-amount: uint,
  coll-ratio: uint, ;; ratio in BP
  coll-token: principal,
  next-payment: uint,
  apr: uint, ;; apr in basis points, 1 BP = 1 / 10_000
  payment-period: uint,
  remaining-payments: uint,
  coll-vault: principal,
  funding-vault: principal,
  created: uint,
  asset: principal })
  )
  (begin
    (try! (is-loan-contract))
    (asserts! (map-insert loan loan-id data) ERR_LOAN_ALREADY_EXISTS)

    (print { type: "create-loan", payload: (merge data { loan-id: loan-id }) })
    (ok loan-id)
  )
)

(define-public (set-loan
  (loan-id uint)
  (data {
  status: (buff 1),
  borrower: principal,
  loan-amount: uint,
  coll-ratio: uint, ;; ratio in BP
  coll-token: principal,
  next-payment: uint,
  apr: uint, ;; apr in basis points, 1 BP = 1 / 10_000
  payment-period: uint,
  remaining-payments: uint,
  coll-vault: principal,
  funding-vault: principal,
  created: uint,
  asset: principal })  
)
  (begin
    (try! (is-loan-contract))
    (map-set loan loan-id data)

    (print { type: "set-loan", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)

(define-public (create-rollover-progress
  (loan-id uint)
  (data {
    status: (buff 1),
    apr: uint,
    new-amount: uint,
    maturity-length: uint,
    payment-period: uint,
    coll-ratio: uint,
    coll-type: principal,
    created-at: uint,
    moved-collateral: int,
    sent-funds: int,
    residual: uint
    })
)
  (begin
    (try! (is-loan-contract))
    (asserts! (map-insert rollover-progress loan-id data) ERR_ROLLOVER_PROGRESS_ALREADY_EXISTS)

    (print { type: "create-rollover-progress", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)

(define-public (set-rollover-progress
  (loan-id uint)
  (data {
    status: (buff 1),
    apr: uint,
    new-amount: uint,
    maturity-length: uint,
    payment-period: uint,
    coll-ratio: uint,
    coll-type: principal,
    created-at: uint,
    moved-collateral: int,
    sent-funds: int,
    residual: uint })
)
  (begin
    (try! (is-loan-contract))
    (map-set rollover-progress loan-id data)


    (print { type: "set-rollover-progress", payload: (merge data { loan-id: loan-id }) })
    (ok true)
  )
)

(define-public (delete-rollover-progress (loan-id uint))
  (begin
    (try! (is-loan-contract))
    (print { type: "delete-rollover-progress", payload: { loan-id: loan-id } })
    (ok (map-delete rollover-progress loan-id))
  )
)

(define-public (set-last-loan-id (loan-id uint))
  (begin
    (try! (is-loan-contract))
    (print { type: "set-last-loan-id", payload: { loan-id: loan-id } })
    (ok (var-set last-loan-id loan-id))
  )
)

;; -- getters

(define-read-only (get-last-loan-id)
  (var-get last-loan-id)
)

(define-public (get-loan (loan-id uint))
  (ok (unwrap! (map-get? loan loan-id) ERR_INVALID_LOAN_ID))
)

(define-read-only (get-loan-read (loan-id uint))
  (unwrap-panic (map-get? loan loan-id))
)

(define-read-only (get-loan-optional (loan-id uint))
  (map-get? loan loan-id)
)

(define-public (get-rollover-progress (loan-id uint))
  (ok (unwrap! (map-get? rollover-progress loan-id) ERR_INVALID_LOAN_ID))
)

(define-read-only (get-rollover-progress-read (loan-id uint))
  (unwrap-panic (map-get? rollover-progress loan-id))
)

(define-read-only (get-rollover-progress-optional (loan-id uint))
  (map-get? rollover-progress loan-id)
)

(define-public (is-loan-contract)
  (let (
    (is-loan (contract-call? .globals is-loan-contract contract-caller))
  )
    (if is-loan (ok true) ERR_UNAUTHORIZED)
  )
)

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-loan-data", payload: owner })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)


;; ERROR START 21000
(define-constant ERR_UNAUTHORIZED (err u21000))
(define-constant ERR_LOAN_ALREADY_EXISTS (err u21001))
(define-constant ERR_INVALID_LOAN_ID (err u21002))
(define-constant ERR_ROLLOVER_PROGRESS_ALREADY_EXISTS (err u21003))
