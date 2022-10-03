(impl-trait .ownable-trait.ownable-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)


(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant DEFAULT 0x02)

(define-data-var last-id uint u0)

(define-map pool
  uint
  {
    sp-contract: principal,
    status: (buff 1)
  }
)

;; liquidity-provider -> funds-sent data
(define-map funds-sent
  { owner: principal, token-id: uint }
  {
    withdrawal-signaled: uint,
    amount: uint
  }
)

(define-public (create-pool (token-id uint) (sp-token <dt>))
  (let (
    (id (+ u1 (var-get last-id)))
    (sp-contract (contract-of sp-token))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-sp sp-contract) ERR_INVALID_SP)
    (map-set pool id
    {
      sp-contract: sp-contract,
      status: INIT
    })
    (ok id)
  )
)

(define-public (send-funds (sp-token <dt>) (amount uint) (token-id uint))
  (let (
    (pool-data (unwrap-panic (map-get? pool token-id)))
    (sp-contract (contract-of sp-token))
  )
    (try! (is-paused))
    (asserts! (is-eq (get sp-contract pool-data) sp-contract) ERR_INVALID_SP)
    (asserts! (is-eq (get status pool-data) READY) ERR_POOL_CLOSED)
    (asserts! (not (is-eq (get status pool-data) DEFAULT)) ERR_POOL_DEFAULT)
    
    (map-set funds-sent { owner: tx-sender, token-id: token-id } { withdrawal-signaled: u0, amount: u0 })
    
    (try! (contract-call? .zge000-governance-token transfer amount tx-sender (as-contract tx-sender) none))
    (try! (contract-call? sp-token mint token-id (to-precision amount) tx-sender))
    (ok true)
  )
)

(define-public (add-rewards (sp-token <dt>) (token-id uint) (amount uint))
  (let (
    (sp-contract (contract-of sp-token))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-sp sp-contract) ERR_INVALID_SP)

    (try! (contract-call? .zge000-governance-token transfer amount tx-sender (as-contract tx-sender) none))
    (contract-call? sp-token add-rewards token-id amount)
  )
)

(define-public (withdraw-rewards (sp-token <dt>) (token-id uint))
  (let (
    (recipient tx-sender)
    (withdrawn-funds (try! (contract-call? sp-token withdraw-rewards token-id)))
  )
    (asserts! (contract-call? .globals is-xbtc (contract-of sp-token)) ERR_INVALID_SP)

    (as-contract (try! (contract-call? .zge000-governance-token transfer withdrawn-funds (as-contract tx-sender) recipient none)))
    (ok withdrawn-funds)
  )
)

(define-public (signal-withdrawal (token-id uint) (amount uint))
  (let (
    (funds-sent-data (unwrap! (map-get? funds-sent { owner: tx-sender, token-id: token-id }) ERR_INVALID_PRINCIPAL))
  )
    (map-set funds-sent { owner: tx-sender, token-id: token-id } (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
    (ok true)
  )
)

(define-public (withdraw (sp-token <dt>) (token-id uint) (amount uint))
  (let (
    (recipient tx-sender)
    (pool-data (get-pool token-id))
    (funds-sent-data (unwrap! (map-get? funds-sent { owner: tx-sender, token-id: token-id }) ERR_INVALID_PRINCIPAL))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (stx-time-delta (- block-height withdrawal-signaled))
    (cooldown-time (get staker-cooldown-period globals))
    (unstake-window (get staker-unstake-window globals))
    )
    (asserts! (>= stx-time-delta cooldown-time) ERR_COOLDOWN_ONGOING)
    (asserts! (< stx-time-delta (+ unstake-window cooldown-time)) ERR_UNSTAKE_WINDOW_EXPIRED)
    (asserts! (>= (get amount funds-sent-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)
    
    (as-contract (try! (contract-call? .zge000-governance-token transfer amount (as-contract tx-sender) recipient none)))
    ;; amount transferred is checked by the amount of sp-tokens being burned
    (print { event: "pool_withdrawal", funds-withdrawn: amount, caller: recipient })
    (contract-call? sp-token burn token-id (to-precision amount) tx-sender)
  )
)

(define-read-only (get-pool (token-id uint))
  (unwrap-panic (map-get? pool token-id))
)

(define-constant DFT_PRECISION (pow u10 u5))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION)
)

(define-private (is-paused)
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (if (get paused globals) ERR_PAUSED (ok true))
  )
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
    (ok (var-set contract-owner owner))
  )
)

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner))
)

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_PANIC (err u1001))
(define-constant ERR_PAUSED (err u1002))

(define-constant ERR_INVALID_SP (err u8000))
(define-constant ERR_POOL_DEFAULT (err u8001))
(define-constant ERR_POOL_CLOSED (err u8002))
(define-constant ERR_INVALID_PRINCIPAL (err u8003))
(define-constant ERR_COOLDOWN_ONGOING (err u8004))
(define-constant ERR_UNSTAKE_WINDOW_EXPIRED (err u8005))
(define-constant ERR_EXCEEDED_SIGNALED_AMOUNT (err u8006))
