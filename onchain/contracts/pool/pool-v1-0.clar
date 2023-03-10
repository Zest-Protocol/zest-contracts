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

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)

(define-constant LIMIT_TIME u999999999999999)

;; @desc Create a pool
;; @restricted contract-owner
;; @param pool-delegate: address of the pool delegate
;; @param lp: token to hold xbtc rewards for LPers
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param payment: contract containing payment and rewards distribution logic
;; @param rewards-calc: contract containing logic for calculating zest rewards
;; @param cover-fee: fees dedicated to cover-providers in BP
;; @param delegate-fee: fees dedicated to the delegate in BP
;; @param liquidity-cap: maximum amount that can be held in the liquidity vault,
;; @param cover-cap: maximum amount of cover that can be held in the cover pool
;; @param min-cycles: minimum number of cycles needed to commit,
;; @param max-maturity-length: maximum time until maturity for all loans,
;; @param liquidity-vault: contract holding the liquid funds in the pool
;; @param cp-token: token to hold zest rewards funds for cover-providers
;; @param cover-vault: principal of cover vault to hold funds available for cover,
;; @param cp-rewards-token: principal of token used to account for xbtc rewards
;; @param cp-cover-token: asset used in the cover pool
;; @param open: pool is open to public
;; @returns (response uint uint)
(define-public (create-pool
  (pool-delegate principal)
  (lp <lp-token>)
  (zp-token <dt>)
  (pay <payment>)
  (r-c <rewards-calc>)
  (cover-fee uint)
  (delegate-fee uint)
  (liquidity-cap uint)
  (cover-cap uint)
  (min-cycles uint)
  (max-maturity-length uint)
  (liquidity-vault <lv>)
  (cp <cp-token>)
  (cover-vault <lv>)
  (cp-rewards-token <dt>)
  (cp-cover-token <ft>)
  (open bool))
  (let (
    (lp-contract (contract-of lp))
    (cp-contract (contract-of cp))
    (zp-contract (contract-of zp-token))
    (payment-contract (contract-of pay))
    (rewards-contract (contract-of r-c))
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
        open: open }))
    (asserts! (contract-call? .globals is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-lp lp-contract) ERR_INVALID_LP)
    (asserts! (contract-call? .globals is-cp cp-contract) ERR_INVALID_SP)
    (asserts! (contract-call? .globals is-zp zp-contract) ERR_INVALID_ZP)
    (asserts! (contract-call? .globals is-rewards-calc rewards-contract) ERR_INVALID_REWARDS_CALC)
    (asserts! (contract-call? .globals is-liquidity-vault lv-contract) ERR_INVALID_LV)
    (asserts! (contract-call? .globals is-payment payment-contract) ERR_INVALID_PAYMENT)

    (asserts! (<= (+ cover-fee delegate-fee) u10000) ERR_INVALID_FEES)
    (asserts! (> min-cycles u0) ERR_INVALID_VALUES)

    (try! (contract-call? .cover-pool-v1-0 create-pool cp cover-vault cp-rewards-token cp-cover-token cover-cap new-pool-id open (* CYCLE u1) min-cycles))

    (try! (contract-call? .pool-data set-pool-delegate pool-delegate new-pool-id))

    (try! (contract-call? .pool-data create-pool new-pool-id data))
    (try! (contract-call? .pool-data set-last-pool-id next-id))
    
    (ok next-id)))

;; @desc get time left until withdrawal
;; @restricted contract-owner
;; @param token-id: pool id from which used wants to withdraw
;; @param sender: queried user
;; @returns (response uint uint)
(define-read-only (get-time-until-withdrawal (token-id uint) (sender principal))
  (let (
    (funds-sent-data (get-funds-sent-read sender token-id))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (cooldown-time (get lp-cooldown-period globals))
    (current-time block-height))
    (asserts! (> withdrawal-signaled u0) LIMIT_TIME)
    (if (> current-time (+ cooldown-time withdrawal-signaled))
      u0
      (- cooldown-time (- current-time withdrawal-signaled)))))

(define-public (get-funds-sent (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent owner token-id))

(define-read-only (get-funds-sent-read (owner principal) (token-id uint))
  (contract-call? .pool-data get-funds-sent-read owner token-id))

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id))

(define-read-only (get-pool-read (token-id uint))
  (contract-call? .pool-data get-pool-read token-id))

(define-read-only (get-last-pool-id (token-id uint))
  (contract-call? .pool-data get-last-pool-id))

(define-public (get-loan-pool-id (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id loan-id))

(define-read-only (get-loan-pool-id-read (loan-id uint))
  (contract-call? .pool-data get-loan-pool-id-read loan-id))

(define-read-only (is-delegate (delegate principal))
  (is-some (contract-call? .pool-data get-token-id-by-delegate delegate)))

(define-public (get-sent-funds (sender principal) (lp <lp-token>) (token-id uint))
  (contract-call? lp get-balance token-id sender))

;; -- pool setters
(define-public (set-liquidity-cap (lp <lp-token>) (token-id uint) (liquidity-cap uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { liquidity-cap: liquidity-cap })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (lc-check liquidity-cap (get liquidity-cap pool)) ERR_INVALID_LIQ)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (set-cycle-length (lp <lp-token>) (cp <cp-token>) (token-id uint) (cycle-length uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { cycle-length: cycle-length })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (> (get cycle-length pool) cycle-length) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-cycle-length cp token-id cycle-length))
    (ok true)))

(define-public (set-min-cycles (lp <lp-token>) (cp <cp-token>) (token-id uint) (min-cycles uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { min-cycles: min-cycles })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (and (< min-cycles (get min-cycles pool)) (> min-cycles u0)) ERR_INVALID_LOCKUP)

    (try! (contract-call? .cover-pool-v1-0 set-min-cycles cp token-id min-cycles))
    (ok true)))

(define-public (set-delegate-fee (lp <lp-token>) (token-id uint) (delegate-fee uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { delegate-fee: delegate-fee })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (<= (+ delegate-fee (get cover-fee pool)) u10000) ERR_INVALID_FEES)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (set-cover-fee (lp <lp-token>) (token-id uint) (cover-fee uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { cover-fee: cover-fee })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (<= (+ cover-fee (get delegate-fee pool)) u10000) ERR_INVALID_FEES)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (set-max-maturity-length (lp <lp-token>) (token-id uint) (max-maturity-length uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { max-maturity-length: max-maturity-length }))
    (day (contract-call? .globals get-day-length-default)))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (> max-maturity-length day) ERR_INVALID_MAX_MATURITY_LENGTH)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (set-open (lp <lp-token>) (cp <cp-token>) (token-id uint) (open bool))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { open: open })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (try! (contract-call? .cover-pool-v1-0 set-open cp token-id open))
    (ok true)))

(define-public (set-delegate (lp <lp-token>) (cp <cp-token>) (token-id uint) (delegate principal))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { pool-delegate: delegate })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (enable-cover (lp <lp-token>) (cp <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id))))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .cover-pool-v1-0 enable-pool cp token-id))
    (ok true)))

(define-public (disable-cover (lp <lp-token>) (cp <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id))))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .cover-pool-v1-0 disable-pool cp token-id))
    (ok true)))

;; @desc Sets status to READY and block start
;; @restricted pool-delegate
;; @param lp: principal of lp to account for xbtc rewards
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param cp: token to hold zest rewards funds for cover-providers
;; @param token-id: pool id
;; @returns (response true uint)
(define-public (finalize-pool (lp <lp-token>) (zp-token <dtc>) (cp <cp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (height block-height)
    (new-pool (merge pool { status: READY, pool-stx-start: height, pool-btc-start: burn-block-height } )))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (is-eq INIT (get status pool)) ERR_INVALID_VALUES)
    (try! (contract-call? .cover-pool-v1-0 finalize-pool cp token-id))
    (try! (contract-call? zp-token set-cycle-start token-id height))
    (try! (contract-call? .pool-data set-pool token-id new-pool))
    
    (ok true)))

(define-read-only (is-ready (token-id uint))
  (let (
    (pool (get-pool-read token-id)))
    (is-eq (get status pool) READY)))

;; @desc send the funds to the pool. if already sent funds, claim zest rewards and set
;; cycle of commitments based on previous commitment and new. 
;; @restricted supplier
;; @param lp: token to hold xbtc rewards for LPers
;; @param token-id: send funds to the selected pool
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param amount: amount being sent from the protocol
;; @param factor: multiplier to the amount of time locked
;; @param height: height of the confirmed Bitcoin tx
;; @param lv: contract holding the liquid funds in the pool
;; @param xbtc: principal of xBTC contract
;; @param rewards-calc: principal to calculate zest rewards,
;; @param caller: principal of account making the payment
;; @returns (response true uint)
(define-public (send-funds
  (lp <lp-token>)
  (token-id uint)
  (zp-token <dtc>)
  (amount uint)
  (factor uint)
  (height uint)
  (l-v <lv>)
  (xbtc <ft>)
  (r-c <rewards-calc>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lv-contract (contract-of l-v))
    (zp-contract (contract-of zp-token))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset token-id))))
    (cycle (get cycle-length pool))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (lost-dft (try! (contract-call? lp recognizable-losses-of token-id caller)))
    (sent-dft (try! (contract-call? lp get-balance token-id caller)))
    (total-amount (+ amount (- sent-dft lost-dft)))
    (new-funds-sent (unwrap-panic (get-new-factor lp zp-token caller token-id total-amount factor current-cycle r-c))))
    (try! (is-paused))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (or (get open pool) (is-liquidity-provider token-id caller)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (is-eq (get zp-token pool) zp-contract) ERR_INVALID_ZP)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (contract-call? .globals is-rewards-calc (contract-of r-c)) ERR_INVALID_REWARDS_CALC)
    (asserts! (<= (+ amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)

    (asserts! (>= factor (get min-cycles pool)) ERR_INVALID_LOCKUP)
    
    (as-contract (try! (contract-call? l-v add-asset xbtc amount token-id tx-sender)))
    
    (try! (contract-call? lp mint token-id amount caller))
    (try! (contract-call? zp-token mint token-id amount caller))
    (try! (contract-call? zp-token set-share-cycles current-cycle (+ (get factor new-funds-sent) current-cycle) token-id total-amount caller))

    (print { type: "send-funds-pool", payload: { key: { owner: caller, token-id: token-id }, new-funds-sent: new-funds-sent, amount-sent: amount } })
    (ok true)))

;; @desc allows user to recommit funds for another number of cycles
;; @restricted supplier
;; @param lp: token to hold xbtc rewards for LPers
;; @param token-id: send funds to the selected pool
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param amount: amount being sent from the protocol
;; @param factor: multiplier to the amount of time locked
;; @param height: height of the confirmed Bitcoin tx
;; @param lv: contract holding the liquid funds in the pool
;; @param xbtc: principal of xBTC contract
;; @param r-c: principal to calculate zest rewards,
;; @param caller: principal of account sending funds
;; @returns (response true uint)
(define-public (recommit-funds
  (lp <lp-token>)
  (token-id uint)
  (zp-token <dtc>)
  (amount uint)
  (factor uint)
  (height uint)
  (l-v <lv>)
  (xbtc <ft>)
  (r-c <rewards-calc>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lv-contract (contract-of l-v))
    (zp-contract (contract-of zp-token))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (lv-balance (unwrap! (try! (contract-call? l-v get-asset token-id)) ERR_PANIC))
    (lost-dft (try! (contract-call? lp recognizable-losses-of token-id caller)))
    (sent-dft (try! (contract-call? lp get-balance token-id caller)))
    (total-amount (+ amount (- sent-dft lost-dft)))
    (new-funds-sent (unwrap-panic (get-new-factor lp zp-token caller token-id total-amount factor current-cycle r-c))))
    (try! (is-paused))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (or (get open pool) (is-liquidity-provider token-id caller)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)
    (asserts! (is-eq (get zp-token pool) zp-contract) ERR_INVALID_ZP)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (contract-call? .globals is-rewards-calc (contract-of r-c)) ERR_INVALID_REWARDS_CALC)
    (asserts! (<= (+ (get principal-out pool) amount lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)

    (asserts! (>= factor (get min-cycles pool)) ERR_INVALID_LOCKUP)
    (asserts! (> (try! (get-sent-funds caller lp token-id)) u0) ERR_NO_FUNDS_IN_POOL)

    (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))
    (try! (contract-call? zp-token set-share-cycles current-cycle (+ (get factor new-funds-sent) current-cycle) token-id total-amount caller))

    (ok true)))

;; @desc gets the new commitment time based on previous commitment time and amount and 
;; new amount and time
;; @param lp: token to hold xbtc rewards for LPers
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param owner: principal of account sending funds
;; @param token-id: send funds to the selected pool
;; @param amount: amount being sent from the protocol
;; @param factor: multiplier to the amount of time locked
;; @param current-cycle: current cycle in the pool
;; @param r-c: principal to calculate zest rewards
;; @returns (response { factor: uint, current-cycle: uint, sent-at-btc: uint, sent-at-stx: uint, withdrawal-signaled: uint, last-claim-at: uint, amount: uint } uint)
(define-private (get-new-factor
  (lp <lp-token>)
  (zp-token <dtc>)
  (owner principal)
  (token-id uint)
  (amount uint)
  (factor uint)
  (current-cycle uint)
  (r-c <rewards-calc>))
  (let (
    (prev-funds (unwrap-panic (contract-call? lp get-balance token-id owner))))
    (match (get-funds-sent owner token-id)
      funds-sent-data
        (let (
            (rewards (try! (contract-call? zp-token withdraw-cycle-rewards token-id owner)))
            (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? r-c mint-rewards owner (get factor funds-sent-data) (get cycle-rewards rewards))) u0))
            (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? r-c mint-rewards-base owner (get passive-rewards rewards))) u0))
            (result (try! (contract-call? zp-token empty-commitments token-id owner))))
            (if (has-locked-funds token-id owner)
            (let (
              (prev-factor (get factor funds-sent-data))
              (cycle-at-commitment-time (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-data))))
              (commitment-left (- (+ (get factor funds-sent-data) cycle-at-commitment-time) current-cycle))

              (total-funds (+ prev-funds amount))
              (new-weight (/ (* u10000 amount) total-funds))
              (prev-weight (/ (* u10000 prev-funds) total-funds))
              (factor-sum (+ (* new-weight factor) (* prev-weight commitment-left)))

              (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000))))
              (ok { factor: new-factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: (unwrap-panic (get-cycle-at token-id block-height)), amount: u0 }))
            (ok { factor: factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: (unwrap-panic (get-cycle-at token-id block-height)), amount: u0 })))
      err-data
      (ok { factor: factor, cycle-sent: current-cycle, sent-at-btc: burn-block-height, sent-at-stx: block-height, withdrawal-signaled: u0, last-claim-at: u0, amount: u0 }))))

;; @desc get the new commitment based on previous commitment and new expected commitment
;; @param prev-funds: token to hold xbtc rewards for LPers
;; @param amount: token to hold zest rewards funds for LPers
;; @param factor: principal of account sending funds
;; @param owner: send funds to the selected pool
;; @param token-id: queried pool
;; @returns (response true uint)
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
    (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000))))
    new-factor))

;; @desc Borrower creates a loan
;; @param lp: token to hold xbtc rewards for LPers
;; @param token-id: related pool to loan
;; @param loan-amount: amount requested for the loan
;; @param asset: asset used in the loan
;; @param coll-ratio: collateral-to-xbtc amount ratio in BPS
;; @param coll-token: SIP-010 contract for collateral
;; @param apr: APR in BPS
;; @param maturity-length: time until maturity
;; @param payment-period: intervals at which payment is due
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param funding-vault: contract that holds funds before drawdown
;; @returns (response uint uint)
(define-public (create-loan
  (lp <lp-token>)
  (token-id uint)
  (loan-amount uint)
  (asset <ft>)
  (coll-ratio uint)
  (coll-token <ft>)
  (apr uint)
  (maturity-length uint)
  (payment-period uint)
  (coll-vault principal)
  (funding-vault principal))
  (let (
    (last-id (try! (contract-call? .loan-v1-0 create-loan loan-amount asset coll-ratio coll-token apr maturity-length payment-period coll-vault funding-vault tx-sender)))
    (loan { lp-token: (contract-of lp ), token-id: token-id, funding-vault: funding-vault })
    (pool (get-pool-read token-id)))
    (asserts! (contract-call? .globals is-xbtc (contract-of asset)) ERR_INVALID_XBTC)
    (asserts! (>= (get max-maturity-length pool) maturity-length) ERR_EXCEEDED_MATURITY_MAX)

    (try! (contract-call? .pool-data set-loan-to-pool last-id token-id))
    (ok last-id)))

;; @desc Pool Delegate sends funds to the funding contract in the loan.
;; @param loan-id: id of loan being funded
;; @param lp: token contract that points to the requested pool
;; @param token-id: related pool to loan
;; @param lv: contract holding the liquid funds in the pool
;; @param fv: contract holding the funds for funding the loan
;; @param xbtc: principal of xBTC contract
;; @returns (response true uint)
(define-public (fund-loan
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (l-v <lv>)
  (f-v <fv>)
  (xbtc <ft>))
  (let (
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (lp-contract (contract-of lp))
    (lv-contract (contract-of l-v))
    (fv-contract (contract-of f-v))
    (pool (try! (get-pool token-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (lv-balance (unwrap! (try! (contract-call? l-v get-asset token-id)) ERR_PANIC))
    (amount (try! (contract-call? .loan-v1-0 fund-loan loan-id)))
    (new-pool (merge pool { principal-out: (+ amount (get principal-out pool)) })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq lv-contract (get liquidity-vault pool)) ERR_INVALID_FV)
    (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_LV)
    (asserts! (>= lv-balance amount) ERR_NOT_ENOUGH_LIQUIDITY)
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)
    
    (try! (contract-call? l-v remove-asset xbtc amount token-id (as-contract tx-sender)))
    (try! (as-contract (contract-call? f-v add-asset xbtc amount loan-id tx-sender)))
    
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (try! (contract-call? .read-data loans-funded-plus))
    (ok true)))

;; @desc reverse the effects of fund-loan, send funds from the funding vault to the liquidity vault
;; @param loan-id: id of loan being funded
;; @param lp: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount used to fund the loan request
;; @returns (response true uint)
(define-public (unwind (loan-id uint) (lp <lp-token>) (token-id uint) (f-v <fv>) (l-v <lv>) (xbtc <ft>) (caller principal))
  (let (
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (lp-contract (contract-of lp))
    (fv-contract (contract-of f-v))
    (lv-contract (contract-of l-v))
    (pool (try! (get-pool token-id)))
    (returned-funds (try! (contract-call? .loan-v1-0 unwind loan-pool-id loan-id f-v l-v xbtc)))
    (new-pool (merge pool { principal-out: (- (get principal-out pool) returned-funds) })))
    (asserts! (is-eq lv-contract (get liquidity-vault pool)) ERR_INVALID_LV)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (try! (caller-is (get pool-delegate pool)))
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)

    (try! (contract-call? .read-data loans-funded-minus))

    (print { type: "unwind", payload: { key: { token-id: token-id, loan-id: loan-id } , amount: returned-funds , new-pool: new-pool } })
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (ok true)))

;; @desc is called from the suppleir interface so that it can be withdrawn through the magic protocol
;; xbtc funds are sent back to the user after a withdrawal cooldown period
;; @param lp: token contract that points to the requested pool
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param token-id: selected pool id
;; @param amount: amount being sent from the protocol
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount being withdrawn
;; @param xbtc: principal of xBTC contract
;; @param recipient: principal of account withdrawing funds
;; @returns (response true uint)
(define-public (withdraw
  (lp <lp-token>)
  (zp-token <dtc>)
  (token-id uint)
  (l-v <lv>)
  (amount uint)
  (xbtc <ft>)
  (recipient principal))
  (let (
    (pool (try! (get-pool token-id)))
    (lost-funds (try! (contract-call? lp recognize-losses token-id recipient)))
    (lv-contract (contract-of l-v))
    (funds-sent-data (try! (get-funds-sent recipient token-id)))
    (withdrawal-signaled (get withdrawal-signaled funds-sent-data))
    (globals (contract-call? .globals get-globals))
    (stx-time-delta (- block-height withdrawal-signaled))
    (cycle-length (get cycle-length pool))
    (stx-cycle-delta (/ stx-time-delta cycle-length))
    (btc-cycle-delta (/ (- burn-block-height (get sent-at-btc funds-sent-data)) cycle-length))
    (cooldown-time (get lp-cooldown-period globals))
    (unlock-time (+ (* cycle-length (get factor funds-sent-data)) (get sent-at-btc funds-sent-data)))
    (cooldown-height-end (+ (get lp-cooldown-period globals) (get withdrawal-signaled funds-sent-data)))
    (new-funds-sent (merge funds-sent-data { withdrawal-signaled: u0, amount: u0 }))
    (vault-funds (unwrap! (try! (contract-call? l-v get-asset token-id)) ERR_PANIC)))
    (try! (is-supplier-interface))

    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq (get liquidity-vault pool) lv-contract) ERR_INVALID_LV)

    (asserts! (< stx-time-delta (+ (get lp-unstake-window globals) cooldown-time)) ERR_UNSTAKE_WINDOW_EXPIRED)
    (asserts! (>= burn-block-height unlock-time) ERR_FUNDS_LOCKED)
    (asserts! (>= block-height cooldown-height-end) ERR_COOLDOWN_ONGOING)
    (asserts! (>= (get amount funds-sent-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)
    (asserts! (>= vault-funds (- amount lost-funds)) ERR_NOT_ENOUGH_LIQUIDITY)
    
    (try! (contract-call? l-v remove-asset xbtc (- amount lost-funds) token-id recipient))

    (try! (contract-call? lp burn token-id amount recipient))
    (try! (contract-call? zp-token burn token-id amount recipient))
    (try! (contract-call? .pool-data set-funds-sent recipient token-id new-funds-sent))
    (print { type: "withdraw-pool", payload: { key: { caller: recipient, token-id: token-id } , funds-withdrawn: amount } })
    (ok true)))

;; @desc caller signals at block-height the amount to withdraw
;; @param lp: token contract that points to the requested pool
;; @param token-id: pool id
;; @param amount: amount caller wants to withdraw
;; @returns (response true uint)
(define-public (signal-withdrawal (lp <lp-token>) (token-id uint) (amount uint))
  (let (
    (caller tx-sender)
    (pool (try! (get-pool token-id)))
    (funds-sent-data (try! (get-funds-sent caller token-id)))
    (new-funds-sent (merge funds-sent-data { withdrawal-signaled: block-height, amount: amount }))
    (key { owner: caller, token-id: token-id }))
    (try! (contract-call? .pool-data set-funds-sent caller token-id new-funds-sent))

    (ok true)))

;; @desc caller withdraws zest rewards according to rewards-calc logic
;; @param token-id: pool id
;; @param dtc: distribution-token contract to account for zest rewards
;; @param r-c: rewards calculation contract
;; @returns (response { zest-base-rewards: uint, zest-cycle-rewards: uint } uint)
(define-public (withdraw-zest-rewards (token-id uint) (zp <dtc>) (r-c <rewards-calc>))
  (let (
    (caller tx-sender)
    (rewards (try! (contract-call? zp withdraw-cycle-rewards token-id caller)))
    (funds-sent-data (try! (get-funds-sent caller token-id)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of r-c)) ERR_INVALID_REWARDS_CALC))
    (is-zp (asserts! (contract-call? .globals is-zp (contract-of zp)) ERR_INVALID_ZP))
    (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? r-c mint-rewards caller (get factor funds-sent-data) (get cycle-rewards rewards))) u0))
    (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? r-c mint-rewards-base caller (get passive-rewards rewards))) u0)))
    (try! (contract-call? .pool-data set-funds-sent caller token-id (merge funds-sent-data { last-claim-at : (unwrap-panic (get-current-cycle token-id)) })))
    
    (try! (contract-call? .read-data add-pool-zest-rewards-earned token-id (+ zest-base-rewards zest-cycle-rewards)))

    (ok { zest-base-rewards: zest-base-rewards, zest-cycle-rewards: zest-cycle-rewards })))

;; @desc caller withdraws xbtc rewards
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract of liquidity vault
;; @param xbtc: principal of xBTC contract
;; @param caller: principal of account withdrawing rewards
;; @returns (response { zest-base-rewards: uint, zest-cycle-rewards: uint } uint)
(define-public (withdraw-rewards (lp <lp-token>) (token-id uint) (l-v <lv>) (xbtc <ft>) (caller principal))
  (let (
    (withdrawn-funds (try! (contract-call? lp withdraw-rewards token-id caller))))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (try! (contract-call? l-v remove-asset xbtc withdrawn-funds token-id caller))

    (print { type: "withdraw-rewards", payload: { key: { token-id: token-id, owner: caller }, data: { withdrawn-funds: withdrawn-funds } } })
    (ok withdrawn-funds)))

;; @desc called by the the pool delegate before completing the rollover process
;; @restricted pool delegate
;; @param loan-id: id of loan being paid for
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param fv: funding vault address
;; @returns (response true uint)
(define-public (accept-rollover
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (l-v <lv>)
  (f-v <fv>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan-data (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (rollover-data (try! (contract-call? .loan-v1-0 get-rollover-progress loan-id)))
    (current-amount (get loan-amount loan-data))
    (req-amount (get new-amount rollover-data)))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq (contract-of l-v) (get liquidity-vault pool)) ERR_INVALID_LV)

    (if (> req-amount current-amount)
      (begin
        (try! (fund-rollover loan-id token-id l-v f-v (- req-amount current-amount) xbtc))
        (contract-call? .loan-v1-0 ready-rollover loan-id (to-int (- req-amount current-amount))))
      ;; if only agreeing on new terms, same loan amount
      (if (is-eq req-amount current-amount)
        (contract-call? .loan-v1-0 ready-rollover loan-id 0)
         ;; if it's less, have to pay back when completing rollover
        (contract-call? .loan-v1-0 ready-rollover loan-id 0)))))

;; @desc reverts the effects of accepting a rollover
;; @restricted supplier interface
;; @param loan-id: id of loan being paid for
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param lv: contract trait holding the liquid funds in the pool
;; @param recovered-amount: amount being recovered from the magic protocol
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @param caller: principal of account executing the call
;; @returns (response true uint)
(define-public (cancel-rollover
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (recovered-amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (try! (as-contract (contract-call? xbtc transfer recovered-amount tx-sender .loan-v1-0 none)))
    (try! (contract-call? .loan-v1-0 cancel-rollover loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id xbtc caller))
    (ok true)))

;; @desc sends funds to funding vault for the loan
;; @param loan-id: id of loan being paid for
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param fv: funding vault address
;; @param amount: amount sent to the funding vault
;; @param xbtc-ft: SIP-010 token to account for bitcoin sent to pools
;; @returns (response true uint)
(define-private (fund-rollover
  (loan-id uint)
  (token-id uint)
  (l-v <lv>)
  (f-v <fv>)
  (amount uint)
  (xbtc <ft>))
  (let (
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq (contract-of f-v) (get funding-vault loan)) ERR_INVALID_FV)
    (asserts! (is-eq (contract-of l-v) (get liquidity-vault pool)) ERR_INVALID_LV)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (try! (contract-call? l-v remove-asset xbtc amount token-id (as-contract tx-sender)))
    (try! (as-contract (contract-call? f-v add-asset xbtc amount loan-id tx-sender)))

    (try! (contract-call? .read-data loans-funded-plus))
    (ok true)))

;; @desc borrower rollsover the loan with new values when more funds
;; are requested
;; @param loan-id: id of loan being paid for
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (complete-rollover
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc <ft>)
  (caller principal))
  (let (
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (is-eq (contract-of f-v) (get funding-vault loan)) ERR_INVALID_FV)

    (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault f-v swap-router token-id xbtc caller)))

;; @desc borrower rollsover the loan with new values, when there is no
;; need to use the magic-protocol
;; @param loan-id: id of loan being paid for
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (complete-rollover-no-withdrawal
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 get-loan loan-id)))
    (rollover (try! (contract-call? .loan-v1-0 get-rollover-progress loan-id))))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (>= (get loan-amount loan) (get new-amount rollover)) ERR_NEED_TO_WITHDRAW_FUNDS)

    (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault f-v swap-router token-id xbtc tx-sender)))

;; @desc after funds are sent to borrower, set the new terms of the loan
;; to escrow and finalize.
;; @param loan-id: id of loan being paid for
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param token-id: pool associated to the affected loan
;; @param xbtc: SIP-010 xbtc token
;; @returns (response true uint)
(define-public (finalize-rollover (loan-id uint) (lp <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (f-v <fv>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (contract-call? .loan-v1-0 finalize-rollover loan-id coll-token coll-vault f-v token-id xbtc)))

;; @desc borrower updates status on loan to make a residual payment
;; @param loan-id: id of loan being paid for
;; @param lp: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount that is being paid
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of the caller
;; @returns (response true uint)
(define-public (make-residual-payment
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (l-v <lv>)
  (amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (liquidity-vault (get liquidity-vault pool)))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (try! (as-contract (contract-call? l-v add-asset xbtc amount token-id tx-sender)))
    (contract-call? .loan-v1-0 make-residual-payment loan-id lp token-id amount xbtc)))

;; @desc Test the drawdown process by requesting a set amount of funds
;; @restricted supplier-interface
;; @param loan-id: id of loan affected
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool associated where the funds are taken from
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: contract that holds funds before drawdown
;; @param swap-router: logic for swapping assets
;; @param xbtc: SIP-010 xbtc token
;; @param sender: principal of sender
;; @returns the amount borrowed
(define-public (drawdown-verify
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc <ft>)
  (sender principal))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 drawdown-verify loan-id coll-token coll-vault f-v lp token-id (get pool-delegate pool) (get delegate-fee pool) swap-router xbtc sender)))

;; @desc drawdowns funds from the liquidity vault to the supplier-interface
;; @restricted supplier
;; @param loan-id: id of funded loan
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param swap-router: logic for swapping assets
;; @param xbtc: SIP-010 xbtc token
;; @param sender: principal of sender
;; @returns (response uint uint)
(define-public (drawdown
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (swap-router <swap>)
  (xbtc <ft>)
  (sender principal))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) swap-router xbtc sender)))

;; @desc starts the loan after funds have been confirmed
;; @restricted supplier
;; @param loan-id: id of loan affected
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (finalize-drawdown (loan-id uint) (lp <lp-token>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (f-v <fv>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (contract-call? .loan-v1-0 finalize-drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)))

;; @desc when supplier-interface does not suceed in completeing drawdown,
;; return funds to the liquidity vault
;; @restricted supplier
;; @param loan-id: id of loan affected
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param recovered-amount: amount that is being recovered
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (cancel-drawdown
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (coll-token <ft>)
  (coll-vault <cv>)
  (f-v <fv>)
  (recovered-amount uint)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)

    (try! (as-contract (contract-call? xbtc transfer recovered-amount tx-sender .loan-v1-0 none)))
    (contract-call? .loan-v1-0 cancel-drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)))

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;; collateral is swapped to xbtc to recover funds
;; if not enough collateral, cover pool funds are withdrawn
;; @restricted pool delegate
;; @param loan-id: id of loan being liquidated
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param cover-token: asset used in the cover pool
;; @param cp: contract that accounts for losses and rewards on cover-providers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param swap-router: contract for swapping with DEX protocol
;; @returns (response { staking-pool-recovered: uint, collateral-recovery: uint } uint)
(define-public (liquidate-loan
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint)
  (l-v <lv>)
  (coll-vault <cv>)
  (coll-token <ft>)
  (cover-token <ft>)
  (cp <cp-token>)
  (cover-vault <lv>)
  (swap-router <swap>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (cover-pool (try! (contract-call? .cover-pool-v1-0 get-pool token-id)))
    (lp-contract (contract-of lp))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate loan-id coll-vault coll-token swap-router xbtc (as-contract tx-sender))))
    (loan-amount (get loan-amount coll-recovery))
    (recovered-funds (get recovered-funds coll-recovery))
    (stakers-recovery
      (if (get available cover-pool)
        (try! (contract-call? .cover-pool-v1-0 default-withdrawal cp token-id (- loan-amount recovered-funds) (as-contract tx-sender) cover-token cover-vault))
        u0)))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (if (> loan-amount (+ stakers-recovery recovered-funds)) ;; if loan-amount bigger than recovered amounts, recognize losses
      (begin
        (as-contract (try! (contract-call? l-v add-asset xbtc (+ stakers-recovery recovered-funds) token-id tx-sender)))
        (print
          { recognized-loss:
            (try! (as-contract (contract-call?
              cp
              distribute-losses
              token-id
              (- loan-amount (+ stakers-recovery recovered-funds))))) })
        (print 
          { recognized-loss-lp:
            (try! (as-contract (contract-call?
              lp
              distribute-losses
              token-id
              (- loan-amount (+ stakers-recovery recovered-funds))))) })
        (print
          { type: "liquidate-loan",
            payload: { key: { loan-id: loan-id , token-id: token-id }, data: { amount-lost: (- loan-amount (+ stakers-recovery recovered-funds))} } })

        (try! (contract-call? .pool-data set-pool token-id (merge pool { principal-out: (- (get principal-out pool) (+ stakers-recovery recovered-funds)) }))))
      (begin
        (if (> recovered-funds loan-amount) ;; if collateral was enough, distribute excess as rewards
          (begin
            (as-contract (try! (contract-call? l-v add-asset xbtc loan-amount token-id tx-sender)))
            (try! (contract-call? lp add-rewards token-id (- loan-amount recovered-funds))))
          (begin
            (as-contract (try! (contract-call? l-v add-asset xbtc loan-amount token-id tx-sender)))
            (try! (contract-call? lp add-rewards token-id (- loan-amount (+ stakers-recovery recovered-funds))))))
        (try! (contract-call? .pool-data set-pool token-id (merge pool { principal-out: (- (get principal-out pool) loan-amount) })))))
    
    (ok { staking-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })))

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;; funds are sent to governor for OTC liquidation
;; if not enough collateral, cover pool funds are withdrawn
;; @restricted governor
;; @param loan-id: id of loan being liquidated
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param cp: contract that accounts for losses and rewards on stakers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param cover-token: asset used in the cover pool
;; @param xbtc: SIP-010 xbtc token
;; @returns (response { staking-pool-recovered: uint, collateral-recovery: uint } uint)
(define-public (declare-loan-liquidated
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (cp <cp-token>)
  (cover-vault <lv>)
  (cover-token <ft>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (cover-pool (try! (contract-call? .cover-pool-v1-0 get-pool token-id)))
    (lp-contract (contract-of lp))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (coll-recovery (try! (contract-call? .loan-v1-0 liquidate-otc loan-id coll-vault coll-token xbtc tx-sender)))
    (stakers-recovery
      (if (get available cover-pool)
        (try! (contract-call? .cover-pool-v1-0 default-withdrawal-otc cp cover-vault token-id tx-sender cover-token))
        u0)))
    (try! (is-paused))
    (try! (is-governor tx-sender token-id))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    
    (ok { stakers-recovery: stakers-recovery, coll-recovery: coll-recovery })))

;; @desc Pool Delegate returns recovered funds to the pool and distributes losses
;; @restricted governor
;; @param loan-id: id of loan being liquidated
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param funds-returned: amount of funds being returned to the cover pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param xbtc-recovered: amount of xbtc recovered
;; @param cp: contract that accounts for losses and rewards on stakers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param cover-token: asset used in the cover pool
;; @param xbtc: SIP-010 xbtc token
;; @returns (response true uint)
(define-public (return-otc-liquidation
  (loan-id uint)
  (lp <lp-token>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (funds-returned uint)
  (l-v <lv>)
  (xbtc-recovered uint)
  (cp <cp-token>)
  (cover-vault <lv>)
  (cover-token <ft>)
  (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (lp-contract (contract-of lp))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-data get-loan loan-id)))
    (loan-amount (get loan-amount loan)))
    (try! (is-paused))
    (try! (is-governor tx-sender token-id))
    (asserts! (contract-call? .globals is-xbtc (contract-of xbtc)) ERR_INVALID_XBTC)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (if (>= xbtc-recovered loan-amount)
      ;; simply send funds to liquidity vault
      (try! (contract-call? l-v add-asset xbtc xbtc-recovered token-id tx-sender))
      (begin
        (try! (as-contract (contract-call? lp distribute-losses token-id (- loan-amount xbtc-recovered) )))
        (try! (contract-call? l-v add-asset xbtc xbtc-recovered token-id tx-sender))))
    (try! (contract-call? .cover-pool-v1-0 return-withdrawal-otc cp token-id tx-sender funds-returned cover-token cover-vault))
    
    (ok true)))

;; @desc Contract owner disables activity in the pool except for withdrawals
;; @restricted contract-owner
;; @param lp: token that holds funds and distributes them
;; @param token-id: pool id
;; @returns (response true uint)
(define-public (trigger-default-mode (lp <lp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { status: DEFAULT } )))
    (asserts! (is-contract-owner tx-sender) ERR_UNAUTHORIZED)
    
    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

;; @desc get ok response if protocol is paused
;; @returns (response bool uint)
(define-private (is-paused)
  (let (
    (globals (contract-call? .globals get-globals)))
    (if (get paused globals) ERR_PAUSED (ok true))))

(define-constant DFT_PRECISION (pow u10 u5))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION))

(define-read-only (dft-to-xbtc (amount uint))
  (/ amount DFT_PRECISION))

;; @desc sanity checks for liquidity cap
(define-read-only (lc-check (new-lc uint) (previous-lc uint))
  (and (> new-lc previous-lc)))

(define-read-only (get-cycle-start (token-id uint))
  (get pool-stx-start (get-pool-read token-id)))

(define-read-only (time-left-until-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-funds-sent-read owner token-id))
    (globals (contract-call? .globals get-globals))
    (unstake-window (get staker-unstake-window globals))
    (time-delta (- block-height (get withdrawal-signaled funds-sent-data)))
    (cooldown-period (get staker-cooldown-period globals)))
    (if (<= time-delta cooldown-period) (- cooldown-period time-delta) u0)))

(define-read-only (time-left-for-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-funds-sent-read owner token-id))
    (globals (contract-call? .globals get-globals))
    (unstake-window (get staker-unstake-window globals))
    (time-delta (- block-height (get withdrawal-signaled funds-sent-data)))
    (cooldown-period (get staker-cooldown-period globals)))
    ;; if cooldown-period has passed
    (if (> time-delta cooldown-period)
      ;; if we are in the unstaking window
      (if (> unstake-window (- time-delta cooldown-period))
        (some (- unstake-window (- time-delta cooldown-period)))
        none)
      none)))

(define-read-only (has-committed-funds (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner)))
    (<= current-cycle (+ commitment funds-sent-at-cycle))))

(define-read-only (funds-commitment-ends-at-height (token-id uint) (owner principal))
  (let (
    (pool (get-pool-read token-id))
    (funds-sent-data (get-funds-sent-read owner token-id))
    (commitment-start-height (get sent-at-stx funds-sent-data))
    (commitment-start-cycle (unwrap-panic (get-cycle-at token-id commitment-start-height)))
    (commitment-end-cycle (+ (get factor funds-sent-data) commitment-start-cycle))
    (commitment-end-height (+ u1 (get-height-of-cycle token-id commitment-end-cycle))))
    commitment-end-height))

(define-read-only (funds-committed-for (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner)))
    (- (+ commitment funds-sent-at-cycle) current-cycle)))

(define-read-only (time-until-commitment-ends (token-id uint) (owner principal))
  (let (
    (end-of-commitment (funds-commitment-ends-at-height token-id owner))
    (height block-height))
    (if (> height end-of-commitment) u0 (- (funds-commitment-ends-at-height token-id owner) block-height))))

(define-read-only (get-next-cycle (token-id uint))
  (+ u1 (unwrap-panic (get-current-cycle token-id))))

(define-read-only (get-next-cycle-height (token-id uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height))
    (if (>= stacks-height first-block)
      (some (+ first-block (* cycle-length (+ u1 (/ (- stacks-height first-block) cycle-length)))))
      none)))

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height))
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none)))

(define-read-only (get-height-of-cycle (token-id uint) (cycle uint))
  (let (
    (pool (get-pool-read token-id))
    (pool-start (get pool-stx-start pool))
    (cycle-length (get cycle-length pool))
    (cycle-height (+ pool-start (* cycle-length cycle))))
    cycle-height))

(define-read-only (has-locked-funds (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner)))
    (<= current-cycle (+ commitment funds-sent-at-cycle))))

(define-read-only (funds-locked-for (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-funds-sent-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get sent-at-stx funds-sent-by-owner))))
    (commitment (get factor funds-sent-by-owner)))
    (- (+ commitment funds-sent-at-cycle) current-cycle)))

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id)))
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none)))

(define-public (is-governor (caller principal) (token-id uint))
  (let (
    (resp (contract-call? .pool-data get-pool-governor caller token-id)))
    (if (default-to false resp)
      (ok true)
      ERR_UNAUTHORIZED)))

(define-public (approve-governor (governor principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-data add-pool-governor governor token-id))
    (ok true)))

(define-public (removed-governor (governor principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-data remove-pool-governor governor token-id))
    (ok true)))

(define-public (add-cover-provider (provider principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .cover-pool-v1-0 add-staker provider token-id)))

(define-public (remove-cover-provider (provider principal) (token-id uint))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .cover-pool-v1-0 remove-staker provider token-id)))

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (print { type: "set-contract-owner-pool-v1-0", payload: { owner: owner } })
    (ok (var-set contract-owner owner))))

(define-read-only (is-contract-owner (caller principal))
  (is-eq caller (var-get contract-owner)))

(define-public (is-supplier-interface)
  (let (
    (globals (contract-call? .globals get-globals)))
    (if (is-eq contract-caller (get supplier-interface globals))
      (ok true)
      ERR_UNAUTHORIZED)))

(define-public (caller-is (valid-principal principal))
  (if (is-eq tx-sender valid-principal)
    (ok true)
    ERR_UNAUTHORIZED))

;; -- onboarding liquidity-provider
(define-public (add-liquidity-provider (token-id uint) (liquidity-provider principal))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-onboarded-user-read liquidity-provider) ERR_UNAUTHORIZED)
    (contract-call? .pool-data add-liquidity-provider token-id liquidity-provider)))

(define-public (remove-liquidity-provider (token-id uint) (liquidity-provider principal))
  (let (
    (pool (try! (get-pool token-id))))
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (contract-call? .pool-data remove-liquidity-provider token-id liquidity-provider)))

(define-read-only (is-liquidity-provider (token-id uint) (liquidity-provider principal))
  (and
    (contract-call? .globals is-onboarded-user-read liquidity-provider)
    (contract-call? .pool-data is-liquidity-provider token-id liquidity-provider)))

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
