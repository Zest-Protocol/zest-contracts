(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait payment .payment-trait.payment-trait)

(define-data-var pool-id uint u0)


(define-constant ONE_DAY u144)

(define-constant DEFAULT_LOCKUP_PERIOD (* u90 ONE_DAY))

(define-constant OPEN 0x00)
(define-constant CLOSED 0x01)
(define-constant DEFAULT 0x02)

(define-map pool-tokens
  uint
  {
    lp-token: principal
    ;; debt-token: principal
  }
)

(define-map pool-data
  principal
  {
    pool-delegate: principal,
    staking-fee: uint,  ;; staking fees in BP
    delegate-fee: uint, ;; delegate fees in BP
    liquidity-cap: uint,
    liquidity-vault: principal,
    sp-token: principal,
    payment: principal,
    principal-out: uint,
    lockup-period: uint,
    status: (buff 1),
    open: bool ;; open to the public
  }
)

;; address -> block-time
(define-map deposit-date
  principal
  uint
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

;; bridge access
(define-data-var bridge-contract principal .bridge-router-test)

(define-public (set-bridge-contract (new-bridge principal))
  (begin
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (var-set bridge-contract new-bridge))
  )
)

(define-read-only (is-bridge)
  (is-eq (var-get bridge-contract) contract-caller)
)

(define-public (create-pool
  (pool-delegate principal)
  (lp-token <lp-token>)
  (payment <payment>)
  (staking-fee uint)
  (delegate-fee uint)
  (liquidity-cap uint)
  (liquidity-vault <lv>)
  (sp-token <lp-token>)
  (open bool)
  )
  (let (
    (new-pool-id (+ u1 (var-get pool-id)))
    (lp-contract (contract-of lp-token))
    ;; (debt-contract (contract-of debt-token))
  )
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? pool-data lp-contract)) ERR_UNAUTHORIZED)

    (map-set pool-tokens new-pool-id
      {
        lp-token: lp-contract
        ;; debt-token: debt-contract
      })
    (map-set pool-data lp-contract
      {
        pool-delegate: pool-delegate,
        staking-fee: staking-fee,
        delegate-fee: delegate-fee,
        liquidity-cap: liquidity-cap,
        liquidity-vault: (contract-of liquidity-vault),
        payment: (contract-of payment),
        sp-token: (contract-of sp-token),
        principal-out: u0,
        lockup-period: DEFAULT_LOCKUP_PERIOD,
        status: OPEN,
        open: open
      })

    (ok true)
  )
)

(define-private (get-pool-data (lp-token principal))
  (map-get? pool-data lp-token)
)

(define-public (get-pool (lp-token principal))
  (ok (unwrap! (map-get? pool-data lp-token) ERR_INVALID_LP))
)

(define-read-only (get-liquidity-cap (lp-token principal))
  (ok (get liquidity-cap (unwrap! (get-pool-data lp-token) ERR_INVALID_LP)))
)

(define-public (is-pool-delegate (pool-delegate principal))
  (if (is-eq tx-sender pool-delegate)
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-public (set-liquidity-cap (lp-token <lp-token>) (liquidity-cap uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (try! (is-pool-delegate (get pool-delegate pool)))
    (asserts! (lc-check liquidity-cap (get liquidity-cap pool)) ERR_INVALID_VALUES)
    (map-set pool-data lp-contract (merge pool { liquidity-cap: liquidity-cap }))
    (ok true)
  )
)

(define-public (set-lockup-period (lp-token <lp-token>) (lockup-period uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (try! (is-pool-delegate (get pool-delegate pool)))
    ;; can only increase lockup period
    (asserts! (> (get lockup-period pool) lockup-period) ERR_INVALID_VALUES)

    (map-set pool-data lp-contract (merge pool { lockup-period: lockup-period }))
    (ok true)
  )
)

;; @desc sanity checks for liquidity cap
(define-read-only (lc-check (new-lc uint) (previous-lc uint))
  (and (> new-lc previous-lc) (> new-lc u0))
)

;; @desc deposit the funds sent to the pool into the liquidity vault. assumes funds were sent to this contract
(define-public (deposit (lp-token <lp-token>) (zp-token <dt>) (amount uint) (height uint) (lv <lv>))
  (let (
    (pool (unwrap! (get-pool-data (contract-of lp-token)) ERR_INVALID_LP))
    (lv-contract (contract-of lv))
    (lv-balance (unwrap! (contract-call? .xbtc get-balance lv-contract) ERR_PANIC))
  )
    (asserts! (is-bridge) ERR_UNAUTHORIZED)
    (try! (is-enabled))
    (asserts! (or (get open pool) (is-lender tx-sender)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_VALUES)
    (asserts! (is-eq (get status pool) OPEN) ERR_POOL_CLOSED)
    (asserts! (<= (+ (get principal-out pool) amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)
    ;; bridge sends funds to the pool before executing this call

    ;; restart deposit date
    (map-set deposit-date tx-sender height)

    (try! (as-contract (contract-call? .xbtc transfer amount tx-sender lv-contract none)))
    (try! (contract-call? lp-token mint tx-sender (to-precision amount)))
    (try! (contract-call? zp-token mint tx-sender (to-precision amount)))
    (ok true)
  )
)


(define-public (create-loan
  (lp-token <lp-token>)
  (loan-amount uint)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (loan-token principal)
  (funding-vault principal)
  )
  (let (
      (last-id (try! (contract-call? .loan-v1-0 create-loan loan-amount coll-ratio coll-token apr maturity-length payment-period coll-vault loan-token funding-vault)))
    )
      (map-insert loans last-id { lp-token: (contract-of lp-token ), funding-vault: funding-vault })
      (ok last-id)
  )
)

(define-public (fund-loan (loan-id uint) (lp-token <lp-token>) (loan-token <dt>) (lv <lv>) (amount uint))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (try! (is-pool-delegate (get pool-delegate pool)))
    ;; a success in transfer means there were enough funds in the liquidity-vault
    (try! (contract-call? lv transfer amount (get funding-vault loan) .xbtc))
    (try! (contract-call? .loan-v1-0 fund-loan loan-id lp-token loan-token amount))
    (ok (map-set pool-data lp-contract (merge pool { principal-out: (+ amount (get principal-out pool)) } )))
  )
)

(define-public (unwind (loan-id uint) (lp-token <lp-token>) (loan-token <dt>) (fv <v>) (amount uint))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (lp-contract (contract-of lp-token))
    (fv-contract (contract-of fv))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
    (returned-funds (try! (contract-call? .loan-v1-0 unwind loan-id lp-token loan-token amount)))
  )
    (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_VALUES)

    (try! (contract-call? fv transfer amount (get liquidity-vault pool) .xbtc))
    
    (ok (map-set pool-data lp-contract (merge pool { principal-out: (- (get principal-out pool) returned-funds) } )))
  )
)

;; loan-id -> lp-token
(define-map loans uint { lp-token: principal, funding-vault: principal })

;; @desc withdraw funds to the owner
(define-public (withdraw (lp-token <lp-token>) (lv <lv>) (amount uint) (ft <ft>))
  (let (
    (recipient tx-sender)
    (pool (unwrap! (get-pool-data (contract-of lp-token)) ERR_INVALID_LP))
    (lost-funds (try! (contract-call? lp-token withdraw-deposit recipient)))
    (lv-contract (contract-of lv))
    )
    (asserts! (is-bridge) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_VALUES)
    (asserts! (> (- burn-block-height (default-to u0 (map-get? deposit-date tx-sender))) (get lockup-period pool)) ERR_FUNDS_LOCKED)
    ;; this transfer should only happen in the bridge contract
    (try! (contract-call? lv transfer (- amount lost-funds) recipient ft))
    (contract-call? lp-token burn tx-sender (to-precision amount))
  )
)

(define-public (accept-rollover (lp-token <lp-token>) (loan-id uint))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (pool (unwrap! (get-pool-data (contract-of lp-token)) ERR_INVALID_LP))
  )
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (contract-of lp-token) (get lp-token loan)) ERR_INVALID_VALUES)
    (contract-call? .loan-v1-0 accept-rollover loan-id)
  )
)

(define-public (liquidate-loan (loan-id uint) (lp-token <lp-token>) (coll-vault <cv>) (coll-token <ft>) (sp-token <lp-token>))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate loan-id coll-vault coll-token (as-contract tx-sender))))
    (loan-amount (get loan-amount coll-recovery))
    (recovered-funds (get recovered-funds coll-recovery))
    (stakers-recovery (try! (contract-call? .staking-pool-v1-0 default-withdrawal sp-token (- loan-amount recovered-funds) (as-contract tx-sender))))
  )
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token loan)) ERR_UNAUTHORIZED)
    (if (> loan-amount (+ stakers-recovery recovered-funds)) ;; if loan-amount bigger than recovered amounts, recognize losses
      (begin
        (try! (as-contract (contract-call? .xbtc transfer (+ stakers-recovery recovered-funds) tx-sender (get liquidity-vault pool) none)))
        (print 
          { recognized-loss:
            (try! (as-contract (contract-call?
              sp-token
              distribute-losses-public
              (to-int (- loan-amount (+ stakers-recovery recovered-funds)))))) })
        (map-set pool-data lp-contract (merge pool { principal-out: (- (get principal-out pool) (+ stakers-recovery recovered-funds)) }))
      )
      (begin
        (if (> recovered-funds loan-amount) ;; if collateral was enough, distribute excess as rewards
          (begin
            (try! (as-contract (contract-call? .xbtc transfer loan-amount tx-sender (get liquidity-vault pool) none)))
            (try! (contract-call? lp-token deposit-rewards (to-int (- loan-amount recovered-funds))))
          )
          (begin
            (try! (as-contract (contract-call? .xbtc transfer loan-amount tx-sender (get liquidity-vault pool) none)))
            (try! (contract-call? lp-token deposit-rewards (to-int (- loan-amount (+ stakers-recovery recovered-funds)))))
          )
        )
        (map-set pool-data lp-contract (merge pool { principal-out: (- (get principal-out pool) loan-amount) }))
      )
    )
    
    (ok { staking-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })
  )
)

(define-public (trigger-default-mode (lp-token <lp-token>))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (unwrap! (get-pool-data lp-contract) ERR_INVALID_LP))
  )
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (map-set pool-data lp-contract (merge pool { status: DEFAULT } )))
  )
)

(define-constant DFT_PRECISION (pow u10 u18))
(define-constant BITCOIN_PRECISION (pow u10 u8))

(define-read-only (to-precision (amount uint))
  (/ (* amount DFT_PRECISION) BITCOIN_PRECISION)
)

;; --- onboarding lender

(define-map lenders principal bool)

(define-public (add-lender (lender principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set lenders lender true))
	)
)

(define-public (remove-lender (lender principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set lenders lender false))
	)
)

(define-read-only (is-lender (lender principal))
  (default-to false (map-get? lenders lender))
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

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_INVALID_LP (err u304))
(define-constant ERR_POOL_CLOSED (err u305))
(define-constant ERR_PANIC (err u306))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u306))
(define-constant ERR_FUNDS_LOCKED (err u307))
(define-constant ERR_DISABLED (err u308))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u5007))
