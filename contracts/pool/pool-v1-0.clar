(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .sip-010-trait.sip-010-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-constant ONE_DAY u144)
(define-constant CYCLE (* u14 u144))

(define-constant BP u10000)

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

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

(define-map zp-set principal bool)
(define-map sp-set principal bool)

;; liquidity-provider -> funds-sent data
(define-map funds-sent
  { owner: principal, token-id: uint }
  {
    factor: uint,
    cycle-sent: uint,
    withdrawal-signaled: uint,
    cycle-claimed: uint,
    amount: uint
  }
)

;; Contract owner creates a pool
;;
;; @restricted contract-owner
;; @returns true
;;
;; @param pool-delegate: address of the pool delegate
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param payment: contract containing payment and rewards distribution logic
;; @param rewards-calc: contract containing logic for calculating zest rewards
;; @param cover-fee: fees dedicated to stakers in BP
;; @param delegate-fee: fees dedicated to the delegate in BP
;; @param liquidity-cap: liquidity cap in the pool
;; @param liquidity-vault: contract holding the liquid funds in the pool
;; @param cp-token: token to hold zest rewards funds for stakers
;; @param open: pool is open to public
(define-public (create-pool
  (pool-delegate principal)
  (lp-token <lp-token>)
  (token-id uint)
  (zp-token <dt>)
  (payment <payment>)
  (rewards-calc <rewards-calc>)
  (cover-fee uint)
  (delegate-fee uint)
  (liquidity-cap uint)
  (min-cycles uint)
  (max-maturity-length uint)
  (liquidity-vault <lv>)
  (cp-token <lp-token>)
  (open bool)
  )
  (let (
    (lp-contract (contract-of lp-token))
    (sp-contract (contract-of cp-token))
    (zp-contract (contract-of zp-token))
  )
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? pool-data token-id)) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-lp lp-contract) ERR_INVALID_LP)
    (asserts! (contract-call? .globals is-cp sp-contract) ERR_INVALID_SP)
    (asserts! (contract-call? .globals is-zp zp-contract) ERR_INVALID_ZP)
    (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC)
    (asserts! (contract-call? .globals is-liquidity-vault (contract-of liquidity-vault)) ERR_INVALID_LV)
    (asserts! (contract-call? .globals is-payment (contract-of payment)) ERR_INVALID_PAYMENT)

    (asserts! (<= (+ cover-fee delegate-fee) BP) ERR_INVALID_FEES)
    (asserts! (> min-cycles u0) ERR_INVALID_VALUES)

    (try! (contract-call? .cover-pool-v1-0 create-pool cp-token token-id open (* CYCLE u1) min-cycles))

    (asserts! (map-insert pool-data token-id
      {
        pool-delegate: pool-delegate,
        lp-token: lp-contract,
        zp-token: zp-contract,
        payment: (contract-of payment),
        liquidity-vault: (contract-of liquidity-vault),
        cp-token: sp-contract,
        rewards-calc: (contract-of rewards-calc),
        cover-fee: cover-fee,
        delegate-fee: delegate-fee,
        liquidity-cap: liquidity-cap,
        principal-out: u0,
        cycle-length: (* CYCLE u1),
        min-cycles: min-cycles,
        max-maturity-length: max-maturity-length,
        pool-stx-start: u0,
        pool-btc-start: u0,
        status: INIT,
        open: open
      }) ERR_SET_ALREADY_EXISTS)
    (asserts! (map-insert zp-set zp-contract true) ERR_SET_ALREADY_EXISTS)
    (asserts! (map-insert sp-set sp-contract true) ERR_SET_ALREADY_EXISTS)
    (print {event: "new_pool", new-pool: (map-get? pool-data token-id)})

    (ok true)
  )
)

(define-read-only (get-funds-sent (owner principal) (token-id uint))
  (ok (unwrap! (map-get? funds-sent { owner: owner, token-id: token-id }) ERR_INVALID_LP))
)

(define-public (get-pool (token-id uint))
  (ok (unwrap! (map-get? pool-data token-id) ERR_INVALID_LP))
)

(define-read-only (get-pool-data (token-id uint))
  (unwrap-panic (map-get? pool-data token-id))
)

(define-read-only (is-zp-set (zp-contract principal))
  (default-to false (map-get? zp-set zp-contract))
)

(define-read-only (is-sp-set (sp-contract principal))
  (default-to false (map-get? sp-set sp-contract))
)

;; --- pool setters

(define-public (set-liquidity-cap (lp-token <lp-token>) (token-id uint) (liquidity-cap uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (lc-check liquidity-cap (get liquidity-cap pool)) ERR_INVALID_LIQ)
    (map-set pool-data token-id (merge pool { liquidity-cap: liquidity-cap }))
    (ok true)
  )
)

(define-public (set-cycle-length (lp-token <lp-token>) (cp-token <lp-token>) (token-id uint) (cycle-length uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (> (get cycle-length pool) cycle-length) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-cycle-length cp-token token-id cycle-length))
    (map-set pool-data token-id (merge pool { cycle-length: cycle-length }))
    (ok true)
  )
)

(define-public (set-min-cycles (lp-token <lp-token>) (cp-token <lp-token>) (token-id uint) (min-cycles uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (and (< min-cycles (get min-cycles pool)) (> min-cycles u0)) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-min-cycles cp-token token-id min-cycles))
    (map-set pool-data token-id (merge pool { min-cycles: min-cycles }))
    (ok true)
  )
)

(define-public (set-delegate-fee (lp-token <lp-token>) (token-id uint) (delegate-fee uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (<= (+ delegate-fee (get cover-fee pool)) BP) ERR_INVALID_FEES)

    (map-set pool-data token-id (merge pool { delegate-fee: delegate-fee }))
    (ok true)
  )
)

(define-public (set-cover-fee (lp-token <lp-token>) (token-id uint) (cover-fee uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (<= (+ cover-fee (get delegate-fee pool)) BP) ERR_INVALID_FEES)

    (map-set pool-data token-id (merge pool { cover-fee: cover-fee }))
    (ok true)
  )
)

(define-public (set-open (lp-token <lp-token>) (cp-token <lp-token>) (token-id uint) (open bool))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .cover-pool-v1-0 set-open cp-token token-id open))
    (ok (map-set pool-data token-id (merge pool { open: open } )))
  )
)

(define-public (finalize-pool (lp-token <lp-token>) (zp-token <dtc>) (cp-token <lp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (height block-height)
  )
    (try! (is-paused))
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .cover-pool-v1-0 finalize-pool cp-token token-id))
    (try! (contract-call? zp-token set-cycle-start token-id height))
    (ok (map-set pool-data token-id (merge pool { status: READY, pool-stx-start: height, pool-btc-start: burn-block-height } )))
  )
)

;; send the funds sent to the pool into the liquidity vault. funds are sent from the tx-sender to the liquidity-vault
;;
;; @restricted supplier
;; @returns true
;;
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param amount: amount being sent from the bridge
;; @param factor: multiplier to the amount of time locked
;; @param height: height of the confirmed Bitcoin tx
;; @param liquidity-vault: contract holding the liquid funds in the pool
(define-public (send-funds (lp-token <lp-token>) (token-id uint) (zp-token <dt>) (amount uint) (factor uint) (height uint) (lv <lv>) (caller principal) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (lv-contract (contract-of lv))
    (zp-contract (contract-of zp-token))
    (lv-balance (unwrap! (contract-call? xbtc get-balance lv-contract) ERR_PANIC))
    (cycle (get cycle-length pool))
    (current-cycle (/ (- burn-block-height (get pool-stx-start pool)) cycle))
  )
    (try! (is-paused))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (or (get open pool) (is-liquidity-provider token-id caller)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (is-eq (get zp-token pool) zp-contract) ERR_INVALID_ZP)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (<= (+ (get principal-out pool) amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)
    (asserts! (>= factor (get min-cycles pool)) ERR_INVALID_LOCKUP)
    ;; bridge sends funds to the pool before executing this call
    (map-set funds-sent { owner: caller, token-id: token-id } (unwrap-panic (get-new-factor lp-token caller token-id amount factor current-cycle)))
    
    (try! (contract-call? xbtc transfer amount caller lv-contract none))
    (try! (contract-call? lp-token mint token-id (to-precision amount) caller))
    (try! (contract-call? zp-token mint token-id (to-precision amount) caller))
    (ok true)
  )
)

(define-private (get-new-factor (lp-token <lp-token>) (owner principal) (token-id uint) (amount uint) (factor uint) (current-cycle uint))
  (let (
    (prev-funds (unwrap-panic (contract-call? lp-token get-balance token-id owner)))
  )
    (match (map-get? funds-sent { owner: owner, token-id: token-id })
      funds-sent-data (let (
        (total-funds (+ prev-funds (to-precision amount)))
        (new-val (/ (* BP (to-precision amount)) total-funds))
        (prev-val (/ (* BP prev-funds) total-funds))
        (prev-factor (get factor funds-sent-data))
        (factor-sum (+ (* new-val factor) (* BP prev-factor)))
        (new-factor (if (> (/ factor-sum BP) u1) (+ u1 (/ factor-sum BP)) (/ factor-sum BP)))
      )
        (ok { factor: new-factor, cycle-sent: (get cycle-sent funds-sent-data), withdrawal-signaled: u0, cycle-claimed: (get cycle-claimed funds-sent-data), amount: u0 })
      )
      (ok { factor: factor, cycle-sent: current-cycle, withdrawal-signaled: u0, cycle-claimed: u0, amount: u0 })
    )
  )
)

;; Borrower creates a loan from the pool contract
;;
;; @returns the id of the loan created
;;
;; @param lp-token: token to hold xbtc rewards for LPers
;; @param loan-amount: amount requested for the loan
;; @param coll-ratio: collateral-to-xbtc amount ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param apr: APR in BPS
;; @param maturity-length: time until maturity
;; @param payment-period: intervals at which payment is due
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param funding-vault: contract that holds funds before drawdown
(define-public (create-loan
  (lp-token <lp-token>)
  (token-id uint)
  (loan-amount uint)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal)
  )
  (let (
    (pool (try! (get-pool token-id)))
    (last-id (try! (contract-call? .loan-v1-0 create-loan token-id loan-amount coll-ratio coll-token apr maturity-length payment-period coll-vault contract-caller funding-vault)))
  )
    (asserts! (>= (get max-maturity-length pool) maturity-length) ERR_INVALID_MATURITY_LENGTH)
    (map-insert loans last-id { lp-token: (contract-of lp-token ), token-id: token-id, funding-vault: funding-vault })
    (ok last-id)
  )
)

;; Pool Delegate sends funds to the funding contract in the loan.
;;
;; @returns true
;;
;; @param loan-id: id of loan being funded
;; @param lp-token: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount used to fund the loan request
(define-public (fund-loan (loan-id uint) (lp-token <lp-token>) (token-id uint) (lv <lv>) (xbtc <ft>))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (loan-data (contract-call? .loan-v1-0 get-loan-read token-id))
    (lp-contract (contract-of lp-token))
    (lv-contract (contract-of lv))
    (pool (try! (get-pool token-id)))
    (lv-balance (unwrap! (contract-call? xbtc get-balance lv-contract) ERR_PANIC))
  )
    (try! (is-paused))
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (>= lv-balance (get loan-amount loan-data)) ERR_NOT_ENOUGH_LIQUIDITY)
    
    ;; a success in transfer means there were enough funds in the liquidity-vault
    (try! (contract-call? lv transfer (get loan-amount loan-data) (get funding-vault loan) xbtc))
    (try! (contract-call? .loan-v1-0 fund-loan loan-id))
    (ok (map-set pool-data token-id (merge pool { principal-out: (+ (get loan-amount loan-data) (get principal-out pool)) } )))
  )
)

;; reverse the effects of fund-loan, send funds from the funding vault to the liquidity vault
;;
;; @returns true
;;
;; @param loan-id: id of loan being funded
;; @param lp-token: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount used to fund the loan request
(define-public (unwind (loan-id uint) (lp-token <lp-token>) (token-id uint) (fv <v>) (amount uint) (xbtc <ft>))
  (let (
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    ;; (loan-data (contract-call? .loan-v1-0 get-loan-read token-id))
    (lp-contract (contract-of lp-token))
    (fv-contract (contract-of fv))
    (pool (try! (get-pool token-id)))
    (returned-funds (try! (contract-call? .loan-v1-0 unwind loan-id)))
  )
    (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (try! (contract-call? fv transfer returned-funds (get liquidity-vault pool) xbtc))
    (ok (map-set pool-data token-id (merge pool { principal-out: (- (get principal-out pool) returned-funds) } )))
  )
)

;; loan-id -> lp-token
(define-map loans uint { lp-token: principal, token-id: uint, funding-vault: principal })

;; is called from the suppleir interface so that it can be withdrawn through the bridge protocol
;; xbtc funds are sent back to the user after a withdrawal cooldown period
;;
;; @returns delta change in funds balance
;;
;; @param lp-token: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount being withdrawn
;; @param ft: id of loan being funded
(define-public (withdraw (lp-token <lp-token>) (token-id uint) (lv <lv>) (amount uint) (caller principal) (xbtc <ft>))
  (let (
    ;; (recipient contract-caller)
    (pool (try! (get-pool token-id)))
    (lost-funds (try! (contract-call? lp-token recognize-losses token-id caller)))
    (lv-contract (contract-of lv))
    (funds-sent-data (unwrap! (map-get? funds-sent { owner: caller, token-id: token-id }) ERR_INVALID_PRINCIPAL))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (stx-time-delta (- block-height withdrawal-signaled))
    (cycle (get cycle-length pool))
    (stx-cycle-delta (/ stx-time-delta cycle))
    (btc-cycle-delta (/ (- burn-block-height (+ (get pool-btc-start pool) (* cycle (get cycle-sent funds-sent-data)))) cycle))
    (cooldown-time (get lp-cooldown-period globals))
    )
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (>= btc-cycle-delta (get factor funds-sent-data)) ERR_FUNDS_LOCKED)
    (asserts! (>= stx-time-delta (get lp-cooldown-period globals)) ERR_COOLDOWN_ONGOING)
    (asserts! (< stx-time-delta (+ (get lp-unstake-window globals) cooldown-time)) ERR_UNSTAKE_WINDOW_EXPIRED)
    (asserts! (>= (get amount funds-sent-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)
    ;; this transfer should only happen in the bridge contract
    (try! (contract-call? lv transfer (- amount lost-funds) caller xbtc))
    ;; amount transferred is checked by the amount of lp-tokens being burned
    (print { event: "pool_withdrawal", funds-withdrawn: amount, caller: caller })
    (contract-call? lp-token burn token-id (to-precision amount) caller)
  )
)

;; LPer signaling that they will withdraw after a cooldown period
;;
;; @returns true
;;
;; @param lp-token: token contract that points to the requested pool
(define-public (signal-withdrawal (lp-token <lp-token>) (token-id uint) (amount uint))
  (let (
    (pool (try! (get-pool token-id)))
    (funds-sent-data (unwrap! (map-get? funds-sent { owner: contract-caller, token-id: token-id }) ERR_INVALID_PRINCIPAL))
  )
    (map-set funds-sent { owner: contract-caller, token-id: token-id } (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
    (ok true)
  )
)

;; LPer will withdraw zest rewards according to rewards-calc logic
;;
;; @returns true
;;
;; @param dt: token contract that points to the requested pool
;; @param rewards-calc: token contract that points to the requested pool
(define-public (withdraw-zest-rewards (token-id uint) (dtc <dtc>) (rewards-calc <rewards-calc>))
  (let (
    (commitment-rewards (try! (contract-call? dtc withdraw-cycle-rewards token-id contract-caller)))
    (passive-rewards (try! (contract-call? dtc withdraw-rewards token-id contract-caller)))
    (funds-sent-data (try! (get-funds-sent contract-caller token-id)))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (delta (- current-cycle (get cycle-claimed funds-sent-data)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC))
    (is-zp (asserts! (contract-call? .globals is-zp (contract-of dtc)) ERR_INVALID_ZP))
    (rewards (try! (contract-call? rewards-calc mint-rewards contract-caller (get factor funds-sent-data) commitment-rewards)))
  )
    (merge funds-sent-data { cycle-claimed: (get-current-cycle token-id) })
    (print { commitment: commitment-rewards, passive: passive-rewards })
    
    (ok commitment-rewards)
  )
)

(define-public (withdraw-rewards (lp-token <lp-token>) (token-id uint) (lv <lv>) (xbtc <ft>))
  (let (
    (withdrawn-funds (try! (contract-call? lp-token withdraw-rewards token-id contract-caller)))
  )
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (try! (contract-call? lv transfer withdrawn-funds contract-caller xbtc))
    (ok withdrawn-funds)
  )
)

;; called by the the pool delegate before completing the rollover process
;;
;; @restricted pool delegate
;; @returns true
;;
;; @param loan-id: id of loan being paid for
;; @param lp-token: lp-token of pool associated to loan
;; @param lv: contract trait holding the liquid funds in the pool
(define-public (accept-rollover (loan-id uint) (lp-token <lp-token>) (token-id uint) (lv <lv>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (loan-data (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (rollover-data (try! (contract-call? .loan-v1-0 get-rollover loan-id)))
    (lp-contract (contract-of lp-token))
    (current-amount (get loan-amount loan-data))
    (req-amount (get new-amount rollover-data))
  )
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (contract-of lp-token) (get lp-token loan)) ERR_INVALID_LP)

    (if (> req-amount current-amount)
      (try! (fund-loan loan-id lp-token token-id lv xbtc))
      false ;; if it's less, drawdown will repay the liquidity-vault
    )

    (contract-call? .loan-v1-0 accept-rollover loan-id)
  )
)

;; Send funds to the supplier interface so it can be used to create an outbound-swap on Magic Bridge
;;
;; @restricted supplier
;; @returns the amount borrowed
;;
;; @param loan-id: id of loan being funded
;; @param height: collateral-to-xbtc amount ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param lp-token: token that holds funds and distributes them
;; @param pool-delegate: pool delegate address
;; @param delegate-fee: delegate fees in BP
(define-public (drawdown (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (caller principal) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 drawdown loan-id coll-token coll-vault fv (get liquidity-vault pool) lp-token token-id (get pool-delegate pool) (get delegate-fee pool) caller xbtc)
  )
)

;; Pool Delegate liquidites loans that have their grace period expired. collateral is swapped to xbtc to recover funds.
;; if not enough collateral, staking pool funds are withdrawn
;;
;; @restricted pool delegate
;; @returns (respone { staking-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })
;;
;; @param loan-id: id of loan being paid for
;; @param lp-token: token that holds funds and distributes them
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param cp-token: contract that accounts for losses and rewards on stakers
(define-public (liquidate-loan (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-vault <cv>) (coll-token <ft>) (cp-token <lp-token>) (xbtc <ft>))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (loan (unwrap! (map-get? loans loan-id) ERR_INVALID_LP))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate loan-id coll-vault coll-token (as-contract tx-sender))))
    (loan-amount (get loan-amount coll-recovery))
    (recovered-funds (get recovered-funds coll-recovery))
    (stakers-recovery (try! (contract-call? .cover-pool-v1-0 default-withdrawal cp-token token-id (- loan-amount recovered-funds) (as-contract tx-sender))))
  )
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token loan)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get cp-token pool) (contract-of cp-token)) ERR_INVALID_SP)

    (if (> loan-amount (+ stakers-recovery recovered-funds)) ;; if loan-amount bigger than recovered amounts, recognize losses
      (begin
        (try! (as-contract (contract-call? xbtc transfer (+ stakers-recovery recovered-funds) tx-sender (get liquidity-vault pool) none)))
        (print 
          { recognized-loss:
            (try! (as-contract (contract-call?
              cp-token
              distribute-losses
              token-id
              (- loan-amount (+ stakers-recovery recovered-funds))))) })
        (map-set pool-data token-id (merge pool { principal-out: (- (get principal-out pool) (+ stakers-recovery recovered-funds)) }))
      )
      (begin
        (if (> recovered-funds loan-amount) ;; if collateral was enough, distribute excess as rewards
          (begin
            (try! (as-contract (contract-call? xbtc transfer loan-amount tx-sender (get liquidity-vault pool) none)))
            (try! (contract-call? lp-token add-rewards token-id (- loan-amount recovered-funds)))
          )
          (begin
            (try! (as-contract (contract-call? xbtc transfer loan-amount tx-sender (get liquidity-vault pool) none)))
            (try! (contract-call? lp-token add-rewards token-id (- loan-amount (+ stakers-recovery recovered-funds))))
          )
        )
        (map-set pool-data token-id (merge pool { principal-out: (- (get principal-out pool) loan-amount) }))
      )
    )
    
    (ok { staking-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })
  )
)

;; Contract owner disables activity in the pool except for withdrawals
;;
;; @restricted contract-owner
;; @returns true
;;
;; @param lp-token: token that holds funds and distributes them
(define-public (trigger-default-mode (lp-token <lp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (ok (map-set pool-data token-id (merge pool { status: DEFAULT } )))
  )
)

;; get ok response if protocol is paused
;;
;; @returns (response is-disabled)
;;
;; @param lp-token: token that holds funds and distributes them
(define-private (is-paused)
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (if (get paused globals) ERR_PAUSED (ok true))
  )
)

(define-constant DFT_PRECISION (pow u10 u5))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION)
)

(define-read-only (dft-to-xbtc (amount uint))
  (/ amount DFT_PRECISION)
)

;; @desc sanity checks for liquidity cap
(define-read-only (lc-check (new-lc uint) (previous-lc uint))
  (and (> new-lc previous-lc))
)

(define-read-only (get-cycle-start (token-id uint))
  (get pool-stx-start (get-pool-data token-id))
)

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (get-pool-data token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height)
  )
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none
    )
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

(define-public (is-supplier-interface)
  (let (
    (globals (contract-call? .globals get-globals))
  )
    (if (is-eq contract-caller (get supplier-interface globals))
      (ok true)
      ERR_UNAUTHORIZED
    )
  )
)

;; -- onboarding liquidity-provider

(define-map liquidity-providers { token-id: uint, lp: principal} bool)

(define-public (add-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-onboarded liquidity-provider) ERR_UNAUTHORIZED)
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } true))
	)
)

(define-public (remove-liquidity-provider (token-id uint) (liquidity-provider principal))
  (begin
		(asserts! (is-contract-owner contract-caller) ERR_UNAUTHORIZED)
		(ok (map-set liquidity-providers { token-id: token-id, lp: liquidity-provider } false))
	)
)

(define-read-only (is-liquidity-provider (token-id uint) (liquidity-provider principal))
  (default-to false (map-get? liquidity-providers { token-id: token-id, lp: liquidity-provider }))
)

(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_PANIC (err u1001))
(define-constant ERR_PAUSED (err u1002))

(define-constant ERR_INVALID_SP (err u2000))
(define-constant ERR_INVALID_LP (err u2001))
(define-constant ERR_INVALID_ZP (err u2002))
(define-constant ERR_INVALID_REWARDS_CALC (err u2003))
(define-constant ERR_INVALID_LV (err u2004))
(define-constant ERR_INVALID_PAYMENT (err u2005))
(define-constant ERR_INVALID_FEES (err u2006))
(define-constant ERR_POOL_DEFAULT (err u2007))
(define-constant ERR_INVALID_LIQ (err u2008))
(define-constant ERR_INVALID_LOCKUP (err u2009))
(define-constant ERR_POOL_CLOSED (err u2010))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u2011))
(define-constant ERR_FUNDS_LOCKED (err u2012))
(define-constant ERR_SET_ALREADY_EXISTS (err u2013))
(define-constant ERR_NOT_ENOUGH_LIQUIDITY (err u2014))
(define-constant ERR_UNSTAKE_WINDOW_EXPIRED (err u2015))
(define-constant ERR_COOLDOWN_ONGOING (err u2016))
(define-constant ERR_EXCEEDED_SIGNALED_AMOUNT (err u2017))
(define-constant ERR_INVALID_XBTC (err u2018))
(define-constant ERR_INVALID_MATURITY_LENGTH (err u2019))

(define-constant ERR_INVALID_FV (err u3000))

(define-constant ERR_INVALID_VALUES (err u301))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u5007))
(define-constant ERR_INVALID_CONTRACT (err u6008))
(define-constant ERR_INVALID_PRINCIPAL (err u1001))

