
;; -- Pool Zest rewards
(define-read-only (get-withdrawable-pool-zest-rewards (token-id uint) (recipient principal))
  (let (
    (rewards (contract-call? .zest-reward-dist get-withdrawable-rewards token-id recipient))
    (funds-sent-data (contract-call? .pool-v2-0 get-funds-sent-read recipient token-id))
    (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (contract-call? .rewards-calc get-mint-rewards recipient (get factor funds-sent-data) (get cycle-rewards rewards)) u0))
    (zest-base-rewards (if (> (get passive-rewards rewards) u0) (contract-call? .rewards-calc get-mint-rewards-base recipient (get passive-rewards rewards)) u0))
  )
    { zest-base-rewards: zest-base-rewards, zest-cycle-rewards: zest-cycle-rewards }
  )
)

(define-read-only (get-withdrawable-cover-pool-zest-rewards (token-id uint) (recipient principal))
  (let (
    (rewards (contract-call? .cp-token get-withdrawable-rewards token-id recipient))
    (funds-sent-data (contract-call? .cover-pool-data get-sent-funds-read recipient token-id))
    (zest-cycle-rewards (if (> (get cycle-rewards rewards) u0) (contract-call? .rewards-calc get-mint-rewards recipient (get cycles funds-sent-data) (get cycle-rewards rewards)) u0))
    (zest-base-rewards (if (> (get passive-rewards rewards) u0) (contract-call? .rewards-calc get-mint-rewards-base recipient (get passive-rewards rewards)) u0))
  )
    { zest-base-rewards: zest-base-rewards, zest-cycle-rewards: zest-cycle-rewards }
  )
)


;; -- Pool BTC rewards
(define-read-only (get-withdrawable-rewards-pool (token-id uint) (owner principal))
  (contract-call? .lp-token withdrawable-funds-of token-id owner)
)

(define-read-only (get-withdrawable-rewards-cover-pool (token-id uint) (owner principal))
  (contract-call? .cp-rewards-token withdrawable-funds-of token-id owner)
)
