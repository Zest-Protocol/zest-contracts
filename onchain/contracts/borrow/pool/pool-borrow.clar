(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
;; (use-trait lv .liquidity-vault-trait.liquidity-vault-trait)

(define-public (supply
  (lp <ft-mint-trait>)
  (pool-id uint)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    ;; (pool (try! (get-pool pool-id)))
    ;; (current-liquidity (try! (get-current-liquidity l-v pool-id)))
    (current-balance (try! (contract-call? .lp-token-0-reserve get-balance lp owner)))
    )
    ;; TODO: check asset is correct pool asset
    ;; TODO: Add Liquidity cap per pool
    (try! (contract-call? .lp-token-0-reserve update-state-on-deposit asset owner amount (> current-balance u0)))
    (try! (contract-call? .lp-token-0-reserve mint-on-deposit owner amount lp))
    (try! (contract-call? .lp-token-0-reserve transfer-to-reserve asset owner amount))

    (ok true)
  )
)

(define-public (redeem-underlying
  (lp <ft-mint-trait>)
  (pool-id uint)
  (asset <ft>)
  (amount uint)
  (atoken-balance-after-redeem uint)
  (owner principal)
)
  (let (
    (current-available-liquidity (try! (contract-call? .lp-token-0-reserve get-reserve-available-liquidity asset)))
  )
    (try! (contract-call? .lp-token-0-reserve update-state-on-redeem asset owner amount (is-eq atoken-balance-after-redeem u0)))
    (try! (contract-call? .lp-token-0-reserve transfer-to-user asset owner amount))

    (ok u0)
  )
)

(define-public (borrow
  (debt-token <ft-mint-trait>)
  (asset <ft>)
  (amount-to-be-borrowed uint)
  (interest-rate-mode uint)
  (owner principal)
)
  (let (
    (current-available-liquidity (try! (contract-call? .lp-token-0-reserve get-reserve-available-liquidity asset)))
    (ret (try! (contract-call? .lp-token-0-reserve update-state-on-borrow asset owner amount-to-be-borrowed u0)))
  )
    ;; TODO: asset borrowing enabled
    ;; TODO: check amount is smaller than available liquidity
    ;; TODO: add oracle checks
    (try! (contract-call? .lp-token-0-reserve transfer-to-user asset owner amount-to-be-borrowed))
    (ok u0)
  )
)

;; (define-public (get-pool (token-id uint))
;;   (contract-call? .pool-data get-pool token-id))
