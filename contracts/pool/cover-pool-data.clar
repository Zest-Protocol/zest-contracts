(impl-trait .ownable-trait.ownable-trait)

(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)
(define-constant IN_OTC_LIQUIDATION 0x04)

(define-map cover-pool
  uint
  {
    status: (buff 1),
    open: bool,
    capacity: uint,
    cycle-length: uint,
    min-cycles: uint,
    available: bool,
    cp-token: principal,
    cp-rewards-token: principal,
    pool-start: uint,
    cover-token: principal,
    amount-in-otc-liquidation: uint,
    cover-vault: principal })

(define-map sent-funds
  { owner: principal, token-id: uint }
  { start: uint, cycles: uint, withdrawal-signaled: uint, amount: uint })


(define-map stakers { cover-provider: principal, token-id: uint } bool)

(define-public (create-pool
  (token-id uint)
  (data {
    status: (buff 1),
    open: bool,
    capacity: uint,
    cycle-length: uint,
    min-cycles: uint,
    available: bool,
    cp-token: principal,
    cp-rewards-token: principal,
    pool-start: uint,
    cover-token: principal,
    amount-in-otc-liquidation: uint,
    cover-vault: principal
    })
  )
  (begin
    (try! (is-pool-contract))
    (asserts! (map-insert cover-pool token-id data) ERR_POOL_EXISTS)
    
    (print { type: "create-pool", payload: (merge data { token-id: token-id }) })
    (ok true)
  )
)

(define-public (set-pool
  (token-id uint)
  (data {
    status: (buff 1),
    open: bool,
    capacity: uint,
    cycle-length: uint,
    min-cycles: uint,
    available: bool,
    cp-token: principal,
    cp-rewards-token: principal,
    pool-start: uint,
    cover-token: principal,
    amount-in-otc-liquidation: uint,
    cover-vault: principal
    })
  )
  (begin
    (try! (is-pool-contract))
    (map-set cover-pool token-id data)

    (print { type: "set-pool", payload: (merge data { token-id: token-id }) })
    (ok true)
  )
)

(define-public (set-sent-funds
  (owner principal)
  (token-id uint)
  (data { start: uint, cycles: uint, withdrawal-signaled: uint, amount: uint })
  )
  (begin
    (try! (is-pool-contract))
    (map-set sent-funds { owner: owner, token-id: token-id } data)

    (print { type: "set-sent-funds", payload: (merge data { token-id: token-id, owner: owner }) })
    (ok true)
  )
)

(define-read-only (get-sent-funds-read (provider principal) (token-id uint))
  (unwrap-panic (map-get? sent-funds { owner: provider, token-id: token-id }))
)

(define-public (get-sent-funds (provider principal) (token-id uint))
  (ok (unwrap! (map-get? sent-funds { owner: provider, token-id: token-id }) ERR_INVALID_PROVIDER))
)

(define-read-only (get-sent-funds-optional  (provider principal) (token-id uint))
  (map-get? sent-funds { owner: provider, token-id: token-id })
)

(define-public (add-staker (staker principal) (token-id uint))
  (begin
		(try! (is-pool-contract))
    (print { type: "add-staker", payload: { token-id: token-id, staker: staker } })
		(ok (map-set stakers { cover-provider: staker, token-id: token-id } true))
	)
)

(define-public (remove-staker (staker principal) (token-id uint))
  (begin
		(try! (is-pool-contract))
    (print { type: "remove-staker", payload: { token-id: token-id, staker: staker } })
		(ok (map-set stakers { cover-provider: staker, token-id: token-id } false))
	)
)

(define-read-only (is-staker (caller principal) (token-id uint))
  (default-to false (map-get? stakers { cover-provider: caller, token-id: token-id }))
)

(define-public (is-pool-contract)
  (if (contract-call? .globals is-cover-pool-contract contract-caller) (ok true) ERR_UNAUTHORIZED)
)

(define-public (get-pool (token-id uint))
  (ok (unwrap! (map-get? cover-pool token-id) ERR_INVALID_TOKEN_ID))
)

(define-read-only (get-pool-read (token-id uint))
  (unwrap-panic (map-get? cover-pool token-id))
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
    (print { type: "set-contract-owner-cover-pool-data", payload: owner })
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)


;; ERROR START 21000
(define-constant ERR_UNAUTHORIZED (err u21000))
(define-constant ERR_POOL_EXISTS (err u21001))
(define-constant ERR_INVALID_TOKEN_ID (err u21002))
(define-constant ERR_INVALID_PROVIDER (err u21003))

;; (define-constant ERR_INVALID_POOL (err u21001))