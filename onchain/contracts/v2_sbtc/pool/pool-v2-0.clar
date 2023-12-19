(impl-trait .ownable-trait.ownable-trait)

(use-trait lp-token .lp-token-trait.lp-token-trait)
;; (use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait fv .funding-vault-trait.funding-vault-trait)
(use-trait cv .coll-vault-trait.coll-vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)

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
;; @param lp-token: token to hold xbtc rewards for LPers
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
  (assets (list 128 principal))
  (pool principal)
  (lp <ft-mint-trait>)
  (pay <payment>)
  (r-c <rewards-calc>)
  (withdrawal-manager principal)
  (cover-fee uint)
  (delegate-fee uint)
  (liquidity-cap uint)
  (cover-cap uint)
  (min-cycles uint)
  (max-maturity-length uint)
  (liquidity-vault <lv>)
  (cp <lp-token>)
  (cover-vault <lv>)
  (cp-cover-token <ft>)
  (open bool)
  (pool-type (buff 1))
  )
  (let (
    (lp-contract (contract-of lp))
    (cp-contract (contract-of cp))
    (payment-contract (contract-of pay))
    (rewards-contract (contract-of r-c))
    (wm-contract withdrawal-manager)
    (lv-contract (contract-of liquidity-vault))
    (new-pool-id (contract-call? .pool-data get-last-pool-id))
    (next-id (+ new-pool-id u1))
    (data {
          pool-delegate: pool-delegate,
          assets: assets,
          pool-contract: pool,
          lp-token: lp-contract,
          payment: payment-contract,
          liquidity-vault: lv-contract,
          cp-token: cp-contract,
          rewards-calc: rewards-contract,
          withdrawal-manager: wm-contract,
          cover-fee: cover-fee,
          delegate-fee: delegate-fee,
          liquidity-cap: liquidity-cap,
          principal-out: u0,
          cycle-length: (* CYCLE u1),
          withdrawal-window: (* u2 ONE_DAY),
          min-cycles: min-cycles,
          max-maturity-length: max-maturity-length,
          pool-stx-start: u0,
          pool-btc-start: u0,
          losses: u0,
          status: INIT,
          open: open,
          pool-type: pool-type,
        }
      )
    )
    (asserts! (contract-call? .globals is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (contract-call? .globals is-lp lp-contract) ERR_INVALID_LP)
    (asserts! (contract-call? .globals is-cp cp-contract) ERR_INVALID_SP)
    (asserts! (contract-call? .globals is-rewards-calc rewards-contract) ERR_INVALID_REWARDS_CALC)
    (asserts! (contract-call? .globals is-liquidity-vault lv-contract) ERR_INVALID_LV)
    (asserts! (contract-call? .globals is-payment payment-contract) ERR_INVALID_PAYMENT)
    ;; TODO: add assets verification
    ;; (asserts! (contract-call? .globals is-asset asset-contract) ERR_INVALID_ASSET)

    (asserts! (<= (+ cover-fee delegate-fee) u10000) ERR_INVALID_FEES)
    (asserts! (> min-cycles u0) ERR_INVALID_VALUES)

    (try! (contract-call? .cover-pool-v1-0 create-pool cp cover-vault cp-cover-token cover-cap new-pool-id open (* CYCLE u1) min-cycles))

    (try! (contract-call? .pool-data set-pool-delegate pool-delegate new-pool-id))

    (try! (contract-call? .pool-data create-pool new-pool-id data))
    (try! (contract-call? .pool-data set-last-pool-id next-id))
    
    (ok new-pool-id)))

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

;; -- pool setters
(define-public (set-liquidity-cap (lp <ft-mint-trait>) (token-id uint) (liquidity-cap uint))
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

(define-public (set-cycle-length (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint) (cycle-length uint))
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

(define-public (set-withdrawal-window (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint) (withdrawal-window uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { withdrawal-window: withdrawal-window })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (> (get withdrawal-window pool) ONE_DAY) ERR_INVALID_LOCKUP)

    (ok true)))

(define-public (set-min-cycles (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint) (min-cycles uint))
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

(define-public (set-delegate-fee (lp <ft-mint-trait>) (token-id uint) (delegate-fee uint))
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

(define-public (set-cover-fee (lp <ft-mint-trait>) (token-id uint) (cover-fee uint))
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

(define-public (set-max-maturity-length (lp <ft-mint-trait>) (token-id uint) (max-maturity-length uint))
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

(define-public (set-open (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint) (open bool))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { open: open })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (try! (contract-call? .cover-pool-v1-0 set-open cp token-id open))
    (ok true)))

(define-public (set-delegate (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint) (delegate principal))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (new-pool (merge pool { pool-delegate: delegate })))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

(define-public (enable-cover (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id))))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)

    (try! (contract-call? .cover-pool-v1-0 enable-pool cp token-id))
    (ok true)))

(define-public (disable-cover (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint))
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
;; @param lp-token: principal of lp-token to account for xbtc rewards
;; @param zp-token: token to hold zest rewards funds for LPers
;; @param cp-token: token to hold zest rewards funds for cover-providers
;; @param token-id: pool id
;; @returns (response true uint)
(define-public (finalize-pool (lp <ft-mint-trait>) (cp <lp-token>) (token-id uint))
  (let (
    (lp-contract (contract-of lp))
    (pool (try! (get-pool token-id)))
    (height block-height)
    (new-pool (merge pool { status: READY, pool-stx-start: height, pool-btc-start: burn-block-height } )))
    (try! (caller-is (get pool-delegate pool)))
    (try! (is-paused))
    (asserts! (is-eq INIT (get status pool)) ERR_INVALID_VALUES)
    (try! (contract-call? .cover-pool-v1-0 finalize-pool cp token-id))
    (try! (contract-call? .pool-data set-pool token-id new-pool))
    
    (ok true)))

(define-read-only (is-ready (token-id uint))
  (let (
    (pool (get-pool-read token-id)))
    (is-eq (get status pool) READY)))

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
    (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000)))
    )
    new-factor
  )
)

;; @desc Borrower creates a loan
;; @param lp-token: token to hold xbtc rewards for LPers
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
  (loan-contract principal)
  (lp <ft-mint-trait>)
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
    (last-id (try! (contract-call? .loan-v1-0 create-loan loan-contract loan-amount asset coll-ratio coll-token apr maturity-length payment-period coll-vault funding-vault tx-sender)))
    (loan { lp-token: (contract-of lp ), token-id: token-id, funding-vault: funding-vault })
    (pool (get-pool-read token-id))
    )
    (asserts! (contract-call? .globals is-asset (contract-of asset)) ERR_INVALID_ASSET)
    (asserts! (>= (get max-maturity-length pool) maturity-length) ERR_EXCEEDED_MATURITY_MAX)

    (try! (contract-call? .pool-data set-loan-to-pool last-id token-id))
    (ok last-id)
  )
)

;; @desc Pool Delegate sends funds to the funding contract in the loan.
;; @param loan-id: id of loan being funded
;; @param lp-token: token contract that points to the requested pool
;; @param token-id: related pool to loan
;; @param lv: contract holding the liquid funds in the pool
;; @param fv: contract holding the funds for funding the loan
;; @param xbtc: principal of xBTC contract
;; @returns (response true uint)
(define-public (fund-loan
  (loan-id uint)
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (not (is-eq (get status pool) DEFAULT)) ERR_POOL_DEFAULT)
    (asserts! (is-eq lv-contract (get liquidity-vault pool)) ERR_INVALID_FV)
    (asserts! (is-eq fv-contract (get funding-vault loan)) ERR_INVALID_LV)
    (asserts! (>= lv-balance amount) ERR_NOT_ENOUGH_LIQUIDITY)
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)
    
    (try! (contract-call? l-v remove-asset xbtc amount token-id (as-contract tx-sender)))
    (try! (as-contract (contract-call? f-v add-asset xbtc amount loan-id tx-sender)))
    
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (ok true)))

;; @desc reverse the effects of fund-loan, send funds from the funding vault to the liquidity vault
;; @param loan-id: id of loan being funded
;; @param lp: token contract that points to the requested pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount used to fund the loan request
;; @returns (response true uint)
(define-public (unwind (loan-id uint) (lp <ft-mint-trait>) (token-id uint) (f-v <fv>) (l-v <lv>) (xbtc <ft>) (caller principal))
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (try! (caller-is (get pool-delegate pool)))
    (asserts! (is-eq token-id loan-pool-id) ERR_INVALID_LOAN_POOL_ID)

    (print { type: "unwind", payload: { key: { token-id: token-id, loan-id: loan-id } , amount: returned-funds , new-pool: new-pool } })
    (try! (contract-call? .pool-data set-pool token-id new-pool))

    (ok true)))

;; @desc caller withdraws zest rewards according to rewards-calc logic
;; @param token-id: pool id
;; @param dtc: distribution-token contract to account for zest rewards
;; @param rewards-calc: rewards calculation contract
;; @returns (response { zest-base-rewards: uint, zest-cycle-rewards: uint } uint)
(define-public (withdraw-zest-rewards (token-id uint) (r-c <rewards-calc>))
  (let (
    (caller tx-sender)
    (rewards { cycle-rewards: u1, passive-rewards: u1 })
    (funds-sent-data (try! (get-funds-sent caller token-id)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of r-c)) ERR_INVALID_REWARDS_CALC))
    (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? r-c mint-rewards caller (get factor funds-sent-data) (get cycle-rewards rewards))) u0))
    (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? r-c mint-rewards-base caller (get passive-rewards rewards))) u0)))
    (try! (contract-call? .pool-data set-funds-sent caller token-id (merge funds-sent-data { last-claim-at : (unwrap-panic (get-current-cycle token-id)) })))

    (ok { zest-base-rewards: zest-base-rewards, zest-cycle-rewards: zest-cycle-rewards })
  )
)

;; @desc called by the the pool delegate before completing the rollover process
;; @restricted pool delegate
;; @param loan-id: id of loan being paid for
;; @param lp-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param fv: funding vault address
;; @returns (response true uint)
(define-public (accept-rollover
  (loan-id uint)
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
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
;; @param lp-token: contract of token used to account for xbtc rewards
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
  (lp <ft-mint-trait>)
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
    (try! (contract-call? .loan-v1-0 cancel-rollover loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp xbtc caller))
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

    (ok true)))

;; @desc borrower rollsover the loan with new values when more funds
;; are requested
;; @param loan-id: id of loan being paid for
;; @param lp-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (complete-rollover
  (loan-id uint)
  (lp <ft-mint-trait>)
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
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (borrow-amount (try! (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault f-v swap-router xbtc caller)))
    (new-pool (merge pool { principal-out: (+ borrow-amount (get principal-out pool)) })))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (is-eq (contract-of f-v) (get funding-vault loan)) ERR_INVALID_FV)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok borrow-amount)
  )
)

;; @desc borrower rollsover the loan with new values, when there is no
;; need to use the magic-protocol
;; @param loan-id: id of loan being paid for
;; @param lp-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param swap-router: contract for swapping with DEX protocol
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (complete-rollover-no-withdrawal
  (loan-id uint)
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (>= (get loan-amount loan) (get new-amount rollover)) ERR_NEED_TO_WITHDRAW_FUNDS)

    (contract-call? .loan-v1-0 complete-rollover loan-id coll-token coll-vault f-v swap-router xbtc tx-sender)))

;; @desc after funds are sent to borrower, set the new terms of the loan
;; to escrow and finalize.
;; @param loan-id: id of loan being paid for
;; @param coll-token: collateral token SIP-010 token in the new agreement
;; @param coll-vault: collateral vault holding the collateral to be recovered
;; @param fv: funding vault address
;; @param token-id: pool associated to the affected loan
;; @param xbtc: SIP-010 xbtc token
;; @returns (response true uint)
(define-public (finalize-rollover (loan-id uint) (lp <ft-mint-trait>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (f-v <fv>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (contract-call? .loan-v1-0 finalize-rollover loan-id coll-token coll-vault f-v xbtc)))

;; @desc borrower updates status on loan to make a residual payment
;; @param loan-id: id of loan being paid for
;; @param lp-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount that is being paid
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of the caller
;; @returns (response true uint)
(define-public (make-payment
  (loan-id uint)
  (height uint)
  (pay <payment>)
  (lp <ft-mint-trait>)
  (l-v <lv>)
  (cp <lp-token>)
  (swap-router <swap>)
  (amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (pool (try! (get-pool loan-pool-id)))
    (liquidity-vault (get liquidity-vault pool))
    (transfer-response (try! (as-contract (contract-call? xbtc transfer amount tx-sender .loan-v1-0 none))))
    (pay-response (try! (contract-call? .loan-v1-0 make-payment loan-id height pay lp l-v cp swap-router amount xbtc caller)))
    (is-impaired (get is-impaired pay-response))
    (losses (if is-impaired (- (get losses pool) (get loan-amount pay-response)) (get losses pool)))
    )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)

    (if (get has-remaining-payments pay-response)
      (try! (contract-call? .pool-data set-pool loan-pool-id (merge pool { losses: losses })))
      (try! (contract-call? .pool-data set-pool loan-pool-id (merge pool { principal-out: (- (get principal-out pool) (get loan-amount pay-response)), losses: losses })))
    )
    (ok pay-response)
  )
)

;; @desc borrower updates status on loan to make a residual payment
;; @param loan-id: id of loan being paid for
;; @param lp-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param amount: amount that is being paid
;; @param xbtc: SIP-010 xbtc token
;; @param caller: principal of the caller
;; @returns (response true uint)
(define-public (make-residual-payment
  (loan-id uint)
  (lp <ft-mint-trait>)
  (token-id uint)
  (l-v <lv>)
  (amount uint)
  (xbtc <ft>)
  (caller principal))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (liquidity-vault (get liquidity-vault pool))
    (new-pool (merge pool { principal-out: (- (get principal-out pool) amount) }))
    )
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)


    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (try! (as-contract (contract-call? l-v add-asset xbtc amount token-id tx-sender)))
    (contract-call? .loan-v1-0 make-residual-payment loan-id lp amount xbtc)
  )
)

;; @desc Test the drawdown process by requesting a set amount of funds
;; @restricted supplier-interface
;; @param loan-id: id of loan affected
;; @param lp-token: token that holds funds and distributes them
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
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)

    (contract-call? .loan-v1-0 drawdown-verify loan-id coll-token coll-vault f-v lp token-id (get pool-delegate pool) (get delegate-fee pool) swap-router xbtc sender)))

;; @desc drawdowns funds from the liquidity vault to the supplier-interface
;; @restricted supplier
;; @param loan-id: id of funded loan
;; @param lp-token: token that holds funds and distributes them
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
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)

    (contract-call? .loan-v1-0 drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) swap-router xbtc sender)))

;; @desc starts the loan after funds have been confirmed
;; @restricted supplier
;; @param loan-id: id of loan affected
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (finalize-drawdown (loan-id uint) (lp <ft-mint-trait>) (token-id uint) (coll-token <ft>) (coll-vault <cv>) (f-v <fv>) (xbtc <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id))))
    (try! (is-supplier-interface))
    (try! (is-paused))
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)

    (contract-call? .loan-v1-0 finalize-drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)))

;; @desc when supplier-interface does not suceed in completeing drawdown,
;; return funds to the liquidity vault
;; @restricted supplier
;; @param loan-id: id of loan affected
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-token: SIP-010 contract for collateral
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param fv: funding vault address
;; @param recovered-amount: amount that is being recovered
;; @param xbtc: SIP-010 xbtc token
;; @returns (response uint uint)
(define-public (cancel-drawdown
  (loan-id uint)
  (lp <ft-mint-trait>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)

    (try! (as-contract (contract-call? xbtc transfer recovered-amount tx-sender .loan-v1-0 none)))
    (contract-call? .loan-v1-0 cancel-drawdown loan-id coll-token coll-vault f-v (get liquidity-vault pool) lp token-id (get pool-delegate pool) (get delegate-fee pool) xbtc)))

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;; collateral is swapped to xbtc to recover funds
;; if not enough collateral, cover pool funds are withdrawn
;; @restricted pool delegate
;; @param loan-id: id of loan being liquidated
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @param lv: contract trait holding the liquid funds in the pool
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param cover-token: asset used in the cover pool
;; @param cp-token: contract that accounts for losses and rewards on cover-providers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param swap-router: contract for swapping with DEX protocol
;; @returns (response { staking-pool-recovered: uint, collateral-recovery: uint } uint)
(define-public (liquidate-loan
  (loan-id uint)
  (lp <ft-mint-trait>)
  (token-id uint)
  (l-v <lv>)
  (coll-vault <cv>)
  (coll-token <ft>)
  (cover-token <ft>)
  (cp <lp-token>)
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
      (if (and (get available cover-pool) (< recovered-funds loan-amount))
        (try! (contract-call? .cover-pool-v1-0 default-withdrawal cp token-id (- loan-amount recovered-funds) (as-contract tx-sender) cover-token cover-vault))
        u0))
  )
    (try! (is-paused))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq tx-sender (get pool-delegate pool)) ERR_UNAUTHORIZED)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (is-eq (unwrap-panic (element-at? (get assets pool) u0)) (contract-of xbtc)) ERR_INVALID_ASSET)

    (if (> (+ stakers-recovery recovered-funds) u0) ;; if we have recovered some funds
      (as-contract (try! (contract-call? l-v add-asset xbtc (+ stakers-recovery recovered-funds) token-id tx-sender)))
      u0
    )
    
    (if (get impaired coll-recovery)
      (try! (contract-call? .pool-data set-pool token-id (merge pool {
        principal-out: (- (get principal-out pool) loan-amount),
        losses: (- (get losses pool) loan-amount) })))
      (try! (contract-call? .pool-data set-pool token-id (merge pool { principal-out: (- (get principal-out pool) loan-amount) })))
    )
    
    (ok { cover-pool-recovered: stakers-recovery, collateral-recovery: recovered-funds })
  )
)

;; @desc Pool Delegate liquidates loans that have their grace period expired.
;; funds are sent to governor for OTC liquidation
;; if not enough collateral, cover pool funds are withdrawn
;; @restricted governor
;; @param loan-id: id of loan being liquidated
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param cp-token: contract that accounts for losses and rewards on stakers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param cover-token: asset used in the cover pool
;; @param xbtc: SIP-010 xbtc token
;; @returns (response { staking-pool-recovered: uint, collateral-recovery: uint } uint)
(define-public (declare-loan-liquidated
  (loan-id uint)
  (lp <ft-mint-trait>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (cp <lp-token>)
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
        u0))
    )
    (try! (is-paused))
    (try! (is-governor tx-sender token-id))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    
    (ok { stakers-recovery: stakers-recovery, coll-recovery: coll-recovery })
  )
)

;; Impair a loan, so that losses are accounted for in the pool
;; 3 options:
;; - reverse impairment .
;; - If Borrower makes a payment, reverse impairment .
;; - Loan default, recover funds from collateral and cover
(define-public (impair-loan (token-id uint) (loan-id uint))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 impair-loan loan-id)))
    (losses (get losses pool))
    )
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (or
      (is-eq tx-sender (get pool-delegate pool))
      (try! (is-governor tx-sender token-id))) ERR_UNAUTHORIZED)

    (try! (contract-call? .pool-data set-pool token-id (merge pool { losses: (+ losses (get loan-amount loan)) })))
    (ok true)
  )
)

;; for calling an open term loan
(define-public (call-loan (token-id uint) (loan-id uint))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 call-loan loan-id)))
    (losses (get losses pool))
    )
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (or
      (is-eq tx-sender (get pool-delegate pool))
      (try! (is-governor tx-sender token-id))) ERR_UNAUTHORIZED)

    (try! (contract-call? .pool-data set-pool token-id (merge pool { losses: (+ losses (get loan-amount loan)) })))
    (ok true)))

(define-public (reverse-impaired-loan (token-id uint) (loan-id uint))
  (let (
    (pool (try! (get-pool token-id)))
    (loan-pool-id (try! (contract-call? .pool-data get-loan-pool-id loan-id)))
    (loan (try! (contract-call? .loan-v1-0 reverse-impaired-loan loan-id)))
    (new-pool (merge pool { losses: (- (get losses pool) (get loan-amount loan)) }))
    )
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)
    (asserts! (or
      (is-eq tx-sender (get pool-delegate pool))
      (try! (is-governor tx-sender token-id))) ERR_UNAUTHORIZED)

    (try! (contract-call? .pool-data set-pool token-id new-pool))
    (ok true)))

;; @desc Pool Delegate returns recovered funds to the pool and distributes losses
;; @restricted governor
;; @param loan-id: id of loan being liquidated
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @param coll-vault: contract that holds the collateral SIP-010
;; @param coll-token: the SIP-010 token being held for collateral
;; @param funds-returned: amount of funds being returned to the cover pool
;; @param lv: contract trait holding the liquid funds in the pool
;; @param xbtc-recovered: amount of xbtc recovered
;; @param cp-token: contract that accounts for losses and rewards on stakers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param cover-token: asset used in the cover pool
;; @param xbtc: SIP-010 xbtc token
;; @returns (response true uint)
(define-public (return-otc-liquidation
  (loan-id uint)
  (lp <ft-mint-trait>)
  (token-id uint) 
  (coll-vault <cv>)
  (coll-token <ft>)
  (funds-returned uint)
  (l-v <lv>)
  (xbtc-recovered uint)
  (cp <lp-token>)
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
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_ASSET)
    (asserts! (is-eq lp-contract (get lp-token pool)) ERR_INVALID_LP)
    (asserts! (is-eq (get cp-token pool) (contract-of cp)) ERR_INVALID_SP)
    (asserts! (is-eq loan-pool-id token-id) ERR_INVALID_TOKEN_ID)

    (if (>= xbtc-recovered loan-amount)
      ;; simply send funds to liquidity vault
      (try! (contract-call? l-v add-asset xbtc xbtc-recovered token-id tx-sender))
      (begin
        (try! (contract-call? .pool-data set-pool token-id (merge pool {
          principal-out: (- (get principal-out pool) loan-amount)
          })))
        (try! (contract-call? l-v add-asset xbtc xbtc-recovered token-id tx-sender))
      )
    )
    (try! (contract-call? .cover-pool-v1-0 return-withdrawal-otc cp token-id tx-sender funds-returned cover-token cover-vault))
    
    (ok true)))

;; @desc Contract owner disables activity in the pool except for withdrawals
;; @restricted contract-owner
;; @param lp-token: token that holds funds and distributes them
;; @param token-id: pool id
;; @returns (response true uint)
(define-public (trigger-default-mode (lp <ft-mint-trait>) (token-id uint))
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
  (and (> new-lc u0)))

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

(define-public (supply
  (lp <ft-mint-trait>)
  (pool-id uint)
  (l-v <lv>)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (pool (try! (get-pool pool-id)))
    ;; (shares (unwrap-panic (preview-funds-sent lp pool-id l-v asset assets)))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset pool-id))))
    (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (amount-to-mint (+ amount))
    )
    ;; TODO: check asset is correct pool asset
    ;; TODO: validate lv
    ;; TODO: Add Liquidity cap per pool
    ;; (asserts! (<= (+ current-liquidity assets) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)



    ;; transfer assets to liquidity vault
    (as-contract (try! (contract-call? l-v add-asset asset amount pool-id tx-sender)))
    ;; TODO: update accrued interest
    ;; TODO: update interest rates
    ;; TODO: update utilization rate
    (try! (contract-call? lp mint amount-to-mint owner))

    (ok true)
  )
)

(define-public (update-cumulative-indexes (pool-id uint) (liquidity-vault <lv>) (asset principal))
  (let (
    (reserve (try! (get-reserve-data pool-id asset)))
    (total-borrows (try! (get-total-borrows pool-id asset)))
  )
    (if (> total-borrows u0)
      (let (
        (cumulated-liquidity-interest
          (calculate-linear-interest
            (get current-liquidity-rate reserve)
            (get last-updated-timestamp reserve)
            pool-id
            asset
          )
        )
        (cumulated-variable-borrow-interest 
          (try!
            (calculate-compounded-interest
              (get current-variable-borrow-rate reserve)
              (get last-updated-timestamp reserve)
            )
          )
        )
        (last-variable-borrow-cumulative-index
          (* cumulated-variable-borrow-interest (get last-variable-borrow-cumulative-index reserve))
        )
      )
        (ok true)
      )
      (ok false)
    )
  )
)

(define-public (calculate-compounded-interest
  (current-liquidity-rate uint)
  (last-updated-timestamp uint)
  ;; (pool-id uint)
  ;; (asset principal)
  )
  (let (
    ;; (reserve (try! (get-reserve-data pool-id asset)))
    (delta (- block-height last-updated-timestamp))
    (rate-per-block (/ current-liquidity-rate (* u144 u365)))
  )
    (begin
      (asserts! true (err u999999))
      ;; (ok (* current-liquidity-rate delta))
      (ok (pow (+ u100000000 rate-per-block) delta))
    )
  )
)

(define-public (calculate-linear-interest
  (current-liquidity-rate uint)
  (last-updated-timestamp uint)
  (pool-id uint)
  (asset principal)
  )
  (let (
    (reserve (try! (get-reserve-data pool-id asset)))
    (delta (- block-height (get last-updated-timestamp reserve)))
  )
    (ok (* current-liquidity-rate delta))
  )
)

(define-public (get-total-borrows (pool-id uint) (asset principal))
  (let (
    (reserve (try! (get-reserve-data pool-id asset)))
  )
    (ok (+ (get total-borrows-stable reserve) (get total-borrows-variable reserve)))
  )
)

(define-public (withdraw
  (lp <ft-mint-trait>)
  (pool-id uint)
  (l-v <lv>)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (pool (try! (get-pool pool-id)))
    ;; (shares (unwrap-panic (preview-funds-sent lp pool-id l-v asset assets)))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset pool-id))))
    (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (increased-balance (try! (get-accrued-interest pool-id (contract-of asset))))
    (amount-to-burn (+ amount increased-balance))
    )
    ;; transfer assets to liquidity vault
    (as-contract (try! (contract-call? l-v remove-asset asset amount pool-id tx-sender)))
    ;; TODO: update accrued interest
    ;; TODO: update interest rates
    ;; TODO: update utilization rate
    (try! (contract-call? lp burn amount-to-burn owner))
    (ok true)
  )
)

(define-public (borrow
  (debt <ft-mint-trait>)
  (pool-id uint)
  (l-v <lv>)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (pool (try! (get-pool pool-id)))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset pool-id))))
    (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (increased-balance (try! (get-accrued-interest pool-id (contract-of asset))))
    )
    ;; remove assets from liquidity vault
    (as-contract (try! (contract-call? l-v remove-asset asset amount pool-id tx-sender)))

    ;; TODO: update interest rates
    (try! (contract-call? debt mint amount owner))
    (ok true)
  )
)

(define-public (repay
  (debt <ft-mint-trait>)
  (pool-id uint)
  (l-v <lv>)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (pool (try! (get-pool pool-id)))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset pool-id))))
    (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (increased-balance (try! (get-accrued-interest pool-id (contract-of asset))))
    )
    ;; remove assets from liquidity vault
    (as-contract (try! (contract-call? l-v add-asset asset amount pool-id tx-sender)))

    ;; TODO: update interest rates
    (try! (contract-call? debt burn amount owner))
    (ok true)
  )
)



;; calculate user-accumulated interest based on balance, total income generated by reserves
;; and last index to which the user was given
(define-public (calculate-cumulated-balance (user principal) (lp <ft-mint-trait>) (pool-id uint) (liquidity-vault <lv>) (asset principal))
  (let (
    ;; TODO: account for redirected balance
    (balance (try! (contract-call? lp get-balance user)))
    (normalized-income (try! (get-normalized-income pool-id liquidity-vault asset)))
    (user-index (try! (get-user-index user pool-id)))
  )
    (ok
      (/ (* balance normalized-income) user-index ))
  )
)

(define-public (get-normalized-income (pool-id uint) (liquidity-vault <lv>) (asset principal))
  (get-cumulated-liquidity-index pool-id liquidity-vault asset)
)

(define-public (get-cumulated-interest (pool-id uint) (liquidity-vault <lv>) (asset principal))
  (let (
    (last-cumulated-liquidity-index (get last-liquidity-cumulative-index (try! (get-reserve-data pool-id asset))))
    (current-liquidity-rate (try! (get-current-liquidity-rate pool-id liquidity-vault)))
    (delta (try! (get-delta pool-id asset)))
  )
    (ok (* current-liquidity-rate delta))
  )
)

(define-public (get-cumulated-liquidity-index (pool-id uint) (liquidity-vault <lv>) (asset principal))
  (let (
    (last-cumulated-liquidity-index (get last-liquidity-cumulative-index (try! (get-reserve-data pool-id asset))))
    (current-liquidity-rate (try! (get-current-liquidity-rate pool-id liquidity-vault)))
    (delta (try! (get-delta pool-id asset)))
  )
    (ok (* (* current-liquidity-rate delta) last-cumulated-liquidity-index))
  )
)

(define-public (get-current-liquidity-rate
  (pool-id uint)
  (liquidity-vault <lv>)
  )
  (let (
    ;; overall borrow-rate is obtained by adding stuff up
    (borrow-rate (try! (get-overall-borrow-rate-1 pool-id)))
    (utilization-rate (try! (get-utilization-rate pool-id liquidity-vault)))
  )
    (ok (* borrow-rate utilization-rate))
  )
)


(define-public (get-overall-borrow-rate-1 (pool-id uint))
  (begin
    (asserts! true (err u0))
    (ok u0)
  )
)

(define-public (get-overall-borrow-rate
  (total-borrows-stable uint)
  (total-borrows-variable uint)
  (current-variable-borrow-rate uint)
  (current-average-stable-borrow-rate uint)
  )
  (if (is-eq (+ total-borrows-stable total-borrows-variable) u0)
    (ok u0)
    (let (
      (total-borrows (+ total-borrows-stable total-borrows-variable))
      (weighted-variable-rate (mul total-borrows-variable current-variable-borrow-rate))
      (weighted-stable-rate (mul total-borrows-stable current-average-stable-borrow-rate))
      (overall-borrow-rate (div (+ weighted-variable-rate weighted-stable-rate) total-borrows))
    )
      (ok overall-borrow-rate)
    )
  )
)

(define-public (get-utilization-rate (pool-id uint) (liquidity-vault <lv>))
  (let (
    (borrows (try! (get-borrows pool-id)))
    (total-liquidity (try! (get-current-liquidity liquidity-vault pool-id)))
  )
    (ok (div borrows total-liquidity))
  )
)

(define-public (get-delta (pool-id uint) (asset principal))
  (let (
    (reserve (try! (get-reserve-data pool-id asset)))
  )
    (ok (- block-height (get last-updated-timestamp reserve)))
  )
)

(define-public (get-borrows (pool-id uint))
  (begin
    (asserts! true (err u0))
    (ok u0)
  )
)

;; RESERVE DATA

(define-map user-indexes { pool-id: uint, user: principal } uint)

;; unique-reserve-id -> reserve-data
(define-map reserve-data { pool-id: uint, asset: principal } {
    ;; yield token
    ztoken: principal,
    debt-token: principal,
    last-updated-timestamp: uint, ;; in ms

    last-liquidity-cumulative-index: uint,
    last-variable-borrow-cumulative-rate: uint, ;; in bps

    last-variable-borrow-cumulative-index: uint,

    total-borrows-variable: uint,
    total-borrows-stable: uint,

    current-liquidity-rate: uint,
    current-variable-borrow-rate: uint,
  }
)

;; INTEREST RATE CALCULATOR


(define-public (get-user-index (asset principal) (pool-id uint))
  (ok (unwrap! (map-get? user-indexes { pool-id: pool-id, user: asset}) (err u999)))
)

(define-public (get-reserve-data (pool-id uint) (asset principal))
  (ok (unwrap! (map-get? reserve-data { pool-id: pool-id, asset: asset}) (err u999)))
)

(define-public (get-interest-rate (pool-id uint) (asset principal))
  (ok (get last-variable-borrow-cumulative-rate (try! (get-reserve-data pool-id asset))))
)

(define-public (get-accrued-interest (pool-id uint) (asset principal))
  (let (
    (current-reserve-data (try! (get-reserve-data pool-id asset)))
    (last-timestamp (get last-updated-timestamp current-reserve-data))
    (current-time (get-timestamp (- block-height u1)))
    )
    (ok u0)
  )
)

(define-read-only (get-timestamp (height uint))
  (unwrap-panic (get-block-info? time block-height))
)


(define-public (get-current-liquidity (liquidity-vault <lv>) (pool-id uint))
  (let (
    (liquidity-vault-balance (default-to u0 (try! (contract-call? liquidity-vault get-asset pool-id))))
    (pool (try! (get-pool pool-id)))
    )
    (ok (+ (get principal-out pool) liquidity-vault-balance))
  )
)

(define-public (send-funds
  (lp <ft-mint-trait>)
  (pool-id uint)
  (l-v <lv>)
  (asset <ft>)
  (assets uint)
  (owner principal)
  )
  (let (
    (pool (try! (get-pool pool-id)))
    (shares (unwrap-panic (preview-funds-sent lp pool-id l-v asset assets)))
    (lv-balance (default-to u0 (try! (contract-call? l-v get-asset pool-id))))
    )
    ;; TODO: check asset is correct pool asset
    ;; TODO: validate lv
    (asserts! (<= (+ (get principal-out pool) assets lv-balance) (get liquidity-cap pool)) ERR_LIQUIDITY_CAP_EXCESS)
    (as-contract (try! (contract-call? l-v add-asset asset assets pool-id tx-sender)))
    (try! (contract-call? lp mint shares owner))
    (ok true)
  )
)

;; redeem shares
(define-public (signal-redeem (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint) (owner principal))
  (begin
    (contract-call? .withdrawal-manager signal-redeem lp token-id l-v asset shares owner)
  )
)

(define-public (remove-shares (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint) (owner principal))
  (begin
    (contract-call? .withdrawal-manager remove-shares lp token-id l-v asset shares owner)
  )
)

(define-public (redeem (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (requested-shares uint) (owner principal) (recipient principal))
  (let (
    (redeemeables (try! (contract-call? .withdrawal-manager redeem lp token-id l-v asset requested-shares owner (as-contract tx-sender))))
    )
    (try! (as-contract (contract-call? lp burn (get redeemeable-shares redeemeables) tx-sender)))
    (try! (contract-call? l-v remove-asset asset (get redeemeable-assets redeemeables) token-id recipient))
    (ok true)
  )
)

;; -- View functions
;; TODO: test when having small amount of assets remaining
(define-public (convert-to-assets (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint))
  (let (
    (shares-supply (unwrap-panic (contract-call? lp get-total-supply)))
    (assets (if (is-eq shares-supply u0) shares (/ (* shares (unwrap-panic (total-assets lp l-v token-id asset))) shares-supply))))
    (ok assets)))

(define-public (convert-to-shares (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (assets uint))
  (let (
    (shares-supply (unwrap-panic (contract-call? lp get-total-supply))))
    (ok (if (is-eq shares-supply) assets (/ (* shares-supply assets) (unwrap-panic (total-assets lp l-v token-id asset)))))))

(define-public (convert-to-exit-shares (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (assets uint))
  (let (
    (shares-supply (unwrap-panic (contract-call? lp get-total-supply)))
    ;; (losses (try! (contract-call? lp-token recognize-losses token-id recipient)))
    (losses u0)
    )
    (ok (/ (* shares-supply assets) (- (unwrap-panic (total-assets lp l-v token-id asset)) losses))))
)

(define-public (preview-funds-sent (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (assets uint))
  (convert-to-shares lp token-id l-v asset assets))

(define-public (preview-mint (lp <ft-mint-trait>) (token-id uint) (l-v <lv>) (asset <ft>) (shares uint))
  (let (
    (shares-supply (unwrap-panic (contract-call? lp get-total-supply)))
    (assets (if (is-eq shares-supply u0) shares (/ (* shares (unwrap-panic (total-assets lp l-v token-id asset))) shares-supply))))
    (ok assets)))

(define-public (total-assets (lp <ft-mint-trait>) (l-v <lv>) (token-id uint) (asset <ft>))
  (ok (default-to u0 (try! (contract-call? l-v get-asset token-id))) ))


(define-constant one-8 u100000000)
(define-constant one-3 u1000)

(define-read-only (mul (x uint) (y uint))
  (/ (+ (* x y) (/ one-8 u2)) one-8)
)

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y)
)

(define-constant seconds-in-year u31536000
  ;; (* u144 u365 u10 u60)
)

(define-constant seconds-in-block u600
  ;; (* 10 60)
)

(define-read-only (fixed-to-exp (fixed uint))
  (* fixed one-3)
)

(define-read-only (exp-to-fixed (fixed uint))
  (/ one-3 fixed)
)

(define-read-only (calculate-linear-interest-1
  (principal uint)
  (annual-rate uint)
  (duration-seconds uint)
)
  (let (
    (immediate-rate (mul annual-rate (div duration-seconds seconds-in-year)))
  )
    (mul principal immediate-rate)
  )
)

(define-read-only (calculate-continous-compounded-interest
  (principal uint)
  (annual-rate uint)
  (duration-seconds uint)
)
  (let (
    (immediate-rate (mul annual-rate (div duration-seconds seconds-in-year)))
    (e-rt (taylor-6 immediate-rate))
  )
    (mul principal e-rt)
  )
)

(define-read-only (is-odd (x uint))
  (not (is-even x))
)

(define-read-only (is-even (x uint))
  (is-eq (mod x u2) u0)
)

(define-constant e 271828182)

(define-read-only (test-this)
  (mul (* one-8 u1000) (taylor-6 (mul u5000000 u300000000)))
)

(define-constant fact_2 u200000000)
(define-constant fact_3 (mul u300000000 u200000000))
(define-constant fact_4 (mul u400000000 (mul u300000000 u200000000)))
(define-constant fact_5 (mul u500000000 (mul u400000000 (mul u300000000 u200000000))))
(define-constant fact_6 (mul u600000000 (mul u500000000 (mul u400000000 (mul u300000000 u200000000)))))

(define-read-only (x_2 (x uint)) (mul x x))
(define-read-only (x_3 (x uint)) (mul x (mul x x)))
(define-read-only (x_4 (x uint)) (mul x (mul x (mul x x))))
(define-read-only (x_5 (x uint)) (mul x (mul x (mul x (mul x x)))))
(define-read-only (x_6 (x uint)) (mul x (mul x (mul x (mul x (mul x x))))))

(define-read-only (taylor-6 (x uint))
  (+
    one-8 x
    (div (x_2 x) fact_2)
    (div (x_3 x) fact_3)
    (div (x_4 x) fact_4)
    (div (x_5 x) fact_5)
    (div (x_6 x) fact_6)
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
(define-constant ERR_INVALID_ASSET (err u8021))
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
