(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

(define-data-var last-pool-id uint u0)

(define-map delegates principal uint)
(define-map pool-delegate uint principal)

(define-map pool-data
  uint
  {
    pool-delegate: principal,
    lp-token: principal,
    zp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    cover-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    status: (buff 1),
    open: bool ;; open to the public
  }
)

;; liquidity-provider -> funds-sent data
(define-map funds-sent
  { owner: principal, token-id: uint }
  {
    factor: uint,
    cycle-sent: uint,
    sent-at-btc: uint,
    sent-at-stx: uint,
    withdrawal-signaled: uint,
    last-claim-at: uint,
    amount: uint
  }
)

;; loan-id -> token-id
(define-map loans-pool uint uint)

(define-map governors { governor: principal, token-id: uint } bool)

(define-public (set-loan-to-pool (loan-id uint) (pool-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "set-loan-to-pool", payload: { pool-id: pool-id, loan-id: loan-id } })
    (ok (map-set loans-pool loan-id pool-id))
  )
)

(define-public (get-loan-pool-id (loan-id uint))
  (ok (unwrap! (map-get? loans-pool loan-id) ERR_LOAN_DOES_NOT_EXIST))
)

(define-public (is-pool-governor  (governor principal) (token-id uint))
  (ok (map-get? governors { governor: governor, token-id: token-id }))
)

(define-read-only (is-pool-governor-read (governor principal) (token-id uint))
  (map-get? governors { governor: governor, token-id: token-id })
)

(define-read-only (get-loan-pool-id-read (loan-id uint))
  (unwrap-panic (map-get? loans-pool loan-id))
)

(define-read-only (get-token-id-by-delegate (delegate principal))
  (map-get? delegates delegate)
)

(define-read-only (get-delegate-by-token-id (token-id uint))
  (map-get? pool-delegate token-id)
)

(define-public (set-pool-delegate (delegate principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (map-set pool-delegate token-id delegate)
    (print { type: "set-pool-delegate", payloan: { token-id: token-id, delegate: delegate } })
    (ok (map-set delegates delegate token-id))
  )
)

(define-public (create-pool
  (token-id uint)
  (data {
    pool-delegate: principal,
    lp-token: principal,
    zp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    cover-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    status: (buff 1),
    open: bool ;; open to the public
  })
  )
  (begin
    (try! (is-pool-contract))
    (asserts! (map-insert pool-data token-id data) ERR_POOL_ALREADY_EXISTS)

    (print { type: "create-liquidity-pool", payload: data })
    (ok true)
  )
)

;; -- pool setters

(define-read-only (get-last-pool-id)
  (var-get last-pool-id)
)

(define-public (get-pool (token-id uint))
  (ok (unwrap! (map-get? pool-data token-id) ERR_INVALID_TOKEN_ID))
)

(define-read-only (get-pool-read (token-id uint))
  (unwrap-panic (map-get? pool-data token-id))
)

(define-public (get-funds-sent (owner principal) (token-id uint))
  (ok (unwrap! (map-get? funds-sent { owner: owner, token-id: token-id }) ERR_INVALID_SENDER))
)

(define-read-only (get-funds-sent-read (owner principal) (token-id uint))
  (unwrap-panic (map-get? funds-sent { owner: owner, token-id: token-id }))
)

;; -- pool setters

(define-public (set-pool
  (token-id uint)
  (data {
    pool-delegate: principal,
    lp-token: principal,
    zp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    cover-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    status: (buff 1),
    open: bool ;; open to the public
  })
  )
  (begin
    (try! (is-pool-contract))
    (map-set pool-data token-id data)

    (print { type: "set-liquidity-pool", payload: data })
    (ok true)
  )
)

(define-public (set-funds-sent
  (owner principal)
  (token-id uint)
  (data {
    factor: uint,
    cycle-sent: uint,
    sent-at-btc: uint,
    sent-at-stx: uint,
    withdrawal-signaled: uint,
    last-claim-at: uint,
    amount: uint
  })
  )
  (begin
    (try! (is-pool-contract))
    (map-set funds-sent { owner: owner, token-id: token-id } data)

    (print { event: "set-funds-sent", payload: data })
    (ok true)
  )
)

(define-public (set-last-pool-id (id uint))
  (begin
    (try! (is-pool-contract))
    (print { event: "set-last-pool-id", payload: { last-pool-id: id } })
    (ok (var-set last-pool-id id)))
)

(define-read-only (get-pool-governor (governor principal) (token-id uint))
  (map-get? governors { governor: governor, token-id: token-id })
)

(define-public (add-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { event: "add-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-set governors { governor: governor, token-id: token-id } true))
  )
)

(define-public (remove-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { event: "remove-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-delete governors { governor: governor, token-id: token-id }))
  )
)

(define-public (is-pool-contract)
  (if (contract-call? .globals is-pool-contract contract-caller) (ok true) ERR_UNAUTHORIZED)
)


;; -- onboarding liquidity-provider

(define-map liquidity-providers { token-id: uint, lp: principal} bool)

(define-public (add-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
    (try! (is-pool-contract))
    (print { event: "add-liquidity-provider", payload: { liquidity-provider: liquidity-provider, token-id: token-id } })
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } true))
	)
)

(define-public (remove-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
    (try! (is-pool-contract))
    (print { event: "remove-liquidity-provider", payload: { liquidity-provider: liquidity-provider, token-id: token-id } })
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } false))
	)
)

(define-read-only (is-liquidity-provider (token-id uint) (liquidity-provider principal))
  (default-to false (map-get? liquidity-providers { token-id: token-id, lp: liquidity-provider }))
)

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)
;; TO BE .executor-dao
;; (define-data-var contract-owner principal .executor-dao)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-data", payload: owner })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)


;; ERROR START 130000
(define-constant ERR_UNAUTHORIZED (err u130000))
(define-constant ERR_POOL_ALREADY_EXISTS (err u130001))
(define-constant ERR_INVALID_TOKEN_ID (err u130002))
(define-constant ERR_INVALID_SENDER (err u130003))
(define-constant ERR_LOAN_DOES_NOT_EXIST (err u130004))
