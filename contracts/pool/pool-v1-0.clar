(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait dt .distribution-token-trait.distribution-token-trait)
(use-trait dtc .distribution-token-cycles-trait.distribution-token-cycles-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait fv .funding-vault-trait.funding-vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(use-trait swap .swap-router-trait.swap-router-trait)

;; (define-constant CYCLE (* u14 u144))
(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

(define-constant LIMIT_TIME u999999999999999)


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
  (zp-token <dt>)
  (payment <payment>)
  (rewards-calc <rewards-calc>)
  (cover-fee uint)
  (delegate-fee uint)
  (liquidity-cap uint)
  (cover-cap uint)
  (min-cycles uint)
  (max-maturity-length uint)
  (liquidity-vault <lv>)
  (cp-token <cp-token>)
  (cover-vault <lv>)
  (cp-rewards-token <dt>)
  (cp-cover-token <ft>)
  (open bool)
  )
  (let (
    (lp-contract (contract-of lp-token))
    (cp-contract (contract-of cp-token))
    (zp-contract (contract-of zp-token))
    (payment-contract (contract-of payment))
    (rewards-contract (contract-of rewards-calc))
    (lv-contract (contract-of liquidity-vault))
    (new-pool-id (contract-call? .pool-data get-last-pool-id))
    (next-id (+ new-pool-id u1))
    (data {
        pool-delegate: pool-delegate,
        lp-token: lp-contract,
        zp-token: zp-contract,
        payment: payment-contract,
        liquidity-vault: lv-contract,
        cp-token: cp-contract,
        rewards-calc: rewards-contract,
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
      })
    ;; (globals (contract-call? .globals get-globals))
  )
    (asserts! (contract-call? .globals is-admin contract-caller) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-lp lp-contract) ERR_INVALID_LP)
    (asserts! (contract-call? .globals is-cp cp-contract) ERR_INVALID_SP)
    (asserts! (contract-call? .globals is-zp zp-contract) ERR_INVALID_ZP)
    (asserts! (contract-call? .globals is-rewards-calc rewards-contract) ERR_INVALID_REWARDS_CALC)
    (asserts! (contract-call? .globals is-liquidity-vault lv-contract) ERR_INVALID_LV)
    (asserts! (contract-call? .globals is-payment payment-contract) ERR_INVALID_PAYMENT)

    (asserts! (<= (+ cover-fee delegate-fee) u10000) ERR_INVALID_FEES)
    (asserts! (> min-cycles u0) ERR_INVALID_VALUES)

    (try! (contract-call? .cover-pool-v1-0 create-pool cp-token cover-vault cp-rewards-token cp-cover-token cover-cap new-pool-id open (* CYCLE u1) min-cycles))

    (try! (contract-call? .pool-data set-pool-delegate pool-delegate new-pool-id))

    (try! (contract-call? .pool-data create-pool new-pool-id data))
    (try! (contract-call? .pool-data set-last-pool-id next-id))
    
    (ok next-id)
  )
)

(define-read-only (get-time-until-withdrawal (token-id uint) (sender principal))
  (let (
    (funds-sent-data (get-funds-sent-read sender token-id))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (cooldown-time (get lp-cooldown-period globals))
    (current-time block-height)
  )
    (asserts! (> withdrawal-signaled u0) LIMIT_TIME)
    (if (> current-time (+ cooldown-time withdrawal-signaled))
      u0
      (- cooldown-time (- current-time withdrawal-signaled)))
  )
)

(define-public (get-funds-sent (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent owner token-id)
)

(define-read-only (get-funds-sent-read (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent-read owner token-id)
)

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id)
)

(define-read-only (get-pool-read (token-id uint))
  (contract-call? .pool-data get-pool-read token-id)
)

(define-read-only (get-last-pool-id (token-id uint))
  (contract-call? .pool-data get-last-pool-id)
)

(define-public (get-loan-pool-id (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id loan-id)
)

(define-read-only (get-loan-pool-id-read (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id-read loan-id)
)

(define-read-only (is-delegate (delegate principal))
  (is-some (contract-call? .pool-data get-token-id-by-delegate delegate))
)

;; --- pool setters

(define-public (set-liquidity-cap (lp-token <lp-token>) (token-id uint) (liquidity-cap uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { liquidity-cap: liquidity-cap }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (lc-check liquidity-cap (get liquidity-cap pool)) ERR_INVALID_LIQ)

    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (print { event: "set-liquidity-cap", pool: new-pool })

    (ok true)
  )
)

(define-public (set-cycle-length (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint) (cycle-length uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { cycle-length: cycle-length }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (> (get cycle-length pool) cycle-length) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-cycle-length cp-token token-id cycle-length))

    (print { event: "set-cycle-length", pool: new-pool })

    (ok true)
  )
)

(define-public (set-min-cycles (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint) (min-cycles uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { min-cycles: min-cycles }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (and (< min-cycles (get min-cycles pool)) (> min-cycles u0)) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-min-cycles cp-token token-id min-cycles))

    (print { event: "set-min-cycles", pool: new-pool })
    (ok true)
  )
)

(define-public (set-delegate-fee (lp-token <lp-token>) (token-id uint) (delegate-fee uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { delegate-fee: delegate-fee }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (<= (+ delegate-fee (get cover-fee pool)) u10000) ERR_INVALID_FEES)

    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (print { envet: "set-delegate-fee", pool: new-pool })
    (ok true)
  )
)

(define-public (set-cover-fee (lp-token <lp-token>) (token-id uint) (cover-fee uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { cover-fee: cover-fee }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (<= (+ cover-fee (get delegate-fee pool)) u10000) ERR_INVALID_FEES)

    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (print { event: "set-cover-fee", pool: new-pool })

    (ok true)
  )
)

(define-public (set-max-maturity-length (lp-token <lp-token>) (token-id uint) (max-maturity-length uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { max-maturity-length: max-maturity-length }))
    (day (contract-call? .globals get-day-length-default))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (> max-maturity-length day) ERR_INVALID_MAX_MATURITY_LENGTH)

    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (print { event: "set-max-maturity-length", pool: new-pool })

    (ok true)
  )
)

(define-public (set-open (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint) (open bool))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { open: open }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (try! (contract-call? .cover-pool-v1-0 set-open cp-token token-id open))

    (print { event: "set-open", pool: new-pool })
    (ok true)
  )
)

(define-public (set-delegate (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint) (delegate principal))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { pool-delegate: delegate } ))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    ;; (try! (contract-call? .cover-pool-v1-0 set-open cp-token token-id open))

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (print { event: "set-delegate", pool: new-pool })

    (ok true)
  )
)

(define-public (enable-cover (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .cover-pool-v1-0 enable-pool cp-token token-id))
    
    (ok true)
  )
)

(define-public (disable-cover (lp-token <lp-token>) (cp-token <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .cover-pool-v1-0 disable-pool cp-token token-id))
    
    (ok true)
  )
)

(define-public (finalize-pool (lp-token <lp-token>) (zp-token <dtc>) (cp-token <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp-token))
    (pool (try! (get-pool token-id)))
    (height block-height)
    (new-pool (merge pool { status: READY, pool-stx-start: height, pool-btc-start: burn-block-height } ))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (try! (contract-call? .cover-pool-v1-0 finalize-pool cp-token token-id))
    (try! (contract-call? zp-token set-cycle-start token-id height))


    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (print { event: "finalize-pool", pool: new-pool })
    (ok true)
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
(define-public (send-funds
  (lp-token <lp-token>)
  (token-id uint)
  (zp-token <dtc>)
  (amount uint)
  (factor uint)
  (height uint)
  (lv <lv>)
  (xbtc <ft>)
  (rewards-calc <rewards-calc>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lv-contract (contract-of lv))
    (zp-contract (contract-of zp-token))
    (lv-balance (default-to u0 (try! (contract-call? lv get-asset token-id))))
    (cycle (get cycle-length pool))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (lost-dft (try! (contract-call? lp-token recognizable-losses-of token-id caller)))
    (sent-dft (try! (contract-call? lp-token get-balance token-id caller)))
    (total-amount (+ amount (- sent-dft lost-dft)))
    (new-funds-sent (unwrap-panic (get-new-factor lp-token zp-token caller token-id total-amount factor current-cycle rewards-calc)))
  )
    (try! (is-paused))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (or (get open pool) (is-liquidity-provider token-id caller)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (is-eq (get zp-token pool) zp-contract) ERR_INVALID_ZP)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC)
    (asserts! (<= (+ (get principal-out pool) amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)

    (asserts! (>= factor (get min-cycles pool)) ERR_INVALID_LOCKUP)

    (try! (contract-call? .read-data add-pool-cash token-id amount))
    ;; (contract-call? .read-data get-pool-cash token-id)

    ;; bridge sends funds to the pool before executing this call
    (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))
    
    (try! (contract-call? lv add-asset xbtc amount token-id caller))
    
    (try! (contract-call? lp-token mint token-id amount caller))
    (try! (contract-call? zp-token mint token-id amount caller))
    (try! (contract-call? zp-token set-share-cycles current-cycle (+ (get factor new-funds-sent) current-cycle) token-id total-amount caller))

    (print { event: "send-funds", user: { owner: caller, token-id: token-id }, funds-sent: new-funds-sent })
    (ok true)
  )
)

(define-public (recommit-funds
  (lp-token <lp-token>)
  (token-id uint)
  (zp-token <dtc>)
  (amount uint)
  (factor uint)
  (height uint)
  (lv <lv>)
  (xbtc <ft>)
  (rewards-calc <rewards-calc>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lv-contract (contract-of lv))
    (zp-contract (contract-of zp-token))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (lv-balance (unwrap! (try! (contract-call? lv get-asset token-id)) ERR_PANIC))
    (lost-dft (try! (contract-call? lp-token recognizable-losses-of token-id caller)))
    (sent-dft (try! (contract-call? lp-token get-balance token-id caller)))
    (total-amount (+ amount (- sent-dft lost-dft)))
    (new-funds-sent (unwrap-panic (get-new-factor lp-token zp-token caller token-id total-amount factor current-cycle rewards-calc)))
  )

    (try! (is-paused))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (or (get open pool) (is-liquidity-provider token-id caller)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (is-eq (get zp-token pool) zp-contract) ERR_INVALID_ZP)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC)
    (asserts! (<= (+ (get principal-out pool) amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)

    (asserts! (>= factor (get min-cycles pool)) ERR_INVALID_LOCKUP)
    (asserts! (> (try! (get-sent-funds caller lp-token token-id)) u0) ERR_NO_FUNDS_IN_POOL)

    (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))
    (try! (contract-call? zp-token set-share-cycles current-cycle (+ (get factor new-funds-sent) current-cycle) token-id total-amount caller))

    (ok true)
  )
)

(define-public (get-sent-funds (sender principal) (lp-token <lp-token>) (token-id uint))
  (contract-call? lp-token get-balance token-id sender)
)

(define-private (get-new-factor
  (lp-token <lp-token>)
  (zp-token <dtc>)
  (owner principal)
  (token-id uint)
  (amount uint)
  (factor uint)
  (current-cycle uint)
  (rewards-calc <rewards-calc>))
  (let (
    (prev-funds (unwrap-panic (contract-call? lp-token get-balance token-id owner)))
  )
    (match (get-funds-sent owner token-id)
      funds-sent-data
        (let (
            (rewards (try! (contract-call? zp-token withdraw-cycle-rewards token-id owner)))
            (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? rewards-calc mint-rewards owner (get factor funds-sent-data) (get cycle-rewards rewards))) u0))
            (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? rewards-calc mint-rewards-base owner (get passive-rewards rewards))) u0))
            (result (try! (contract-call? zp-token empty-commitments token-id owner)))
          )
            (if (has-locked-funds token-id owner)
            (let (
              (prev-factor (get factor funds-sent-data))
              (cycle-at-commitment-time (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-data))))
              (commitment-left (- (+ (get factor funds-sent-data) cycle-at-commitment-time) current-cycle))

              (total-funds (+ prev-funds amount))
              (new-weight (/ (* u10000 amount) total-funds))
              (prev-weight (/ (* u10000 prev-funds) total-funds))
              (factor-sum (+ (* new-weight factor) (* prev-weight commitment-left)))

              (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000)))
            )
              (print { prev-funds: prev-funds, amount: amount, factor: factor })
              (print { prev-factor: prev-factor, new-factor: new-factor, cycle-at-commitment-time: cycle-at-commitment-time })
              (ok { factor: new-factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: (unwrap-panic (get-cycle-at token-id block-height)), amount: u0 })
            )
            (ok { factor: factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: (unwrap-panic (get-cycle-at token-id block-height)), amount: u0 })
          )
        )
      err-data
        (ok { factor: factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: u0, amount: u0 })
    )
  )
)

(define-read-only (calculate-new-commitment (prev-funds uint) (amount uint) (factor uint) (owner principal) (token-id uint))
  (let (
    (funds-sent-data (get-funds-sent-read owner token-id))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (prev-factor (get factor funds-sent-data))
    (cycle-at-commitment-time (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-data))))
    (commitment-left (- (+ (get factor funds-sent-data) cycle-at-commitment-time) current-cycle))
    (total-funds (+ prev-funds amount))
    (new-weight (/ (* u10000 amount) total-funds))
    (prev-weight (/ (* u10000 prev-funds) total-funds))
    (factor-sum (+ (* new-weight factor) (* prev-weight prev-factor)))
    (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000)))
  )
    new-factor
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
  (asset <ft>)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal)
  )
  (let (
    (last-id (try! (contract-call? .loan-v1-0 create-loan loan-amount asset coll-ratio coll-token apr maturity-length payment-period coll-vault funding-vault contract-caller)))
    (loan { lp-token: (contract-of lp-token ), token-id: token-id, funding-vault: funding-vault })
    (pool (get-pool-read token-id))
  )
    (asserts! (contract-call? .globals is-xbtc (contract-of asset)) ERR_INVALID_XBTC)
    (asserts! (>= (get max-maturity-length pool) maturity-length) ERR_EXCEEDED_MATURITY_MAX)

    (try! (contract-call? .pool-data set-loan-to-pool last-id token-id))

    (print { event: "create-loan", loan: loan })
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
(define-public (fund-loan
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (lv <lv>)
  (fv <fv>)
  (xbtc <ft>))
  (let (
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (lp-contract (contract-of lp-token))
    (lv-contract (contract-of lv))
    (fv-contract (contract-of fv))
    (pool (try! (get-pool token-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    ;; see balance per pool
    (lv-balance (unwrap! (try! (contract-call? lv get-asset token-id)) ERR_PANIC))
    (amount (try! (contract-call? .loan-v1-0 fund-loan loan-id)))
    (new-pool (merge pool { principal-out: (+ amount (get principal-out pool)) }))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq lv-contract (get liquidity-vault pool)) ERR_INVALID_FV)
    (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_LV)
    (asserts! (>= lv-balance amount) ERR_NOT_ENOUGH_LIQUIDITY)
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)
    
    ;; a success in transfer means there were enough funds in the liquidity-vault
    (try! (contract-call? lv remove-asset xbtc amount token-id (as-contract tx-sender)))
    (try! (as-contract (contract-call? fv add-asset xbtc amount loan-id tx-sender)))
    
    (try! (contract-call? .read-data loans-funded-plus))

    (print { event: "fund-loan", new-pool: new-pool })
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (ok true)
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
(define-public (unwind (loan-id uint) (lp-token <lp-token>) (token-id uint) (fv <v>) (xbtc <ft>))
  (let (
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (lp-contract (contract-of lp-token))
    (fv-contract (contract-of fv))
    (pool (try! (get-pool token-id)))
    (returned-funds (try! (contract-call? .loan-v1-0 unwind loan-id fv (get liquidity-vault pool) xbtc)))
    (new-pool (merge pool { principal-out: (- (get principal-out pool) returned-funds) } ))
  )
    ;; (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)

    (try! (contract-call? .read-data loans-funded-minus))

    (print { event: "unwind", new-pool: new-pool })
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (ok true)
  )
)

;; loan-id -> lp-token
;; (define-map loans uint { lp-token: principal, token-id: uint, funding-vault: principal })

;; is called from the suppleir interface so that it can be withdrawn through the bridge protocol
;; xbtc funds are sent back to the user after a withdrawal cooldown period
;;
;; @returns delta change in funds balance
;;
;; @param lp-token: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount being withdrawn
;; @param ft: id of loan being funded
(define-public (withdraw
  (lp-token <lp-token>)
  (zp-token <dtc>)
  (token-id uint)
  (lv <lv>)
  (amount uint)
  (xbtc <ft>)
  (recipient principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lost-funds (try! (contract-call? lp-token recognize-losses token-id recipient)))
    (lv-contract (contract-of lv))
    (funds-sent-data (try! (get-funds-sent recipient token-id)))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (stx-time-delta (- block-height withdrawal-signaled))
    (cycle-length (get cycle-length pool))
    (stx-cycle-delta (/ stx-time-delta cycle-length))
    ;; (btc-cycle-delta (/ (- burn-block-height (+ (get pool-btc-start pool) (* cycle (get cycle-sent funds-sent-data)))) cycle))
    (btc-cycle-delta (/ (- burn-block-height (get sent-at-btc funds-sent-data)) cycle-length))
    (cooldown-time (get lp-cooldown-period globals))
    (unlock-time (+ (* cycle-length (get factor funds-sent-data)) (get sent-at-btc funds-sent-data)))
    (cooldown-height-end (+ (get lp-cooldown-period globals) (get withdrawal-signaled funds-sent-data)))
    (vault-funds (unwrap! (try! (contract-call? lv get-asset token-id)) ERR_PANIC))
    )
    (try! (is-supplier-interface))

    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)

    ;; (asserts! (>= btc-cycle-delta (get factor funds-sent-data)) ERR_FUNDS_LOCKED)
    (asserts! (< stx-time-delta (+ (get lp-unstake-window globals) cooldown-time)) ERR_UNSTAKE_WINDOW_EXPIRED)
    (asserts! (>= burn-block-height unlock-time) ERR_FUNDS_LOCKED)
    (asserts! (>= block-height cooldown-height-end) ERR_COOLDOWN_ONGOING)
    (asserts! (>= (get amount funds-sent-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)
    (asserts! (>= vault-funds (- amount lost-funds)) ERR_NOT_ENOUGH_LIQUIDITY)
    
    (try! (contract-call? lv remove-asset xbtc (- amount lost-funds) token-id recipient))
    ;; amount transferred is checked by the amount of lp-tokens being burned

    (try! (contract-call? lp-token burn token-id amount recipient))
    (try! (contract-call? zp-token burn token-id amount recipient))

    (print { event: "withdraw", funds-withdrawn: amount, caller: recipient })
    (ok true)
  )
)

;; LPer signaling that they will withdraw after a cooldown period
;;
;; @returns true
;;
;; @param lp-token: token contract that points to the requested pool
(define-public (signal-withdrawal (lp-token <lp-token>) (token-id uint) (amount uint))
  (let (
    (caller contract-caller)
    (pool (try! (get-pool token-id)))
    (funds-sent-data (try! (get-funds-sent caller token-id)))
    (new-funds-sent (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
    (key { owner: caller, token-id: token-id })
  )
    (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))

    (print { event: "signal-withdrawal", key: key, funds-sent: new-funds-sent })
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
    (caller contract-caller)
    (rewards (try! (contract-call? dtc withdraw-cycle-rewards token-id caller)))
    (funds-sent-data (try! (get-funds-sent caller token-id)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of rewards-calc)) ERR_INVALID_REWARDS_CALC))
    (is-zp (asserts! (contract-call? .globals is-zp (contract-of dtc)) ERR_INVALID_ZP))
    (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? rewards-calc mint-rewards caller (get factor funds-sent-data) (get cycle-rewards rewards))) u0))
    (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? rewards-calc mint-rewards-base caller (get passive-rewards rewards))) u0))
  )
    (try! (contract-call? .pool-data set-funds-sent caller token-id (merge funds-sent-data { last-claim-at : (unwrap-panic (get-current-cycle token-id)) })))
    
    (try! (contract-call? .read-data add-pool-zest-rewards-earned token-id (+ zest-base-rewards zest-cycle-rewards)))
    (print rewards)

    (ok { zest-base-rewards: zest-base-rewards, zest-cycle-rewards: zest-cycle-rewards })
  )
)

(define-public (withdraw-rewards (lp-token <lp-token>) (token-id uint) (lv <lv>) (xbtc <ft>) (caller principal))
  (let (
    (withdrawn-funds (try! (contract-call? lp-token withdraw-rewards token-id caller)))
  )
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (try! (contract-call? lv remove-asset xbtc withdrawn-funds token-id caller))
    ;; (try! (contract-call? lv transfer withdrawn-funds caller xbtc))

    (print { event: "withdraw-rewards", withdrawn-funds: withdrawn-funds })
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
(define-public (accept-rollover
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (lv <lv>)
  (fv <fv>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan-data (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (rollover-data (try! (contract-call? .loan-v1-0 get-rollover-progress loan-id)))
    (current-amount (get loan-amount loan-data))
    (req-amount (get new-amount rollover-data))
  )
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq (contract-of lv) (get liquidity-vault pool)) ERR_INVALID_LV)
    ;; (asserts! (is-eq (contract-of lp-token) (get lp-token loan)) ERR_INVALID_LP)

    (if (> req-amount current-amount)
      (begin
        (try! (fund-rollover loan-id token-id lv fv (- req-amount current-amount) xbtc))
        (contract-call? .loan-v1-0 ready-rollover loan-id (to-int (- req-amount current-amount)))
      )
      ;; if only agreeing on new terms, same loan amount
      (if (is-eq req-amount current-amount)
        (contract-call? .loan-v1-0 ready-rollover loan-id 0)
         ;; if it's less, have to pay back when completing rollover
        (contract-call? .loan-v1-0 ready-rollover loan-id 0)
      )
    )
    ;; (contract-call? .loan-v1-0 accept-rollover loan-id)
  )
)

(define-public (cancel-rollover
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (fv <fv>)
  (recovered-amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
  )
    (try! (is-supplier-interface))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (try! (as-contract (contract-call? xbtc transfer recovered-amount tx-sender .loan-v1-0 none)))
    (try! (contract-call? .loan-v1-0 cancel-rollover loan-id coll-token coll-vault fv (get liquidity-vault pool) lp-token token-id xbtc caller))
    (ok true)
  )
)

(define-private (fund-rollover
  (loan-id uint)
  (token-id uint)
  (lv <lv>)
  (fv <fv>)
  (amount uint)
  (xbtc <ft>))
  (let (
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq (contract-of fv) (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (is-eq (contract-of lv) (get liquidity-vault pool)) ERR_INVALID_LV)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)


    (try! (contract-call? lv transfer amount (as-contract tx-sender) xbtc))
    (try! (as-contract (contract-call? fv add-asset xbtc amount loan-id tx-sender)))

    (try! (contract-call? .read-data loans-funded-plus))

    (ok true)
  )
)

(define-public (complete-rollover (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (swap-router <swap>) (xbtc <ft>) (caller principal))
  (let (
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (is-eq (contract-of fv) (get funding-vault loan)) ERR_INVALID_FV)

    (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault fv swap-router token-id xbtc caller)
  )
)

(define-public (complete-rollover-no-withdrawal (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (swap-router <swap>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (rollover (try! (contract-call? .loan-v1-0 get-rollover-progress loan-id)))
  )
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (>= (get loan-amount loan) (get new-amount rollover)) ERR_NEED_TO_WITHDRAW_FUNDS)

    (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault fv swap-router token-id xbtc contract-caller)
  )
)

(define-public (finalize-rollover (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (contract-call? .loan-v1-0 finalize-rollover loan-id coll-token coll-vault fv token-id xbtc)
  )
)

(define-public (make-residual-payment
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (amount uint)
  (xbtc <ft>)
  (caller principal)
  )
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (liquidity-vault (get liquidity-vault pool))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (try! (contract-call? xbtc transfer amount caller liquidity-vault none))
    (contract-call? .loan-v1-0 make-residual-payment loan-id lp-token token-id amount xbtc)
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
(define-public (drawdown (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (swap-router <swap>) (xbtc <ft>) (sender principal))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 drawdown loan-id coll-token coll-vault fv (get liquidity-vault pool) lp-token token-id (get pool-delegate pool) (get delegate-fee pool) swap-router xbtc sender)
  )
)

(define-public (finalize-drawdown (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <v>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 finalize-drawdown loan-id coll-token coll-vault fv (get liquidity-vault pool) lp-token token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)
  )
)

;; when supplier-interface does not suceed in completeing drawdown, return funds to the liquidity vault
(define-public (cancel-drawdown (loan-id uint) (lp-token <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (fv <fv>) (recovered-amount uint) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    ;; (asserts! (is-eq (get liquidity-vault pool) (contract-of lv)) ERR_INVALID_LV)

    (try! (as-contract (contract-call? xbtc transfer recovered-amount tx-sender .loan-v1-0 none)))
    (contract-call? .loan-v1-0 cancel-drawdown loan-id coll-token coll-vault fv (get liquidity-vault pool) lp-token token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)
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
(define-public (liquidate-loan
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint)
  (coll-vault <cv>)
  (coll-token <ft>)
  (cover-token <ft>)
  (cp-token <cp-token>)
  (cover-vault <lv>)
  (swap-router <swap>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (cover-pool (try! (contract-call? .cover-pool-v1-0 get-pool token-id)))
    (lp-contract (contract-of lp-token))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate loan-id coll-vault coll-token swap-router xbtc (as-contract tx-sender))))
    (loan-amount (get loan-amount coll-recovery))
    (recovered-funds (get recovered-funds coll-recovery))
    (stakers-recovery
      (if (get available cover-pool)
        (try! (contract-call? .cover-pool-v1-0 default-withdrawal cp-token token-id (- loan-amount recovered-funds) (as-contract tx-sender) cover-token cover-vault))
        u0
      )
    )
  )
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp-token)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

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
        (print { event: "liquiditate-loan", pool: (merge pool { principal-out: (- (get principal-out pool) (+ stakers-recovery recovered-funds)) }) })

        (try! (contract-call? .pool-data set-pool token-id (merge pool { principal-out: (- (get principal-out pool) (+ stakers-recovery recovered-funds)) })))
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
        (print { event: "liquidity-loan", pool: (merge pool { principal-out: (- (get principal-out pool) loan-amount) }) })

        (try! (contract-call? .pool-data set-pool token-id (merge pool { principal-out: (- (get principal-out pool) loan-amount) })))
      )
    )
    
    (ok { staking-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })
    ;; (ok { staking-pool-recovered: u0, collateral-recovery: recovered-funds })
  )
)

;; Part of the OTC liquidation
(define-public (declare-loan-liquidated
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (cp-token <cp-token>)
  (cover-vault <lv>)
  (swap-router <swap>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (cover-pool (try! (contract-call? .cover-pool-v1-0 get-pool token-id)))
    (lp-contract (contract-of lp-token))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate loan-id coll-vault coll-token swap-router xbtc (as-contract tx-sender))))
    (stakers-recovery
      (if (get available cover-pool)
        (try! (contract-call? .cover-pool-v1-0 default-withdrawal-otc cp-token cover-vault token-id contract-caller coll-token))
        u0
      )
    )
  )
    (try! (is-paused))
    (try! (is-governor contract-caller token-id))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (contract-call? .globals is-governor contract-caller) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp-token)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    
    
    (ok { stakers-recovery: stakers-recovery, coll-recovery: coll-recovery })
  )
)

;; Part of the OTC liquidation
(define-public (return-otc-liquidation
  (loan-id uint)
  (lp-token <lp-token>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (funds-returned uint)
  (cp-token <cp-token>)
  (cover-vault <lv>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (lp-contract (contract-of lp-token))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
  )
    (try! (is-paused))
    (try! (is-governor contract-caller token-id))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (contract-call? .globals is-governor contract-caller) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp-token)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)


    (try! (contract-call? .cover-pool-v1-0 return-withdrawal-otc cp-token token-id contract-caller funds-returned coll-token cover-vault))
    
    (ok true)
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
    (new-pool (merge pool { status: DEFAULT } ))
  )
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (print { event: "trigger-default-mode", pool: new-pool })
    (ok true)
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
  (get pool-stx-start (get-pool-read token-id))
)

(define-read-only (time-left-until-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-funds-sent-read owner token-id))
    (globals (contract-call? .globals get-globals))
    (unstake-window (get staker-unstake-window globals))
    (time-delta (- block-height (get withdrawal-signaled funds-sent-data)))
    (cooldown-period (get staker-cooldown-period globals))
  )
    (if (<= time-delta cooldown-period) (- cooldown-period time-delta) u0)
  )
)

(define-read-only (time-left-for-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-funds-sent-read owner token-id))
    (globals (contract-call? .globals get-globals))
    (unstake-window (get staker-unstake-window globals))
    (time-delta (- block-height (get withdrawal-signaled funds-sent-data)))
    (cooldown-period (get staker-cooldown-period globals))
  )
    ;; if cooldown-period has passed
    (if (> time-delta cooldown-period)
      ;; if we are in the unstaking window
      (if (> unstake-window (- time-delta cooldown-period))
        (some (- unstake-window (- time-delta cooldown-period)))
        none)
      none)
  )
)

(define-read-only (has-committed-funds (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner))
  )
    (<= current-cycle (+ commitment funds-sent-at-cycle))
  )
)

(define-read-only (funds-commitment-ends-at-height (token-id uint) (owner principal))
  (let (
    (pool (get-pool-read token-id))
    (funds-sent-data (get-funds-sent-read owner token-id))
    (commitment-start-height (get sent-at-stx funds-sent-data))
    (commitment-start-cycle (unwrap-panic (get-cycle-at token-id commitment-start-height)))
    (commitment-end-cycle (+ (get factor funds-sent-data) commitment-start-cycle))
    (commitment-end-height (+ u1 (get-height-of-cycle token-id commitment-end-cycle)))
  )
    commitment-end-height
  )
)

(define-read-only (funds-committed-for (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner))
  )
    (- (+ commitment funds-sent-at-cycle) current-cycle)
  )
)

(define-read-only (time-until-commitment-ends (token-id uint) (owner principal))
  (let (
    (end-of-commitment (funds-commitment-ends-at-height token-id owner))
    (height block-height)
  )
    (if (> height end-of-commitment) u0 (- (funds-commitment-ends-at-height token-id owner) block-height))
  )
)

(define-read-only (get-next-cycle (token-id uint))
  (+ u1 (unwrap-panic (get-current-cycle token-id)))
)

(define-read-only (get-next-cycle-height (token-id uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height)
  )
    (if (>= stacks-height first-block)
      (some (+ first-block (* cycle-length (+ u1 (/ (- stacks-height first-block) cycle-length)))))
      none
    )
  )
)

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (get-pool-read token-id))
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

(define-read-only (get-height-of-cycle (token-id uint) (cycle uint))
  (let (
    (pool (get-pool-read token-id))
    (pool-start (get pool-stx-start pool))
    (cycle-length (get cycle-length pool))
    (cycle-height (+ pool-start (* cycle-length cycle)))
  )
    cycle-height
  )
)

(define-read-only (has-locked-funds (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner))
  )
    (<= current-cycle (+ commitment funds-sent-at-cycle))
  )
)

(define-read-only (funds-locked-for (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner))
  )
    (- (+ commitment funds-sent-at-cycle) current-cycle)
  )
)

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
  )
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none
    )
  )
)

(define-public (is-governor (caller principal) (token-id uint))
  (let (
    (resp (contract-call? .pool-data get-pool-governor caller token-id))
  )
    (if (default-to false resp)
      (ok true)
      ERR_UNAUTHORIZED
    )
  )
)

(define-public (approve-governor (governor principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-data add-pool-governor governor token-id))
    (ok true)
  )
)

(define-public (removed-governor (governor principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-data remove-pool-governor governor token-id))
    (ok true)
  )
)

(define-public (add-cover-provider (provider principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .cover-pool-v1-0 add-staker provider token-id)
  )
)

(define-public (remove-cover-provider (provider principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .cover-pool-v1-0 remove-staker provider token-id)
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
    (print { type: "set-contract-owner-pool-v1-0", payload: { owner: owner } })
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

(define-public (caller-is (valid-principal principal))
  (if (is-eq contract-caller valid-principal)
    (ok true)
    ERR_UNAUTHORIZED
  )
)

;; -- onboarding liquidity-provider

(define-public (add-liquidity-provider (token-id uint) (liquidity-provider principal))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-onboarded-user-read liquidity-provider) ERR_UNAUTHORIZED)
    (contract-call? .pool-data add-liquidity-provider token-id liquidity-provider)
	)
)

(define-public (remove-liquidity-provider (token-id uint) (liquidity-provider principal))
  (let (
    (pool (try! (get-pool token-id)))
  )
    (asserts! (is-eq contract-caller (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .pool-data remove-liquidity-provider token-id liquidity-provider)
	)
)

(define-read-only (is-liquidity-provider (token-id uint) (liquidity-provider principal))
  (and
    (contract-call? .globals is-onboarded-user-read liquidity-provider)
    (contract-call? .pool-data is-liquidity-provider token-id liquidity-provider)
  )
)

;; ERROR START 8000
(define-constant ERR_UNAUTHORIZED (err u8000))
(define-constant ERR_PANIC (err u8001))
(define-constant ERR_PAUSED (err u8002))

(define-constant ERR_INVALID_SP (err u8003))
(define-constant ERR_INVALID_LP (err u8004))
(define-constant ERR_INVALID_ZP (err u8005))
(define-constant ERR_INVALID_REWARDS_CALC (err u8006))
(define-constant ERR_INVALID_LV (err u8007))
(define-constant ERR_INVALID_PAYMENT (err u8008))
(define-constant ERR_INVALID_FEES (err u8009))
(define-constant ERR_POOL_DEFAULT (err u8010))
(define-constant ERR_INVALID_LIQ (err u8011))
(define-constant ERR_INVALID_LOCKUP (err u8012))
(define-constant ERR_POOL_CLOSED (err u8013))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u8014))
(define-constant ERR_FUNDS_LOCKED (err u8015))
(define-constant ERR_SET_ALREADY_EXISTS (err u8016))
(define-constant ERR_NOT_ENOUGH_LIQUIDITY (err u8017))
(define-constant ERR_UNSTAKE_WINDOW_EXPIRED (err u8018))
(define-constant ERR_COOLDOWN_ONGOING (err u8019))
(define-constant ERR_EXCEEDED_SIGNALED_AMOUNT (err u8020))
(define-constant ERR_INVALID_XBTC (err u8021))
(define-constant ERR_INVALID_TOKEN_ID (err u8022))
(define-constant ERR_INVALID_LOAN_ID (err u8023))


(define-constant ERR_INVALID_FV (err u8024))

(define-constant ERR_INVALID_VALUES (err u8025))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u8026))
(define-constant ERR_INVALID_CONTRACT (err u8027))
(define-constant ERR_INVALID_PRINCIPAL (err u8027))

(define-constant ERR_EXCEEDED_MATURITY_MAX (err u8028))
(define-constant ERR_INVALID_MAX_MATURITY_LENGTH (err u8029))
(define-constant ERR_INVALID_LOAN_POOL_ID (err u8030))
(define-constant ERR_NEED_TO_WITHDRAW_FUNDS (err u8031))
(define-constant ERR_NO_FUNDS_IN_POOL (err u8032))
