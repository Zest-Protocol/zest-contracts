(impl-trait .ownable-trait.ownable-trait)

(use-trait sp-token .lp-token-trait.lp-token-trait)
(use-trait loan-token .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait payment .payment-trait.payment-trait)

(define-data-var pool-id uint u0)

(define-constant ONE_DAY u144)

(define-constant CLOSED 0x00)
(define-constant OPEN 0x01)

(define-map staking-pool principal { sp-token: principal, status: (buff 1), open-to-public: bool, funds: uint })
(define-map deposit-date principal { start: uint, cycles: uint })

(define-public (deposit (sp-token <sp-token>) (amount uint) (cycles uint))
  (let (
    (pool (unwrap! (get-pool-data (contract-of sp-token)) ERR_INVALID_LP))
    (sp-contract (contract-of sp-token))
  )
    (asserts! (is-eq (get sp-token pool) sp-contract) ERR_INVALID_VALUES)
    (asserts! (is-eq (get status pool) OPEN) ERR_POOL_CLOSED)
    (try! (is-enabled))

    (try! (contract-call? .xbtc transfer amount tx-sender (as-contract tx-sender) none))
    (try! (contract-call? sp-token mint tx-sender (to-precision amount)))
    (map-set staking-pool sp-contract (merge pool { funds: (+ amount (get funds pool)) }))
    (map-set deposit-date tx-sender { start: block-height, cycles: cycles })
    (ok true)
  )
)

(define-public (withdraw (sp-token <sp-token>) (amount uint))
  (let (
    (recipient tx-sender)
    (pool (unwrap! (get-pool-data (contract-of sp-token)) ERR_INVALID_LP))
    (lost-funds (try! (contract-call? sp-token withdraw-deposit recipient)))
    (sp-contract (contract-of sp-token))
  )
    (asserts! (is-eq (get sp-token pool) sp-contract) ERR_INVALID_VALUES)

    (try! (as-contract (contract-call? .xbtc transfer (- amount lost-funds) tx-sender recipient none)))
    (try! (contract-call? sp-token burn tx-sender (to-precision amount)))
    (map-set staking-pool sp-contract (merge pool { funds: (- (get funds pool) amount) }))
    (ok true)
  )
)

(define-public (get-staker-data (staker principal))
  (ok (unwrap! (map-get? deposit-date staker) ERR_INVALID_VALUES))
)

(define-private (get-pool-data (sp-token principal))
  (map-get? staking-pool sp-token)
)

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

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


;; --- approved

(define-map approved-contracts principal bool)

(define-public (add-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract true))
	)
)

(define-public (remove-contract (contract principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set approved-contracts contract false))
	)
)

(define-read-only (is-approved-contract (contract principal))
  (if (default-to false (map-get? approved-contracts contract))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-data-var enabled bool true)

(define-public (is-enabled)
  (if (var-get enabled)
    (ok true)
    ERR_DISABLED
  )
)

(define-public (disable-contract)
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set enabled false))
  )
)

(define-public (enable-contract)
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set enabled true))
  )
)

(define-constant DFT_PRECISION (pow u10 u18))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (/ (* amount DFT_PRECISION) BITCOIN_PRECISION)
)

(define-public (default-withdrawal (sp-token <sp-token>) (remaining-loan-amount uint) (recipient principal))
  (let (
    (pool (unwrap! (get-pool-data (contract-of sp-token)) ERR_INVALID_LP))
    (recovered-amount (get funds pool))
    (amount-to-send (if (> remaining-loan-amount recovered-amount) recovered-amount remaining-loan-amount))
  )
    (try! (is-approved-contract contract-caller))

    (try! (as-contract (contract-call? .xbtc transfer amount-to-send tx-sender recipient none)))
    (ok amount-to-send)
  )
)

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_INVALID_LP (err u304))
(define-constant ERR_POOL_CLOSED (err u305))
(define-constant ERR_PANIC (err u306))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u306))
(define-constant ERR_FUNDS_LOCKED (err u307))
(define-constant ERR_DISABLED (err u308))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u5007))
