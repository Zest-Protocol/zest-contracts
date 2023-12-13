(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
;; (use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
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

;; -- pool governor
(define-map governors { governor: principal, token-id: uint } bool)

;; @desc adding pool governor
;; @restricted pool
;; @param governor: principal of the governor
;; @param token-id: pool id of the associated governor
;; @returns (response true uint)
(define-public (add-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "add-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-set governors { governor: governor, token-id: token-id } true))))

;; @desc removing pool governor
;; @restricted pool
;; @param governor: principal of the governor
;; @param token-id: pool id of the associated governor
;; @returns (response true uint)
(define-public (remove-pool-governor (governor principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "remove-pool-governor", payload: { governor: governor, token-id: token-id } })
    (ok (map-delete governors { governor: governor, token-id: token-id }))))

;; -- pool-delegates
;; principal -> token-id
(define-map delegates principal uint)
;; token-id -> principal
(define-map pool-delegate uint principal)

;; @desc adding pool delegate
;; @restricted pool
;; @param delegate: principal of the delegate
;; @param token-id: pool id of the associated delegate
;; @returns (response true uint)
(define-public (set-pool-delegate (delegate principal) (token-id uint))
  (begin
    (try! (is-pool-contract))
    (map-set pool-delegate token-id delegate)
    (print { type: "set-pool-delegate", payload: { token-id: token-id, delegate: delegate } })
    (ok (map-set delegates delegate token-id))))

;; -- pool
(define-map pool-data
  uint {
    pool-delegate: principal,
    assets: (list 128 principal),
    pool-contract: principal,
    lp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    withdrawal-manager: principal,
    cover-fee: uint,  ;; cover pool fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    withdrawal-window: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    losses: uint,
    status: (buff 1),
    open: bool, ;; open to the public
    pool-type: (buff 1)
  }
)

;; @desc creates pool
;; @restricted pool
;; @param token-id: id of the pool to be created
;; @param data:
;;  pool-delegate: pool delegate principal,
;;  lp-token: principal of the token used to account for xbtc rewards,
;;  payment: principal of contract for payments logic,
;;  liquidity-vault: principal of liquidity vault to hold funds available for loans,
;;  cp-token: principal of the token used to account for zest rewards in cover pool,
;;  rewards-calc: principal to calculate zest rewards,
;;  cover-fee: fee going to cover pool providers in BP,
;;  delegate-fee: fee going to delegate in BP,
;;  liquidity-cap: maximum amount that can be held in the liquidity vault,
;;  principal-out: amount of principal out in loans,
;;  cycle-length: length of cycles in the pool,
;;  min-cycles: minimum number of cycles needed to commit,
;;  max-maturity-length: maximum time until maturity for all loans,
;;  pool-stx-start: Stacks block height at which pool was activated,
;;  pool-btc-start: Bitcoin block height at which pool was activated,
;;  status: INIT | READY | CLOSED | DEFAULT,
;;  open: open to the public
;; @returns (response uint uint)
(define-public (create-pool
  (token-id uint)
  (data {
    pool-delegate: principal,
    assets: (list 128 principal),
    pool-contract: principal,
    lp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    withdrawal-manager: principal,
    cover-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    withdrawal-window: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    losses: uint,
    status: (buff 1),
    open: bool, ;; open to the public
    pool-type: (buff 1)
  }))
  (begin
    (try! (is-pool-contract))
    (asserts! (map-insert pool-data token-id data) ERR_POOL_ALREADY_EXISTS)

    (print { type: "create-liquidity-pool", payload: { key: token-id, data: data } })
    (ok true)))

;; @desc updates pool values
;; @restricted pool
;; @param token-id: pool id of the pool being updated
;; @param data
;; @returns (response true uint)
(define-public (set-pool
  (token-id uint)
  (data {
    pool-delegate: principal,
    assets: (list 128 principal),
    pool-contract: principal,
    lp-token: principal,
    payment: principal,
    liquidity-vault: principal,
    cp-token: principal,
    rewards-calc: principal,
    withdrawal-manager: principal,
    cover-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    principal-out: uint,
    cycle-length: uint,
    withdrawal-window: uint,
    min-cycles: uint,
    max-maturity-length: uint,
    pool-stx-start: uint,
    pool-btc-start: uint,
    losses: uint,
    status: (buff 1),
    open: bool, ;; open to the public
    pool-type: (buff 1)
  })
  )
  (begin
    (try! (is-pool-contract))
    (map-set pool-data token-id data)

    (print { type: "set-liquidity-pool", payload: { key: token-id, data:  data } })
    (ok true)))


;; -- loan-id -> token-id
(define-map loans-pool uint uint)

;; @desc maps loan id to pool id
;; @restricted pool
;; @param loan-id: loan-id being mapped
;; @param pool-id: pool-id to which the loan-id is being mapped to
;; @returns (response true uint)
(define-public (set-loan-to-pool (loan-id uint) (pool-id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "set-loan-to-pool", payload: { loan-id: loan-id, pool-id: pool-id } })
    (ok (map-set loans-pool loan-id pool-id))))

;; -- liquidity-provider-commitments
(define-map funds-sent
  { owner: principal, token-id: uint }
  {
    factor: uint,
    cycle-sent: uint,
    sent-at-btc: uint,
    sent-at-stx: uint,
    withdrawal-signaled: uint,
    last-claim-at: uint,
    amount: uint })

;; @desc sets the state of the commitment sent by a user to control for funds sent and withdrawals
;; @restricted pool
;; @param owner: user whose commitment is being updated
;; @param token-id: id of the pool related
;; @param data:
;;  factor: number of cycles committed,
;;  cycle-sent: cycle # at which funds were sent,
;;  sent-at-btc: Bitcoin block height of update,
;;  sent-at-stx: Stacks block height of update,
;;  withdrawal-signaled: Stacks block height at which withdrawal is signaled,
;;  last-claim-at: Stacks block height of last claim of rewards,
;;  amount: amount of funds signaled for withdrawal
;; @returns (response uint uint)
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
    amount: uint }))
  (begin
    (try! (is-pool-contract))
    (map-set funds-sent { owner: owner, token-id: token-id } data)

    (print { type: "set-funds-sent", payload: { key: { owner: owner, token-id: token-id }, data:  data } })
    (ok true)))

;; -- last-pool-id
(define-data-var last-pool-id uint u0)

;; @desc update the last pool id value
;; @restricted pool
;; @param id: loan-id being set to
;; @returns (response true uint)
(define-public (set-last-pool-id (id uint))
  (begin
    (try! (is-pool-contract))
    (print { type: "set-last-pool-id", payload: { last-pool-id: id } })
    (ok (var-set last-pool-id id))))

;; -- onboarding liquidity-provider
(define-map liquidity-providers { token-id: uint, lp: principal } bool)

;; liquidity pool providers
;; @desc add liquidity pool provider to the set of allowed providers in case that the pool is closed
;; @restricted pool
;; @param token-id: id of the pool related
;; @param liquidity-provider: principal being added to map
;; @returns (response uint uint)
(define-public (add-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
    (try! (is-pool-contract))
    (print { type: "add-liquidity-provider", payload: { liquidity-provider: liquidity-provider, token-id: token-id } })
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } true))))

;; @desc remove liquidity pool provider to the set of allowed providers in case that the pool is closed
;; @restricted pool
;; @param token-id: id of the pool related
;; @param liquidity-provider: principal being added to map
;; @returns (response uint uint)
(define-public (remove-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
    (try! (is-pool-contract))
    (print { type: "remove-liquidity-provider", payload: { liquidity-provider: liquidity-provider, token-id: token-id } })
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } false))))

(define-read-only (is-liquidity-provider (token-id uint) (liquidity-provider principal))
  (default-to false (map-get? liquidity-providers { token-id: token-id, lp: liquidity-provider })))

;; -- pool getters

(define-public (get-pool (token-id uint))
  (ok (unwrap! (map-get? pool-data token-id) ERR_INVALID_TOKEN_ID)))

(define-read-only (get-pool-read (token-id uint))
  (unwrap-panic (map-get? pool-data token-id)))

(define-read-only (get-last-pool-id)
  (var-get last-pool-id))

;; -- loan-to-pool-id
(define-public (get-loan-pool-id (loan-id uint))
  (ok (unwrap! (map-get? loans-pool loan-id) ERR_LOAN_DOES_NOT_EXIST)))

(define-read-only (get-loan-pool-id-read (loan-id uint))
  (unwrap-panic (map-get? loans-pool loan-id)))

;; -- funds-sent
(define-public (get-funds-sent (owner principal) (token-id uint))
  (ok (unwrap! (map-get? funds-sent { owner: owner, token-id: token-id }) ERR_INVALID_SENDER)))

(define-read-only (get-funds-sent-read (owner principal) (token-id uint))
  (unwrap-panic (map-get? funds-sent { owner: owner, token-id: token-id })))

;; -- governor
(define-read-only (get-pool-governor (governor principal) (token-id uint))
  (map-get? governors { governor: governor, token-id: token-id }))

(define-public (is-pool-governor  (governor principal) (token-id uint))
  (ok (map-get? governors { governor: governor, token-id: token-id })))

(define-read-only (is-pool-governor-read (governor principal) (token-id uint))
  (map-get? governors { governor: governor, token-id: token-id }))

;; -- delegate
(define-read-only (get-token-id-by-delegate (delegate principal))
  (map-get? delegates delegate))

(define-read-only (get-delegate-by-token-id (token-id uint))
  (map-get? pool-delegate token-id))

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-data", payload: owner })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (is-pool-contract)
  (if (contract-call? .globals is-pool-contract contract-caller) (ok true) ERR_UNAUTHORIZED))

;; ERROR START 130000
(define-constant ERR_UNAUTHORIZED (err u130000))
(define-constant ERR_POOL_ALREADY_EXISTS (err u130001))
(define-constant ERR_INVALID_TOKEN_ID (err u130002))
(define-constant ERR_INVALID_SENDER (err u130003))
(define-constant ERR_LOAN_DOES_NOT_EXIST (err u130004))