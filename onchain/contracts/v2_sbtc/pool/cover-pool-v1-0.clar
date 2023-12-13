(impl-trait .ownable-trait.ownable-trait)

;; (use-trait cp-token .distribution-token-cycles-losses-trait.distribution-token-cycles-losses-trait)
(use-trait lp-token .lp-token-trait.lp-token-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)
(use-trait v .vault-trait.vault-trait)
(use-trait ft .ft-trait.ft-trait)
(use-trait payment .payment-trait.payment-trait)
(use-trait rewards-calc .rewards-calc-trait.rewards-calc-trait)

(define-data-var pool-id uint u0)

(define-constant ONE_DAY (contract-call? .globals get-day-length-default))
(define-constant CYCLE (contract-call? .globals get-cycle-length-default))

(define-constant INIT 0x00)
(define-constant READY 0x01)
(define-constant CLOSED 0x02)
(define-constant DEFAULT 0x03)
(define-constant IN_OTC_LIQUIDATION 0x04)

;; @desc creates cover pool
;; @restricted pool
;; @param cp-token: principal of the cp-token used to account for zest rewards
;; @param cover-vault: cover vault used to hold cover pool funds
;; @param cp-rewards-token: principal of token used to account for xbtc rewards
;; @param cover-token: asset used in the cover pool
;; @param capacity: maximum amount of cover that can be used
;; @param token-id: pool id
;; @param open: open to public or not
;; @param cycle-length: principal of the cp-token used to account for zest rewards
;; @param min-cycles: minimum commitment cycles to cover pool
;; @returns (response true uint)
(define-public (create-pool
  (cp <lp-token>)
  (cover-vault <lv>)
  (cover-token <ft>)
  (capacity uint)
  (token-id uint)
  (open bool)
  (cycle-length uint)
  (min-cycles uint))
  (let (
    (cp-contract (contract-of cp))
    (cover-token-contract (contract-of cover-token))
    (cover-vault-contract (contract-of cover-vault))
    (data {
      status: INIT,
      open: open,
      capacity: capacity,
      cycle-length: cycle-length,
      min-cycles: min-cycles,
      available: false,
      cp-token: cp-contract,
      pool-start: u0,
      cover-token: cover-token-contract,
      amount-in-otc-liquidation: u0,
      cover-vault: cover-vault-contract })
    )
    (try! (is-pool))
    (asserts! (contract-call? .globals is-cover-pool-token cover-token-contract) ERR_INVALID_COVER_TOKEN)
    (asserts! (contract-call? .globals is-cover-vault cover-vault-contract) ERR_INVALID_COVER_TOKEN)

    (try! (contract-call? .cover-pool-data create-pool token-id data))
    (ok true)))

;; @desc Sets status to READY and block start
;; @restricted pool
;; @param cp-token: token to hold zest rewards funds for cover-providers
;; @param token-id: pool id
;; @returns (response true uint)
(define-public (finalize-pool (cp <lp-token>) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
    (data (merge pool { status: READY })))
    (try! (is-pool))
    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok true)))

(define-public (get-pool (token-id uint))
  (contract-call? .cover-pool-data get-pool token-id))

(define-read-only (get-pool-read (token-id uint))
  (contract-call? .cover-pool-data get-pool-read token-id))

(define-public (get-sent-funds (staker principal) (token-id uint))
  (contract-call? .cover-pool-data get-sent-funds staker token-id))

(define-read-only (get-sent-funds-read (staker principal) (token-id uint))
  (contract-call? .cover-pool-data get-sent-funds-read staker token-id))

(define-read-only (get-sent-funds-optional (staker principal) (token-id uint))
  (contract-call? .cover-pool-data get-sent-funds-optional staker token-id))

(define-public (set-open (cp <lp-token>) (token-id uint) (open bool))
  (let (
    (pool (try! (get-pool token-id)))
    (data (merge pool { open: open })))
    (try! (is-pool))
    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok true)))

(define-public (enable-pool (cp <lp-token>) (token-id uint))
  (let (
    (pool (try! (get-pool token-id)))
    (height block-height)
    (data (merge pool { available: true, pool-start: height })))
    (try! (is-pool))

    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (try! (contract-call? cp set-cycle-start token-id height))

    (ok true)))

(define-public (disable-pool (cp <lp-token>) (token-id uint))
  (let (
    (cp-contract (contract-of cp))
    (pool (try! (get-pool token-id)))
    (data (merge pool (merge pool { available: false }))))
    (try! (is-pool))

    (try! (contract-call? .cover-pool-data set-pool token-id data))

    (ok true)))

(define-public (set-cycle-length (cp <lp-token>) (token-id uint) (cycle-length uint))
  (let (
    (cp-contract (contract-of cp))
    (pool (try! (get-pool token-id)))
    (data (merge pool (merge pool { cycle-length: cycle-length }))))
    (try! (is-pool))

    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok true)))

(define-public (set-min-cycles (cp <lp-token>) (token-id uint) (min-cycles uint))
  (let (
    (cp-contract (contract-of cp))
    (pool (try! (get-pool token-id)))
    (data (merge pool { min-cycles: min-cycles })))
    (try! (is-pool))

    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok true)))

;; @desc send the funds to the cover pool. if already sent funds, claim zest rewards and set
;; cycle of commitments based on previous commitment and new.
;; @param cp-token: token to account zest rewards for LPers
;; @param cover-vault: principal of cover vault to hold funds available for cover
;; @param cp-rewards-token: contract that accounts for losses and rewards on stakers
;; @param cover-token: asset used in the cover pool
;; @param token-id: send funds to the selected pool
;; @param amount: amount being sent from the protocol
;; @param cycles: multiplier to the amount of time locked
;; @param rewards-calc: principal to calculate zest rewards,
;; @param sender: principal of account sending funds
;; @returns (response true uint)
(define-public (send-funds
  (cp <lp-token>)
  (cover-vault <lv>)
  (cover-token <ft>)
  (token-id uint)
  (amount uint)
  (cycles uint)
  (r-c <rewards-calc>)
  (sender principal))
  (let (
    (pool (try! (get-pool token-id)))
    (cp-contract (contract-of cp))
    (current-cycle (unwrap-panic (get-current-cycle token-id)))
    (cover-token-contract (contract-of cover-token))
    (new-funds-sent (unwrap-panic (generate-new-cycle-length cp sender token-id amount cycles current-cycle r-c))))
    (try! (is-paused))

    (asserts! (is-eq sender tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status pool) READY) ERR_POOL_CLOSED)
    (asserts! (or (get open pool) (is-cover-provider sender token-id)) ERR_UNAUTHORIZED)
    (asserts! (get available pool) ERR_POOL_UNAVAILABLE)
    (asserts! (is-eq (get cover-token pool) cover-token-contract) ERR_INVALID_CT)
    (asserts! (is-eq cp-contract (get cp-token pool)) ERR_INVALID_CP)
    (asserts! (>= cycles (get min-cycles pool)) ERR_INVALID_CYCLES)

    (try! (contract-call? .cover-pool-data set-sent-funds sender token-id new-funds-sent))
    (try! (contract-call? cover-vault add-asset cover-token amount token-id sender))
    
    (try! (contract-call? cp mint token-id amount sender))

    (print { type: "send-funds-cover-pool", payload: { key: { owner: sender, token-id: token-id }, new-funds-sent: new-funds-sent, amount-sent: amount } })
    ;; (try! (contract-call? cp set-share-cycles current-cycle (+ (get cycles new-funds-sent) current-cycle) token-id amount sender))
    (ok new-funds-sent)
  )
)

;; @desc gets the new cycle length based on previous commitment time and amount and
;; new amount and time
;; @param cp-token: token to hold zest rewards for LPers
;; @param cp-rewards-token: token to hold xbtc rewards funds for LPers
;; @param caller: principal of account sending funds
;; @param token-id: send funds to the selected pool
;; @param amount: amount being sent from the protocol
;; @param factor: multiplier to the amount of time locked
;; @param current-cycle: current cycle in the pool
;; @param rewards-calc: principal to calculate zest rewards
;; @returns (response { start: uint, cycles: uint, withdrawal-signaled: uint, amount: uint } uint)
(define-private (generate-new-cycle-length
  (cp <lp-token>)
  (caller principal)
  (token-id uint)
  (amount uint)
  (factor uint)
  (current-cycle uint)
  (r-c <rewards-calc>))
  ;; (let 
  ;;   (
  ;;   (prev-funds (unwrap-panic (contract-call? cp-rewards-token get-balance token-id caller)))
  ;;   )
  ;;   (match (get-sent-funds-optional caller token-id)
  ;;     funds-sent-data
  ;;     (let (
  ;;         (rewards (try! (contract-call? cp withdraw-cycle-rewards token-id caller)))
  ;;         (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (try! (contract-call? r-c mint-rewards caller (get cycles funds-sent-data) (get cycle-rewards rewards))) u0))
  ;;         (zest-base-rewards (if (> (get passive-rewards rewards) u0) (try! (contract-call? r-c mint-rewards-base caller (get passive-rewards rewards))) u0))
  ;;         (result (try! (contract-call? cp empty-commitments token-id caller))))
  ;;         (if (has-committed-funds token-id caller)
  ;;           (let (
  ;;             (prev-factor (get cycles funds-sent-data))
  ;;             (cycle-at-commitment-time (unwrap-panic (get-cycle-at token-id (get start funds-sent-data))))
  ;;             (commitment-left (- (+ (get cycles funds-sent-data) cycle-at-commitment-time) current-cycle))
              
  ;;             (total-funds (+ prev-funds amount))
  ;;             (new-weight (/ (* u10000 amount) total-funds))
  ;;             (prev-weight (/ (* u10000 prev-funds) total-funds))
  ;;             (factor-sum (+ (* new-weight factor) (* prev-weight commitment-left)))
  ;;             (new-factor (if (> (/ factor-sum u10000) u1) (+ u1 (/ factor-sum u10000)) (/ factor-sum u10000)))
  ;;           )
  ;;             (ok { start: block-height, cycles: new-factor, withdrawal-signaled: u0, amount: u0 })
  ;;           )
  ;;           (ok { start: block-height, cycles: factor, withdrawal-signaled: u0, amount: u0 })
  ;;         )
  ;;       )
  ;;     (ok { start: block-height, cycles: factor, withdrawal-signaled: u0, amount: u0 })
  ;;   )
  ;; )
  (ok { start: block-height, cycles: u1, withdrawal-signaled: u0, amount: u0 })
)

(define-read-only (time-left-until-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-sent-funds-read owner token-id))
    (globals (contract-call? .globals get-globals))
    (unstake-window (get staker-unstake-window globals))
    (time-delta (- block-height (get withdrawal-signaled funds-sent-data)))
    (cooldown-period (get staker-cooldown-period globals)))
    (if (<= time-delta cooldown-period) (- cooldown-period time-delta) u0)))

(define-read-only (time-left-for-withdrawal (token-id uint) (owner principal))
  (let (
    (funds-sent-data (get-sent-funds-read owner token-id))
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
    (funds-sent-by-owner (get-sent-funds-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get start funds-sent-by-owner))))
    (commitment (get cycles funds-sent-by-owner)))
    (<= current-cycle (+ commitment funds-sent-at-cycle))))

(define-read-only (funds-committed-for (token-id uint) (owner principal))
  (let (
    (current-cycle (unwrap-panic (get-cycle-at token-id block-height)))
    (funds-sent-by-owner (get-sent-funds-read owner token-id))
    (funds-sent-at-cycle (unwrap-panic (get-cycle-at token-id (get start funds-sent-by-owner))))
    (commitment (get cycles funds-sent-by-owner)))
    (- (+ commitment funds-sent-at-cycle) current-cycle)))

(define-read-only (funds-commitment-ends-at-height (token-id uint) (owner principal))
  (let (
    (pool (get-pool-read token-id))
    (funds-sent (get-sent-funds-read owner token-id))
    (commitment-start-height (get start funds-sent))
    (commitment-start-cycle (unwrap-panic (get-cycle-at token-id commitment-start-height)))
    (commitment-end-cycle (+ (get cycles funds-sent) commitment-start-cycle))
    (commitment-end-height (+ u1 (get-height-of-cycle token-id commitment-end-cycle))))
    commitment-end-height))

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

(define-read-only (get-height-of-cycle (token-id uint) (cycle uint))
  (let (
    (pool-data (get-pool-read token-id))
    (pool-start (get pool-start pool-data))
    (cycle-length (get cycle-length pool-data))
    (cycle-height (+ pool-start (* cycle-length cycle))))
    cycle-height))

(define-read-only (get-cycle-at (token-id uint) (stacks-height uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id)))
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none)))

(define-read-only (get-cycle-start (token-id uint))
  (get pool-start (get-pool-read token-id)))

(define-read-only (get-current-cycle (token-id uint))
  (let (
    (pool (get-pool-read token-id))
    (cycle-length (get cycle-length pool))
    (first-block (get-cycle-start token-id))
    (stacks-height block-height))
    (if (>= stacks-height first-block)
      (some (/ (- stacks-height first-block) cycle-length))
      none)))

;; @desc caller signals at block-height the amount to withdraw
;; @param cp: token contract that points to the requested pool
;; @param token-id: pool id
;; @param amount: amount caller wants to withdraw
;; @returns (response true uint)
(define-public (signal-withdrawal (cp <lp-token>) (token-id uint) (amount uint))
  (let (
    (caller tx-sender)
    (pool (try! (get-pool token-id)))
    (sent-funds-data (merge (try! (get-sent-funds caller token-id)) { withdrawal-signaled: block-height, amount: amount })))
    (try! (contract-call? .cover-pool-data set-sent-funds caller token-id sent-funds-data))
    (ok true)))

;; @desc withdraw funds after cooldown has passed
;; @param cp-token: token contract that points to the requested pool
;; @param cp-rewards-token: token to hold xbtc rewards funds for CPers
;; @param cover-token: asset used in the cover pool
;; @param token-id: selected pool id
;; @param amount: amount being sent from the protocol
;; @param cover-vault: cover vault used to hold cover pool funds
;; @returns (response true uint)
(define-public (withdraw (cp <lp-token>) (cover-token <ft>) (token-id uint) (amount uint) (cover-vault <lv>))
  (let (
    (recipient tx-sender)
    (pool (try! (get-pool token-id)))
    (sent-funds-data (try! (get-sent-funds recipient token-id)))
    (lost-funds (try! (contract-call? cp recognize-losses token-id recipient)))
    (cp-contract (contract-of cp))
    (withdrawal-time-delta (- block-height (get withdrawal-signaled sent-funds-data)))
    (globals (contract-call? .globals get-globals))
    (unlock-time (+ (* (get cycle-length pool) (get cycles sent-funds-data)) (get start sent-funds-data))))
    (asserts! (> withdrawal-time-delta (get staker-cooldown-period globals)) ERR_COOLDOWN_ONGOING)
    (asserts! (< withdrawal-time-delta (+ (get staker-cooldown-period globals) (get staker-unstake-window globals))) ERR_WINDOW_EXPIRED)
    (asserts! (> block-height unlock-time) ERR_FUNDS_LOCKED)
    (asserts! (is-eq (get cover-token pool) (contract-of cover-token)) ERR_INVALID_COLL)
    (asserts! (>= (get amount sent-funds-data) amount) ERR_EXCEEDED_SIGNALED_AMOUNT)

    (try! (contract-call? cover-vault remove-asset cover-token amount token-id recipient))
    (try! (contract-call? .cover-pool-data set-sent-funds recipient token-id (merge sent-funds-data { withdrawal-signaled: u0, amount: u0 })))

    (try! (contract-call? cp burn token-id amount recipient))

    (print { type: "withdraw-cover-pool", payload: { key: { caller: recipient, token-id: token-id } , funds-withdrawn: amount } })
    (ok true)))


;; TODO: replace cp-token functionality
(define-constant todo-cp-token { passive-rewards: u0, cycle-rewards: u0, rewards: u0 })

;; @desc caller withdraws zest rewards according to rewards-calc logic
;; @param cp-token: contract to account for zest rewards
;; @param token-id: pool id
;; @param rewards-calc: rewards calculation contract
;; @returns (response { zest-cycle-rewards: uint, zest-base-rewards: uint } uint)
(define-public (withdraw-zest-rewards (cp <lp-token>) (token-id uint) (r-c <rewards-calc>))
  (let (
    (caller tx-sender)
    ;; (rewards (try! (contract-call? cp withdraw-cycle-rewards token-id caller)))
    (sent-funds-data (try! (get-sent-funds caller token-id)))
    (is-rewards-calc (asserts! (contract-call? .globals is-rewards-calc (contract-of r-c)) ERR_INVALID_REWARDS_CALC))
    (is-cp (asserts! (contract-call? .globals is-cp (contract-of cp)) ERR_INVALID_ZP))
    (zest-cycle-rewards (if (> (get cycle-rewards todo-cp-token) u0) (try! (contract-call? r-c mint-rewards caller (get cycles sent-funds-data) (get cycle-rewards todo-cp-token))) u0))
    (zest-base-rewards (if (> (get passive-rewards todo-cp-token) u0) (try! (contract-call? r-c mint-rewards-base caller (get passive-rewards todo-cp-token))) u0)))

    (ok { zest-cycle-rewards: zest-cycle-rewards, zest-base-rewards: zest-base-rewards })
  )
)

;; @desc caller withdraws xbtc rewards
;; @param cp-rewards-token: contract of token used to account for xbtc rewards
;; @param token-id: pool id
;; @param lv: contract of liquidity vault
;; @param xbtc: principal of xBTC contract
;; @param caller: principal of account withdrawing rewards
;; @returns (response uint uint)
(define-public (withdraw-rewards (token-id uint) (l-v <lv>) (xbtc <ft>) (caller principal))
  (let (
    (withdrawn-funds u1)
    (pool (get-pool-read token-id)))
    (try! (is-supplier-interface))
    (asserts! (contract-call? .globals is-asset (contract-of xbtc)) ERR_INVALID_XBTC)

    (try! (contract-call? l-v transfer withdrawn-funds caller xbtc))
    (ok withdrawn-funds)
  )
)

;; -- ownable-trait
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-public (set-contract-owner (owner principal))
  (begin
    (try! (is-contract-owner tx-sender))
    (print { type: "set-contract-owner-cover-pool-v1-0", payload: owner })
    (ok (var-set contract-owner owner))))

(define-public (is-contract-owner (caller principal))
  (if (is-eq caller (var-get contract-owner))
    (ok true)
    ERR_UNAUTHORIZED))

(define-private (is-paused)
  (let (
    (globals (contract-call? .globals get-globals)))
    (if (get paused globals)
      ERR_PAUSED
      (ok true))))

(define-constant DFT_PRECISION (pow u10 u5))

(define-read-only (to-precision (amount uint))
  (* amount DFT_PRECISION))

;; @desc withdraws funds from the cover pool to cover for losses
;; @restricted pool
;; @param cp-token: contract that accounts for losses and rewards on cover-providers
;; @param token-id: pool id
;; @param remaining-loan-amount: amount remaining to cover
;; @param recipient: principal that will hold the recovered funds
;; @param cover-token: asset used in the cover pool
;; @param cover-vault: contract that holds the cover funds
;; @returns (response uint uint)
(define-public (default-withdrawal (cp <lp-token>) (token-id uint) (remaining-loan-amount uint) (recipient principal) (cover-token <ft>) (cover-vault <lv>))
  (let (
    (pool (try! (get-pool token-id))))
    (try! (is-pool))
    (asserts! (is-eq (contract-of cover-token) (get cover-token pool)) ERR_INVALID_CP)
    (asserts! (is-eq (contract-of cover-vault) (get cover-vault pool)) ERR_INVALID_COVER_VAULT)

    (match (try! (contract-call? cover-vault get-asset token-id))
      funds-in-pool
        (let (
          (amount-to-send (if (> remaining-loan-amount funds-in-pool) funds-in-pool remaining-loan-amount)))
          (try! (contract-call? cover-vault remove-asset cover-token amount-to-send token-id recipient))
          (ok amount-to-send)
        )
      (ok u0)
    )
  )
)

;; @desc withdraws funds from the cover pool to cover for losses.
;; sets state to IN_OTC_LIQUIDATION
;; @restricted pool
;; @param cp-token: contract that accounts for losses and rewards on cover-providers
;; @param cover-vault: contract that holds the cover funds
;; @param token-id: pool id
;; @param recipient: principal that will hold the recovered funds
;; @param cover-token: asset used in the cover pool
;; @returns (response uint uint)
(define-public (default-withdrawal-otc
  (cp <lp-token>)
  (cover-vault <lv>)
  (token-id uint)
  (recipient principal)
  (cover-token <ft>))
  (let (
    (pool (try! (get-pool token-id)))
    (funds-in-pool (unwrap-panic (try! (contract-call? cover-vault get-asset token-id))))
    (data (merge pool { status: IN_OTC_LIQUIDATION, amount-in-otc-liquidation: funds-in-pool })))
    (try! (is-pool))
    (asserts! (is-eq (get status pool) READY) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of cover-token) (get cover-token pool)) ERR_INVALID_CP)
    (asserts! (is-eq (contract-of cover-vault) (get cover-vault pool)) ERR_INVALID_COVER_VAULT)

    (try! (contract-call? cover-vault remove-asset cover-token funds-in-pool token-id recipient))

    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok funds-in-pool)))

;; @desc returns cover funds to the cover pool
;; sets state to READY
;; @restricted pool
;; @param cp-token: contract that accounts for losses and rewards on cover-providers
;; @param token-id: pool id
;; @param caller: principal that will hold the recovered funds
;; @param funds-returned: amount of funds being returned to the cover pool
;; @param cover-token: asset used in the cover pool
;; @param cover-vault: contract that holds the cover funds
;; @returns (response uint uint)
(define-public (return-withdrawal-otc
  (cp <lp-token>)
  (token-id uint)
  (caller principal)
  (funds-returned uint)
  (cover-token <ft>)
  (cover-vault <lv>))
  (let (
    (pool (try! (get-pool token-id)))
    (amount-liquidated (get amount-in-otc-liquidation pool))
    (data (merge pool { status: READY, amount-in-otc-liquidation: u0 })))
    (try! (is-pool))
    (asserts! (is-eq (get status pool) IN_OTC_LIQUIDATION) ERR_INVALID_STATUS)
    (asserts! (is-eq (contract-of cover-token) (get cover-token pool)) ERR_INVALID_COVER_TOKEN)
    (asserts! (is-eq (contract-of cover-vault) (get cover-vault pool)) ERR_INVALID_COVER_VAULT)
    (asserts! (is-eq (contract-of cp) (get cp-token pool)) ERR_INVALID_CP)

    ;; if the amount of funds being returned is bigger than the liquidated amount, just return the amout liquidated
    ;; else return what was recovered and distribute losses
    (if (>= funds-returned amount-liquidated)
      (begin
        (try! (contract-call? cover-vault add-asset cover-token amount-liquidated token-id caller)))
      (begin
        (try! (contract-call? cp distribute-losses token-id (- amount-liquidated funds-returned)))
        (try! (contract-call? cover-vault add-asset cover-token funds-returned token-id caller))))
    
    (try! (contract-call? .cover-pool-data set-pool token-id data))
    (ok true)))

(define-public (add-staker (staker principal) (token-id uint))
  (begin
		(try! (is-pool))
		(try! (contract-call? .cover-pool-data add-staker staker token-id))
    (ok true)))

(define-public (remove-staker (staker principal) (token-id uint))
  (begin
		(try! (is-pool))
		(try! (contract-call? .cover-pool-data remove-staker staker token-id))
    (ok true)))

(define-read-only (is-cover-provider (caller principal) (token-id uint))
  (contract-call? .cover-pool-data is-staker caller token-id))

(define-read-only (is-pool)
  (if (contract-call? .globals is-pool-contract contract-caller)
    (ok true)
    ERR_UNAUTHORIZED))

(define-read-only (is-supplier-interface)
  (if (contract-call? .globals is-supplier-interface contract-caller)
    (ok true)
    ERR_UNAUTHORIZED))

;; ERROR START 6000
(define-constant ERR_UNAUTHORIZED (err u6000))
(define-constant ERR_INVALID_VALUES (err u6001))
(define-constant ERR_INVALID_CP (err u6002))
(define-constant ERR_POOL_CLOSED (err u6003))
(define-constant ERR_PANIC (err u6004))
(define-constant ERR_LIQUIDITY_CAP_EXCESS (err u6005))
(define-constant ERR_FUNDS_LOCKED (err u6006))
(define-constant ERR_PAUSED (err u6007))
(define-constant ERR_GRACE_PERIOD_EXPIRED (err u6008))
(define-constant ERR_INVALID_CYCLES (err u6009))
(define-constant ERR_POOL_UNAVAILABLE (err u6010))
(define-constant ERR_INVALID_CP_REWARDS (err u6011))
(define-constant ERR_INVALID_SENDER (err u6012))
(define-constant ERR_COOLDOWN_ONGOING (err u6013))
(define-constant ERR_WINDOW_EXPIRED (err u6014))

(define-constant ERR_INVALID_XBTC (err u6015))

(define-constant ERR_INVALID_REWARDS_CALC (err u6016))
(define-constant ERR_INVALID_ZP (err u6017))
(define-constant ERR_INVALID_CT (err u6018))
(define-constant ERR_INVALID_COLL (err u6019))
(define-constant ERR_INVALID_STATUS (err u6020))
(define-constant ERR_INVALID_COVER_TOKEN (err u6021))
(define-constant ERR_INVALID_COVER_VAULT (err u6022))
(define-constant ERR_EXCEEDED_SIGNALED_AMOUNT (err u6023))

