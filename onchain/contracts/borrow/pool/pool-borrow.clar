(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
;; (use-trait lv .liquidity-vault-trait.liquidity-vault-trait)

(define-public (supply
  (lp <ft-mint-trait>)
  (pool-reserve principal)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (current-balance (try! (contract-call? .pool-0-reserve get-balance lp (contract-of asset) owner)))
    )
    ;; (print { current-balance: current-balance })
    (try! (contract-call? .pool-0-reserve update-state-on-deposit asset owner amount (> current-balance u0)))
    (try! (contract-call? .pool-0-reserve mint-on-deposit owner amount lp (contract-of asset)))
    (try! (contract-call? .pool-0-reserve transfer-to-reserve asset owner amount))

    (ok true)
  )
)

(define-public (redeem-underlying
  (lp <ft-mint-trait>)
  (pool-reserve principal)
  (asset <ft>)
  (amount uint)
  ;; (atoken-balance-after-redeem uint)
  (owner principal)
)
  (let (
    (ret (try! (contract-call? .pool-0-reserve cumulate-balance owner lp (contract-of asset))))
    (current-available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (amount-to-redeem amount)
  )

    ;; (try! (contract-call? .pool-0-reserve update-state-on-redeem asset owner amount (is-eq amount-to-redeem u0)))
    ;; (try! (contract-call? .pool-0-reserve transfer-to-user asset owner amount))

    (print { THIS: ret })

    ;; (try! (contract-call? lp burn amount owner))

    (ok current-available-liquidity)
  )
)

(define-public (borrow
  ;; (debt-token <ft-mint-trait>)
  (pool-reserve principal)
  (asset <ft>)
  (amount-to-be-borrowed uint)
  (interest-rate-mode uint)
  (owner principal)
)
  (let (
    (current-available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (ret (try! (contract-call? .pool-0-reserve update-state-on-borrow asset owner amount-to-be-borrowed u0)))
  )
    ;; TODO: asset borrowing enabled
    ;; TODO: check amount is smaller than available liquidity
    ;; TODO: add oracle checks
    (try! (contract-call? .pool-0-reserve transfer-to-user asset owner amount-to-be-borrowed))
    (ok u0)
  )
)

(define-public (repay
  ;; (debt-token <ft-mint-trait>)
  (asset <ft>)
  (amount-to-repay uint)
  (on-behalf-of principal)
  )
  (let (
    (ret (try! (contract-call? .pool-0-reserve get-user-borrow-balance on-behalf-of asset)))
    (origination-fee (contract-call? .pool-0-reserve get-user-origination-fee on-behalf-of asset))
    (amount-due (+ (get compounded-balance ret) origination-fee))
    ;; default to max repayment
    (payback-amount
      (if (< amount-to-repay amount-due)
        amount-to-repay
        amount-due
      )
    )
  )
    ;; (print { PAY: amount-due })
    ;; if payback-amount is smaller than fees, just pay fees
    (if (< payback-amount origination-fee)
      (begin
        (try!
          (contract-call? .pool-0-reserve update-state-on-repay
            asset
            on-behalf-of
            u0
            payback-amount
            (get balance-increase ret)
            false
          )
        )
        (try!
          (contract-call? .pool-0-reserve transfer-fee-to-collection
            asset
            on-behalf-of
            payback-amount
            (get-collection-address)
          )
        )
        (ok u0)
      )
      ;; paying back the balance
      (let (
        (payback-amount-minus-fees (- payback-amount origination-fee))
      )
        (try!
          (contract-call? .pool-0-reserve update-state-on-repay
            asset
            on-behalf-of
            payback-amount-minus-fees
            origination-fee
            (get balance-increase ret)
            false
          )
        )
        (if (> origination-fee u0)
          (begin
            (try!
              (contract-call? .pool-0-reserve transfer-fee-to-collection
                asset
                tx-sender
                origination-fee
                (get-collection-address)
              )
            )
            u0
          )
          u0
        )
        (contract-call? .pool-0-reserve transfer-to-reserve asset tx-sender payback-amount-minus-fees)
      )
    )
  )
)

(define-read-only (get-collection-address)
  .protocol-treasury
)

;; (define-public (get-pool (token-id uint))
;;   (contract-call? .pool-data get-pool token-id))
