;; ERROR CODES
(define-constant ERR_STAKING_NOT_AVAILABLE u1015)
(define-constant ERR_CANNOT_STAKE u1016)
(define-constant ERR_REWARD_CYCLE_NOT_COMPLETED u1017)
(define-constant ERR_NOTHING_TO_REDEEM u1018)
(define-constant ERR-NOT-AUTHORIZED u100401)

;; TRAITS
(use-trait ft .sip-010-trait.sip-010-trait)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; POOL CONFIGURATION
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(define-data-var pool-delegate principal tx-sender)

(define-public (set-pool-delegate (address principal))
  (begin
    (asserts! (is-eq tx-sender (var-get pool-delegate)) (err ERR-NOT-AUTHORIZED))

    (ok (var-set pool-delegate address))
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; STAKING CONFIGURATION
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-constant MAX_REWARD_CYCLES u32)
(define-constant REWARD_CYCLE_INDEXES (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31))

;; how long a reward cycle is
(define-data-var rewardCycleLength uint u2100)

(define-data-var activationBlock uint u340282366920938463463374607431768211455)

;; At a given reward cycle:
;; - how many Stakers were there
;; - what is the total Zest amount staked
;; - what is the total asset amount staked for given assetid
;; - what is the total amount of xBTC accumulated in fees
(define-map StakingStatsAtCycle
  uint
  {
    amountToken: uint,
    amountxBTC: uint
  }
)

;; At a given reward cycle:
;; - total loss from defaults in terms of Zest
(define-map LossAtCycle
  uint
  uint
)

;; returns the total loss in Zest token from defaults
(define-read-only (get-loss-at-cycle (rewardCycle uint))
  (map-get? LossAtCycle rewardCycle)
)

;; returns the total lost tokens for a given reward cycle
;; or u0
(define-read-only (get-loss-at-cycle-or-default (rewardCycle uint))
  (default-to u0 
    (map-get? LossAtCycle rewardCycle))
)

;; returns the total staked tokens and accrued xBTC for a given reward cycle
(define-read-only (get-staking-stats-at-cycle (rewardCycle uint))
  (map-get? StakingStatsAtCycle rewardCycle)
)

;; returns the total staked tokens and accrued xBTC for a given reward cycle
;; or, an empty structure
(define-read-only (get-staking-stats-at-cycle-or-default (rewardCycle uint))
  (default-to { amountToken: u0, amountxBTC: u0 }
    (map-get? StakingStatsAtCycle rewardCycle))
)

;; return total staked tokens for given reward cycle or u0
(define-read-only (get-total-staked-tokens-at-cycle-or-default (rewardCycle uint))
  (default-to u0
    (get amountToken (map-get? StakingStatsAtCycle rewardCycle))
  )
)

;; At a given reward cycle and for given user:
;; - what is the total tokens staked?
;; - how many tokens should be returned? (based on staking period)
(define-map StakerAtCycle
  {
    rewardCycle: uint,
    user: principal
  }
  {
    amountToken: uint,
    toReturn: uint
  }
)

(define-read-only (get-staker-at-cycle (rewardCycle uint) (user principal))
  (map-get? StakerAtCycle { rewardCycle: rewardCycle, user: user })
)

(define-read-only (get-staker-at-cycle-or-default (rewardCycle uint) (user principal))
  (default-to { amountToken: u0, toReturn: u0 }
    (map-get? StakerAtCycle { rewardCycle: rewardCycle, user: user }))
)

(define-read-only (get-staker-tokens-at-cycle-or-default (rewardCycle uint) (user principal))
  (default-to u0
    (get amountToken (map-get? StakerAtCycle { rewardCycle: rewardCycle, user: user }))
  )
)

;; get the reward cycle for a given Stacks block height
(define-read-only (get-reward-cycle (stacksHeight uint))
  (let
    (
      (firstStakingBlock (var-get activationBlock))
      (rcLen (var-get rewardCycleLength))
    )
    (if (>= stacksHeight firstStakingBlock)
      (some (/ (- stacksHeight firstStakingBlock) rcLen))
      none)
  )
)

;; determine if staking is active in a given cycle for a given asset
(define-read-only (staking-active-at-cycle (rewardCycle uint))
  (is-some
    (get amountToken (map-get? StakingStatsAtCycle rewardCycle))
  )
)

;; get the first Stacks block height for a given reward cycle.
(define-read-only (get-first-stacks-block-in-reward-cycle (rewardCycle uint))
  (+ (var-get activationBlock) (* (var-get rewardCycleLength) rewardCycle))
)

;; getter for get-entitled-staking-reward that specifies block height
(define-read-only (get-staking-reward (user principal) (targetCycle uint))
  (get-entitled-staking-reward user targetCycle block-height)
)

;; getting loss stats for each staker
(define-read-only (get-staker-loss-at-cycle-or-default (rewardCycle uint) (user principal))
  (default-to u0
    (some (/ (* (get-staker-tokens-at-cycle-or-default rewardCycle user) (get-loss-at-cycle-or-default rewardCycle)) (get-total-staked-tokens-at-cycle-or-default rewardCycle)))
  )
)

;; determine if a default has occurred in a given cycle
(define-read-only (loss-at-cycle (rewardCycle uint))
  (is-some
    (map-get? LossAtCycle rewardCycle)
  )
)

;; get Zest a staker can claim, given reward cycle they staked in and current block height
;; this method only returns a positive value if:
;; - the current block height is in a subsequent reward cycle
;; - the staker actually locked up tokens in the target reward cycle
;; - the staker locked up _enough_ tokens to get at least one Zest token
;; it is possible to stake tokens and not receive Zest:
;; - if no interest or fees are paid during this reward cycle
;; - the amount staked by user is too few that you'd be entitled to less than 1 Zest token
(define-private (get-entitled-staking-reward (user principal) (targetCycle uint) (stacksHeight uint))
  (let
    (
      (rewardCycleStats (get-staking-stats-at-cycle-or-default targetCycle))
      (stakerAtCycle (get-staker-at-cycle-or-default targetCycle user))
      (totalTokensThisCycle (get amountToken rewardCycleStats))
      (totalxBTCThisCycle (get amountxBTC rewardCycleStats))
      (userStakedTokensThisCycle (get amountToken stakerAtCycle))
      (totalLossThisCycle (get-loss-at-cycle-or-default targetCycle))
    )
    (match (get-reward-cycle stacksHeight)
      currentCycle
      (if (or (<= currentCycle targetCycle) (is-eq u0 userStakedTokensThisCycle))
        ;; this cycle hasn't finished, or staker contributed nothing
        u0
        ;; TODO change this, putting placeholder for now 1k tokens per cycle
        ;; perform division last
        ;; (/ (* totalxBTCThisCycle userStakedTokensThisCycle) totalTokensThisCycle)
        (/ (* (* u1000 userStakedTokensThisCycle) (- totalTokensThisCycle totalLossThisCycle)) totalTokensThisCycle)
      )
      ;; before first reward cycle
      u0
    )
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; STAKING ACTIONS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-public (stake-tokens (amountToken uint) (lockPeriod uint))
  (begin
    (try! (stake-tokens-at-cycle tx-sender amountToken block-height lockPeriod))
    (ok true)
  )
)

(define-private (stake-tokens-at-cycle (user principal) (amountToken uint) (startHeight uint) (lockPeriod uint))
  (let
    (
      (currentCycle (unwrap! (get-reward-cycle startHeight) (err ERR_STAKING_NOT_AVAILABLE)))
      (targetCycle (+ u1 currentCycle))
      (commitment {
        staker: user,
        amountToken: amountToken,
        first: targetCycle,
        last: (+ targetCycle lockPeriod)
      })
    )
    (asserts! (and (> lockPeriod u0) (<= lockPeriod MAX_REWARD_CYCLES))
      (err ERR_CANNOT_STAKE))
    (asserts! (> amountToken u0) (err ERR_CANNOT_STAKE))
    ;; transfer tokens into pool
    (try! (contract-call? .zest transfer amountToken tx-sender (as-contract tx-sender) none))
    (match (fold stake-tokens-closure REWARD_CYCLE_INDEXES (ok commitment))
      okValue (ok true)
      errValue (err errValue)
    )
  )
)

(define-private (stake-tokens-closure (rewardCycleIdx uint)
  (commitmentResponse (response 
    {
      staker: principal,
      amountToken: uint,
      first: uint,
      last: uint
    }
    uint
  )))

  (match commitmentResponse
    commitment 
    (let
      (
        (staker (get staker commitment))
        (amountToken (get amountToken commitment))
        (firstCycle (get first commitment))
        (lastCycle (get last commitment))
        (targetCycle (+ firstCycle rewardCycleIdx))
        (stakerAtCycle (get-staker-at-cycle-or-default targetCycle staker))
        (amountStaked (get amountToken stakerAtCycle))
        (toReturn (get toReturn stakerAtCycle))
      )
      (begin
        (if (and (>= targetCycle firstCycle) (< targetCycle lastCycle))
          (begin
            (if (is-eq targetCycle (- lastCycle u1))
              (set-tokens-staked staker targetCycle amountToken amountToken)
              (set-tokens-staked staker targetCycle amountToken u0)
            )
            true
          )
          false
        )
        commitmentResponse
      )
    )
    errValue commitmentResponse
  )
)

(define-private (set-tokens-staked (user principal) (targetCycle uint) (amountToken uint) (toReturn uint))
  (let
    (
      (rewardCycleStats (get-staking-stats-at-cycle-or-default targetCycle))
      (stakerAtCycle (get-staker-at-cycle-or-default targetCycle user))
    )
    (map-set StakingStatsAtCycle
      targetCycle
      {
        amountxBTC: (get amountxBTC rewardCycleStats),
        amountToken: (+ amountToken (get amountToken rewardCycleStats))
      }
    )
    (map-set StakerAtCycle
      {
        rewardCycle: targetCycle,
        user: user
      }
      {
        amountToken: (+ amountToken (get amountToken stakerAtCycle)),
        toReturn: (+ toReturn (get toReturn stakerAtCycle))
      }
    )
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; STAKING REWARD CLAIMS
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; calls function to claim staking reward in active logic contract
(define-public (claim-staking-reward (targetCycle uint))
  (begin
    (try! (claim-staking-reward-at-cycle tx-sender block-height targetCycle))
    (ok true)
  )
)

(define-private (claim-staking-reward-at-cycle (user principal) (stacksHeight uint) (targetCycle uint))
  (let
    (
      (currentCycle (unwrap! (get-reward-cycle stacksHeight) (err ERR_STAKING_NOT_AVAILABLE)))
      (entitledReward (get-entitled-staking-reward user targetCycle stacksHeight))
      (stakerAtCycle (get-staker-at-cycle-or-default targetCycle user))
      (toReturn (get toReturn stakerAtCycle))
    )
    (asserts! (or
      ;;(is-eq true (var-get isShutdown))
      (> currentCycle targetCycle))
      (err ERR_REWARD_CYCLE_NOT_COMPLETED))
    (asserts! (or (> toReturn u0) (> entitledReward u0)) (err ERR_NOTHING_TO_REDEEM))
    ;; disable ability to claim again
    (map-set StakerAtCycle
      {
        rewardCycle: targetCycle,
        user: user,
      }
      {
        amountToken: u0,
        toReturn: u0
      }
    )
    ;; send back tokens if user was eligible
    (if (> toReturn u0)
      (try! (as-contract (contract-call? .zest transfer toReturn tx-sender user none)))
      true
    )
    ;; mint Zest as reward if user was eligible
    (if (> entitledReward u0)
      (try! (as-contract (contract-call? .zest mint entitledReward user)))
      true
    )
    (ok true)
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; WITHDRAWAL OF FUNDS IN CASE OF DEFAULT
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; (define-public (default-withdrawal (amountToken uint) (recipient principal))
  ;; TODO (unfinished): need to include appropriate permissions
  ;; for who can call the withdrawal (pool delegate? / contracts?)
  ;; need to update individuals 
  ;; (map-set LossAtCycle (unwrap! (get-reward-cycle startHeight) (err ERR_STAKING_NOT_AVAILABLE)) amountToken)
  ;; (try! (as-contract (contract-call? .zest transfer amountToken (as-contract tx-sender) recipient)))
;; )
