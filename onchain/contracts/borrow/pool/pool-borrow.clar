(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait lv .liquidity-vault-trait.liquidity-vault-trait)

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
    (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (amount-to-mint (+ amount))
    )
    ;; TODO: check asset is correct pool asset
    ;; TODO: validate lv
    ;; TODO: Add Liquidity cap per pool

    ;; transfer assets to liquidity vault
    ;; (as-contract (try! (contract-call? l-v add-asset asset amount pool-id tx-sender)))
    ;; TODO: update accrued interest
    ;; TODO: update interest rates
    ;; TODO: update utilization rate

    (try! (contract-call? asset transfer amount owner (contract-of lp) none))
    (try! (contract-call? lp mint amount-to-mint owner))

    

    (ok true)
  )
)

(define-public (get-pool (token-id uint))
  (contract-call? .pool-data get-pool token-id))

(define-public (get-current-liquidity (liquidity-vault <lv>) (pool-id uint))
  (let (
    (liquidity-vault-balance (default-to u0 (try! (contract-call? liquidity-vault get-asset pool-id))))
    (pool (try! (get-pool pool-id)))
    )
    (ok (+ (get principal-out pool) liquidity-vault-balance))
  )
)
