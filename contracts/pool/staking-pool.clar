(impl-trait .ownable-trait.ownable-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant DEFAULT 0x02)

(define-data-var last-id uint u0)

(define-data-var pool
  {
    sp-contract: principal,
    status: (buff 1)
  }
  {
    sp-contract: .sp-token,
    status: INIT
  }
)

;; liquidity-provider -> funds-sent data
(define-map funds-sent
  principal
  {
    withdrawal-signaled: uint,
    amount: uint
  }
)

(define-public (send-funds (sp-token <dt>) (amount uint) (caller principal))
  (let (
    (pool-data (var-get pool))
    (sp-contract (contract-of sp-token))
  )
    (try! (is-paused))
    (asserts! (is-eq (get sp-contract pool-data) sp-contract) ERR_INVALID_SP)
    (asserts! (is-eq (get status pool-data) READY) ERR_POOL_CLOSED)
    (asserts! (not (is-eq (get status pool-data) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq caller contract-caller) ERR_UNAUTHORIZED)
    
    (map-set funds-sent caller { withdrawal-signaled: u0, amount: u0 })
    
    (try! (contract-call? .zge000-governance-token transfer amount caller (as-contract tx-sender) none))
    (try! (contract-call? sp-token mint u0 (to-precision amount) caller))
    (ok true)
  )
)

(define-public (add-rewards (sp-token <dt>) (amount uint) (caller principal))
  (let (
    (sp-contract (contract-of sp-token))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq caller contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-sp sp-contract) ERR_INVALID_SP)

    (try! (contract-call? .zge000-governance-token transfer amount caller (as-contract tx-sender) none))
    (contract-call? sp-token add-rewards u0 amount)
  )
)

(define-public (withdraw-rewards (sp-token <dt>) (token-id uint) (recipient principal))
  (let (
    (withdrawn-funds (try! (contract-call? sp-token withdraw-rewards token-id recipient)))
  )
    (asserts! (is-eq recipient contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-xbtc (contract-of sp-token)) ERR_INVALID_SP)

    (as-contract (try! (contract-call? .zge000-governance-token transfer withdrawn-funds (as-contract tx-sender) recipient none)))
    (ok withdrawn-funds)
  )
)

(define-public (signal-withdrawal (amount uint) (caller principal))
  (let (
    (funds-sent-data (unwrap! (map-get? funds-sent caller) ERR_INVALID_PRINCIPAL))
  )
    (asserts! (is-eq caller contract-caller) ERR_UNAUTHORIZED)
    
    (map-set funds-sent caller (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
    (ok true)
  )
)

(define-public (withdraw (sp-token <dt>) (amount uint) (caller principal))
  (let (
    (pool-data (get-pool))
    (funds-sent-data (unwrap! (map-get? funds-sent caller) ERR_INVALID_PRINCIPAL))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (stx-time-delta (- block-height withdrawal-signaled))
    (cooldown-time (get staker-cooldown-period globals))
    (unstake-window (get staker-unstake-window globals))
    )
    (asserts! (>= stx-time-delta cooldown-time) ERR_COOLDOWN_ONGOING)
    (asserts! (< stx-time-delta (+ unstake-window cooldown-time)) ERR_UNSTAKE_WINDOW_EXPIRED)
    (asserts! (>= (get amount funds-sent-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)
    (asserts! (is-eq caller contract-caller) ERR_UNAUTHORIZED)
    
    (as-contract (try! (contract-call? .zge000-governance-token transfer amount (as-contract tx-sender) caller none)))
    ;; amount transferred is checked by the amount of sp-tokens being burned
    (print { event: "pool_withdrawal", funds-withdrawn: amount, caller: caller })
    (contract-call? sp-token burn u0 (to-precision amount) caller)
  )
)

(define-read-only (get-pool)
  (var-get pool)
)

(define-constant DFT_PRECISION (pow u10 u5))

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

(define-public (set-ready)
  (let (
    (pool-data (get-pool))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (var-set pool (merge pool-data { status: READY }))

    (ok true)
  )
)

(define-public (set-default)
  (let (
    (pool-data (get-pool))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    (var-set pool (merge pool-data { status: DEFAULT }))

    (ok true)
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

;; ERROR START 9000
(define-constant ERR_UNAUTHORIZED (err u9000))
(define-constant ERR_PANIC (err u9001))
(define-constant ERR_PAUSED (err u9002))

(define-constant ERR_INVALID_SP (err u9000))
(define-constant ERR_POOL_DEFAULT (err u9001))
(define-constant ERR_POOL_CLOSED (err u9002))
(define-constant ERR_INVALID_PRINCIPAL (err u9003))
(define-constant ERR_COOLDOWN_ONGOING (err u9004))
(define-constant ERR_UNSTAKE_WINDOW_EXPIRED (err u9005))
(define-constant ERR_EXCEEDED_SIGNALED_AMOUNT (err u9006))
