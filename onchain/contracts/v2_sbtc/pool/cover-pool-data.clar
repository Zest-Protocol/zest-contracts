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

;; -- pool
(define-map cover-pool
  uint {
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

;; @desc creates cover pool
;; @restricted cover-pool
;; @param token-id: id of the pool to be created
;; @param data:
;;  status: INIT | READY | CLOSED | DEFAULT | IN_OTC_LIQUIDATION,
;;  open: open to public,
;;  capacity: maximum amount of cover,
;;  cycle-length: length of a cycle in blocks,
;;  min-cycles: minimum commitment cycles,
;;  available: is the pool active for sending funds,
;;  cp-token: cover pool token to account for zest rewards,
;;  cp-rewards-token: cover pool token to account for xbtc rewards,
;;  pool-start: Stacks block height of first cycle,
;;  cover-token: asset used as cover,
;;  amount-in-otc-liquidation: in case of otc liquiditaion, amount that was sent out,
;;  cover-vault: principal of collateral vault
;; @returns (response uint uint)
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
    cover-vault: principal }))
  (begin
    (try! (is-pool-contract))
    (asserts! (map-insert cover-pool token-id data) ERR_POOL_EXISTS)
    
    (print { type: "create-cover-pool", payload: { key: token-id, data: data } })
    (ok true)))

;; @desc updates pool values
;; @restricted cover-pool
;; @param token-id: pool id of the pool being updated
;; @param data
;; @returns (response true uint)
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
    cover-vault: principal }))
  (begin
    (try! (is-pool-contract))
    (map-set cover-pool token-id data)

    (print { type: "set-cover-pool", payload: { key: token-id, data: data } })
    (ok true)))

;; -- sent-funds
(define-map sent-funds
  { owner: principal, token-id: uint }
  { start: uint, cycles: uint, withdrawal-signaled: uint, amount: uint })

;; @desc sets the state of the commitment sent by a user to control for funds sent and withdrawals
;; @restricted cover-pool
;; @param owner: user whose commitment is being updated
;; @param token-id: id of the pool related
;; @param data:
;;  start: cycle # at which funds were sent,
;;  cycles: number of cycles committed,
;;  withdrawal-signaled: Stacks block height at which withdrawal is signaled,
;;  amount: amount of funds signaled for withdrawal
;; @returns (response uint uint)
(define-public (set-sent-funds
  (owner principal)
  (token-id uint)
  (data { start: uint, cycles: uint, withdrawal-signaled: uint, amount: uint }))
  (begin
    (try! (is-pool-contract))
    (map-set sent-funds { owner: owner, token-id: token-id } data)

    (print { type: "set-sent-funds", payload: { key: { token-id: token-id, owner: owner }, data: data } })
    (ok true)))

;; -- cover pool providers
(define-map cover-providers { cover-provider: principal, token-id: uint } bool)

;; @desc add cover pool provider to the set of allowed providers in case that the pool is closed
;; @restricted cover-pool
;; @param cover-provider: principal being added to map
;; @param token-id: id of the pool related
;; @returns (response uint uint)
(define-public (add-staker (cover-provider principal) (token-id uint))
  (begin
		(try! (is-pool-contract))
    (print { type: "add-cover-provider", payload: { token-id: token-id, cover-provider: cover-provider } })
		(ok (map-set cover-providers { cover-provider: cover-provider, token-id: token-id } true))))

;; @desc remove cover pool provider to the set of allowed providers in case that the pool is closed
;; @restricted cover-pool
;; @param cover-provider: principal being added to map
;; @param token-id: id of the pool related
;; @returns (response uint uint)
(define-public (remove-staker (cover-provider principal) (token-id uint))
  (begin
		(try! (is-pool-contract))
    (print { type: "remove-cover-provider", payload: { token-id: token-id, cover-provider: cover-provider } })
		(ok (map-set cover-providers { cover-provider: cover-provider, token-id: token-id } false))))

;; sent-funds getter
(define-read-only (get-sent-funds-read (provider principal) (token-id uint))
  (unwrap-panic (map-get? sent-funds { owner: provider, token-id: token-id })))

(define-public (get-sent-funds (provider principal) (token-id uint))
  (ok (unwrap! (map-get? sent-funds { owner: provider, token-id: token-id }) ERR_INVALID_PROVIDER)))

(define-read-only (get-sent-funds-optional  (provider principal) (token-id uint))
  (map-get? sent-funds { owner: provider, token-id: token-id }))

(define-read-only (is-staker (caller principal) (token-id uint))
  (default-to false (map-get? cover-providers { cover-provider: caller, token-id: token-id })))

;; pool getters
(define-public (get-pool (token-id uint))
  (ok (unwrap! (map-get? cover-pool token-id) ERR_INVALID_TOKEN_ID)))

(define-read-only (get-pool-read (token-id uint))
  (unwrap-panic (map-get? cover-pool token-id)))

(define-public (is-pool-contract)
  (if (contract-call? .globals is-cover-pool-contract contract-caller)
    (ok true)
    ERR_UNAUTHORIZED))

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-cover-pool-data", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

;; ERROR START 21000
(define-constant ERR_UNAUTHORIZED (err u21000))
(define-constant ERR_POOL_EXISTS (err u21001))
(define-constant ERR_INVALID_TOKEN_ID (err u21002))
(define-constant ERR_INVALID_PROVIDER (err u21003))