(impl-trait .ownable-trait.ownable-trait)

(use-trait cp-token .lp-token-trait.lp-token-trait)
(use-trait loan-token .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-data-var pool-id uint u0)

(define-constant ONE_DAY u144)
(define-constant CYCLE (* u14 u144))

;; (define-constant CLOSED 0x00)
;; (define-constant OPEN 0x01)
;; (define-constant DEFAULT 0x02)

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

(define-map cover-pool
  { cp: principal, token-id: uint }
  {
    status: (buff 1),
    open: bool,
    cycle-length: uint,
    min-cycles: uint
  })
    
(define-map sent-funds
  { owner: principal, token-id: uint }
  { start: uint, cycles: uint, withdrawal-signaled: uint }
)

(define-public (create-pool
  (cp-token <cp-token>)
  (token-id uint)
  (open bool)
  (cycle-length uint)
  (min-cycles uint)
  )
  (let (
    (cp-contract (contract-of cp-token))
  )
    (try! (is-pool))
    (map-set cover-pool
      { cp: cp-contract, token-id: token-id }
      {
        status: INIT,
        open: open,
        cycle-length: cycle-length,
        min-cycles: min-cycles
      }
    )
    (ok true)
  )
)

(define-public (finalize-pool (cp-token <cp-token>) (token-id uint))
  (let (
    (cp-contract (contract-of cp-token))
    (pool (try! (get-pool cp-contract token-id)))
  )
    (try! (is-pool))
    (map-set cover-pool  { cp: cp-contract, token-id: token-id } (merge pool { status: READY }))
    (ok true)
  )
)

(define-public (get-pool (cp-contract principal) (token-id uint))
  (ok (unwrap! (map-get? cover-pool { cp: cp-contract, token-id: token-id }) ERR_INVALID_LP))
)

(define-public (get-staker-data (staker principal) (token-id uint))
  (ok (unwrap! (map-get? sent-funds { owner: staker, token-id: token-id }) ERR_INVALID_VALUES))
)

(define-public (set-open (cp-token <cp-token>) (token-id uint) (open bool))
  (let (
    (cp-contract (contract-of cp-token))
    (pool (try! (get-pool cp-contract token-id)))
  )
    (try! (is-pool))
    (map-set cover-pool  { cp: cp-contract, token-id: token-id } (merge pool { open: open }))
    (ok true)
  )
)

(define-public (set-cycle-length (cp-token <cp-token>) (token-id uint) (cycle-length uint))
  (let (
    (cp-contract (contract-of cp-token))
    (pool (try! (get-pool cp-contract token-id)))
  )
    (try! (is-pool))
    (map-set cover-pool  { cp: cp-contract, token-id: token-id } (merge pool { cycle-length: cycle-length}))
    (ok true)
  )
)

(define-public (set-min-cycles (cp-token <cp-token>) (token-id uint) (min-cycles uint))
  (let (
    (cp-contract (contract-of cp-token))
    (pool (try! (get-pool cp-contract token-id)))
  )
    (try! (is-pool))
    (map-set cover-pool  { cp: cp-contract, token-id: token-id } (merge pool { min-cycles: min-cycles }))
    (ok true)
  )
)

(define-public (send-funds (cp-token <cp-token>) (token-id uint) (amount uint) (cycles uint))
  (let (
    (pool (try! (get-pool (contract-of cp-token) token-id)))
    (cp-contract (contract-of cp-token))
  )
    (try! (is-enabled))

    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (or (get open pool) (is-staker)) ERR_UNAUTHORIZED)

    (asserts! (>= cycles (get min-cycles pool)) ERR_INVALID_CYCLES)

    (try! (contract-call? .zge000-governance-token transfer amount tx-sender (as-contract tx-sender) none))
    (try! (contract-call? cp-token mint token-id (to-precision amount) tx-sender))

    (map-set sent-funds { owner: tx-sender, token-id: token-id } { start: block-height, cycles: cycles, withdrawal-signaled: u0 })
    (ok true)
  )
)

(define-public (signal-withdrawal (cp-token <cp-token>) (token-id uint))
  (let (
    (pool (try! (get-pool (contract-of cp-token) token-id)))
    (sent-funds-data (try! (get-staker-data tx-sender token-id)))
  )
    (map-set sent-funds { owner: tx-sender, token-id: token-id } (merge sent-funds-data { withdrawal-signaled: block-height }))
    (ok true)
  )
)

(define-public (withdraw (cp-token <cp-token>) (token-id uint) (amount uint))
  (let (
    (recipient tx-sender)
    (pool (try! (get-pool (contract-of cp-token) token-id)))
    (sent-funds-data (try! (get-staker-data tx-sender token-id)))
    (lost-funds (try! (contract-call? cp-token recognize-losses token-id recipient)))
    (cp-contract (contract-of cp-token))
    (withdrawal-time-delta (- block-height (get withdrawal-signaled sent-funds-data)))
    (withrawal-signaled-time (get withdrawal-signaled sent-funds-data))
    (globals (contract-call? .globals get-globals))
  )
    ;; has passed cooldown
    (asserts! (> withdrawal-time-delta (get staker-cooldown-period globals)) (err u999))
    ;; has reached window limit
    (asserts! (< withdrawal-time-delta ( + withrawal-signaled-time (get staker-unstake-window globals))) (err u999))
    ;; has lockup period expired
    (asserts! (> withdrawal-time-delta (* (get cycles sent-funds-data) (get cycle-length pool))) (err u999))

    (try! (as-contract (contract-call? .zge000-governance-token transfer (- amount lost-funds) tx-sender recipient none)))
    (try! (contract-call? cp-token burn token-id (to-precision amount) tx-sender))
    (ok true)
  )
)

(define-public (withdraw-zest-rewards (cp-token <cp-token>) (token-id uint) (rewards-calc <rewards-calc>))
  (let (
    (withdrawn-funds (try! (contract-call? cp-token withdraw-rewards token-id)))
    (sent-funds-data (try! (get-staker-data tx-sender token-id)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC))
    (is-cp (asserts! (contract-call? .globals is-cp (contract-of cp-token)) ERR_INVALID_ZP))
    (rewards (try! (contract-call? rewards-calc mint-rewards tx-sender (get cycles sent-funds-data) withdrawn-funds)))
  )
    (ok rewards)
  )
)

;; -- ownable-trait
;; (define-data-var contract-owner principal .executor-dao)
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

(define-public (set-contract-owner (owner principal))
  (begin
    (try! (is-contract-owner tx-sender))
    (ok (var-set contract-owner owner))
  )
)

(define-public (is-contract-owner (caller principal))
  (if (is-eq caller (var-get contract-owner))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; --- approved

(define-map approved-contracts principal bool)

;; (define-public (add-contract (contract principal))
  ;; (begin
		;; (try! (is-contract-owner tx-sender))
		;; (ok (map-set approved-contracts contract true))
	;; )
;; )

;; (define-public (remove-contract (contract principal))
  ;; (begin
		;; (try! (is-contract-owner tx-sender))
		;; (ok (map-set approved-contracts contract false))
	;; )
;; )

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-data-var enabled bool true)

(define-private (is-enabled)
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (if (get paused globals)
      ERR_DISABLED
      (ok true)
    )
  )
)

(define-constant DFT_PRECISION (pow u10 u5))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION)
)

(define-public (default-withdrawal (cp-token <cp-token>) (token-id uint) (remaining-loan-amount uint) (recipient principal))
  (let (
    (pool (try! (get-pool (contract-of cp-token) token-id)))
    (recovered-amount (unwrap! (contract-call? .zge000-governance-token get-balance (as-contract tx-sender)) ERR_PANIC))
    (amount-to-send (if (> remaining-loan-amount recovered-amount) recovered-amount remaining-loan-amount))
  )
    (try! (is-pool))

    (try! (as-contract (contract-call? .zge000-governance-token transfer amount-to-send tx-sender recipient none)))
    (ok amount-to-send)
  )
)

(define-map stakers principal bool)

(define-public (add-staker (staker principal))
  (begin
		(try! (is-contract-owner contract-caller))
		(ok (map-set stakers staker true))
	)
)

(define-public (remove-staker (staker principal))
  (begin
		(try! (is-contract-owner contract-caller))
		(ok (map-set stakers staker false))
	)
)

(define-read-only (is-staker)
  (default-to false (map-get? stakers tx-sender))
)

(define-data-var pool-contract principal tx-sender)

(define-read-only (get-pool-contract)
  (ok (var-get pool-contract))
)

(define-public (set-pool-contract (new-pool principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (ok (var-set pool-contract new-pool))
  )
)

(define-read-only (is-pool)
  (if (is-eq contract-caller (var-get pool-contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_INVALID_LP (err u304))
(define-constant ERR_POOL_CLOSED (err u305))
(define-constant ERR_PANIC (err u306))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u306))
(define-constant ERR_FUNDS_LOCKED (err u307))
(define-constant ERR_DISABLED (err u308))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u5007))
(define-constant ERR_INVALID_CYCLES (err u5008))

(define-constant ERR_INVALID_REWARDS_CALC (err u5009))
(define-constant ERR_INVALID_ZP (err u5010))

(var-set pool-contract .pool-v1-0)
