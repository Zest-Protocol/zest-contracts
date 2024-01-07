(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait a-token .a-token-trait.a-token-trait)
(use-trait flash-loan .flash-loan-trait.flash-loan-trait)

(define-public (supply
  (lp <ft-mint-trait>)
  (pool-reserve principal)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (current-balance (try! (contract-call? .pool-0-reserve get-balance lp (contract-of asset) owner)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
    )
    (asserts! (> amount u0) (err u1))
    (asserts! (get is-active reserve-state) (err u2))
    (asserts! (not (get is-frozen reserve-state)) (err u3))
    (asserts! (is-eq (contract-of lp) (get a-token-address reserve-state)) (err u5))

    (try! (contract-call? .pool-0-reserve update-state-on-deposit asset owner amount (is-eq current-balance u0)))
    (try! (contract-call? .pool-0-reserve mint-on-deposit owner amount lp (contract-of asset)))
    (try! (contract-call? .pool-0-reserve transfer-to-reserve asset owner amount))

    (ok true)
  )
)

(define-constant max-value (contract-call? .math get-max-value))
(define-constant one-8 (contract-call? .math get-one))

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
    (amount-to-redeem (if (is-eq amount max-value) (get new-user-balance ret) amount))
    (redeems-everything (>= amount-to-redeem (get new-user-balance ret)))
    (current-available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
  )
    (asserts! (> amount u0) (err u1))
    (asserts! (is-eq (contract-of lp) (get a-token-address reserve-state)) (err u2))
    (asserts! (get is-active reserve-state) (err u3))
    (asserts! (>= current-available-liquidity amount-to-redeem) (err u99990))

    (try! (contract-call? lp burn amount-to-redeem owner))

    (try! (contract-call? .pool-0-reserve update-state-on-redeem asset owner amount redeems-everything))
    (try! (contract-call? .pool-0-reserve transfer-to-user asset owner amount-to-redeem))

    (ok current-available-liquidity)
  )
)

(define-public (borrow
  (pool-reserve principal)
  (oracle principal)
  (asset-to-borrow <ft>)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
  (amount-to-be-borrowed uint)
  (fee-calculator principal)
  (interest-rate-mode uint)
  (owner principal)
)
  (let (
    (available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset-to-borrow)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset-to-borrow)))
    (is-in-isolation-mode (contract-call? .pool-0-reserve is-in-isolation-mode owner))
  )
    (asserts! (contract-call? .pool-0-reserve is-borrowing-enabled (contract-of asset-to-borrow)) (err u99991))
    (asserts! (> available-liquidity amount-to-be-borrowed) (err u99992))
    (if is-in-isolation-mode
      (asserts! (contract-call? .pool-0-reserve is-borroweable-isolated (contract-of asset-to-borrow)) (err u99997))
      true
    )

    (let (
      (user-global-data (try! (contract-call? .pool-0-reserve calculate-user-global-data owner assets)))
      (borrow-fee (try! (contract-call? .fees-calculator calculate-origination-fee owner amount-to-be-borrowed)))
      (amount-collateral-needed-USD
        (try!
          (contract-call? .pool-0-reserve calculate-collateral-needed-in-USD
            asset-to-borrow
            oracle
            amount-to-be-borrowed
            borrow-fee
            (get total-borrow-balanceUSD user-global-data)
            (get user-total-feesUSD user-global-data)
            (get current-ltv user-global-data)
          )
        )
      )
    )
      ;; amount borrowed is too small
      (asserts! (> borrow-fee u0) (err u99993))
      (asserts! (> (get total-collateral-balanceUSD user-global-data) u0) (err u99994))
      (asserts! (<= amount-collateral-needed-USD (get total-collateral-balanceUSD user-global-data)) (err u99995))

      (asserts! (>= (get borrow-cap reserve-state) (+ (get total-borrows-variable reserve-state) borrow-fee amount-to-be-borrowed)) (err u99996))

      ;; conditions passed, can borrow
      (try! (contract-call? .pool-0-reserve update-state-on-borrow asset-to-borrow owner amount-to-be-borrowed borrow-fee))

      (try! (contract-call? .pool-0-reserve transfer-to-user asset-to-borrow owner amount-to-be-borrowed))
      (ok (merge
          user-global-data
          {
            amount-to-be-borrowed: amount-to-be-borrowed,
            is-in-isolation-mode: is-in-isolation-mode,
            owner: owner,
            is-borroweable: (contract-call? .pool-0-reserve is-borroweable-isolated (contract-of asset-to-borrow)),
            amount-collateral-needed-USD: amount-collateral-needed-USD,
            current-ltv: (get current-ltv user-global-data)
          }
        )
      )
    )
  )
)

(define-public (repay
  (asset <ft>)
  (amount-to-repay uint)
  (on-behalf-of principal)
  )
  (let (
    (ret (try! (contract-call? .pool-0-reserve get-user-borrow-balance on-behalf-of asset)))
    (origination-fee (contract-call? .pool-0-reserve get-user-origination-fee on-behalf-of asset))
    (amount-due (+ (get compounded-balance ret) origination-fee))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
    ;; default to max repayment
    (payback-amount
      (if (and (not (is-eq amount-to-repay max-value)) (< amount-to-repay amount-due))
        amount-to-repay
        amount-due
      )
    )
  )
    (asserts! (> (get compounded-balance ret) u0) (err u900000))
    (asserts! (get is-active reserve-state) (err u900001))
    (asserts! (> amount-to-repay u0) (err u900002))
    
    ;; if payback-amount is smaller than fees, just pay fees
    (if (<= payback-amount origination-fee)
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
            (contract-call? .pool-0-reserve get-collection-address)
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
            (is-eq (get compounded-balance ret) payback-amount-minus-fees)
          )
        )
        (if (> origination-fee u0)
          (begin
            (try!
              (contract-call? .pool-0-reserve transfer-fee-to-collection
                asset
                tx-sender
                origination-fee
                (contract-call? .pool-0-reserve get-collection-address)
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

(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
  (lp-token <a-token>)
  (collateral-to-liquidate <ft>)
  (asset-borrowed <ft>)
  (collateral-oracle principal)
  (principal-oracle principal)
  (user principal)
  (purchase-amount uint)
  (to-receive-underlying bool)
  )
  (let (
    (reserve-data (contract-call? .pool-0-reserve get-reserve-state (contract-of asset-borrowed)))
    (collateral-data (contract-call? .pool-0-reserve get-reserve-state (contract-of collateral-to-liquidate)))
  )
    (asserts! (get is-active reserve-data) (err u10))
    (asserts! (get is-active collateral-data) (err u11))
    
    (contract-call? .liquidation-manager liquidation-call
      assets
      lp-token
      collateral-to-liquidate
      asset-borrowed
      collateral-oracle
      principal-oracle
      user
      purchase-amount
      to-receive-underlying
    )
  )
)

(define-public (flashloan
  (sender principal)
  (receiver principal)
  (lp-token <ft>)
  (asset <ft>)
  (amount uint)
  (flashloan <flash-loan>)
  )
  (let (
    (available-liquidity-before (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (total-fee-bps (contract-call? .pool-0-reserve get-flashloan-fee-total))
    (protocol-fee-bps (contract-call? .pool-0-reserve get-flashloan-fee-protocol))
    (amount-fee (/ (* amount total-fee-bps) u10000))
    (protocol-fee (/ (* amount-fee protocol-fee-bps) u10000))
  )
    (asserts! (> amount available-liquidity-before) (err u1))
    (asserts! (and (> amount-fee u0) (> protocol-fee u0)) (err u2))

    (try! (contract-call? .pool-0-reserve transfer-to-user asset receiver amount))

    (try! (contract-call? flashloan execute asset receiver amount))

    (asserts!
      (is-eq
        (+ 
          available-liquidity-before
          amount-fee
        )
        (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset))
      )
      (err u3)
    )

    (try! 
      (contract-call? .pool-0-reserve update-state-on-flash-loan
        sender
        receiver
        asset
        available-liquidity-before
        (- amount-fee protocol-fee)
        protocol-fee
      )
    )

    (ok u0)
  )
)

(define-data-var configurator principal tx-sender)

(define-public (set-configurator (new-configurator principal))
  (begin
    (asserts! (is-eq tx-sender (var-get configurator)) (err u9))
    (ok (var-set configurator new-configurator))
  )
)

(define-read-only (is-configurator (caller principal))
  (if (is-eq caller (var-get configurator))
    true
    false
  )
)

(define-public (set-user-use-reserve-as-collateral
  (who principal)
  (lp-token <ft>)
  (asset <ft>)
  (use-as-collateral bool)
  (oracle principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
  )
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (contract-call? .pool-0-reserve get-balance lp-token (contract-of asset) who)))
    (user-data (get-user-reserve-data who (contract-of asset)))
  )
    (asserts! (is-configurator tx-sender) (err u9))
    (asserts! (get is-active reserve-data) (err u1))
    (asserts! (not (get is-frozen reserve-data)) (err u2))
    (asserts! (> underlying-balance u0) (err u3))

    ;; check user is not using deposited collateral
    (asserts! (try! (contract-call? .pool-0-reserve check-balance-decrease-allowed asset oracle underlying-balance who assets-to-calculate)) (err u4))

    (contract-call? .pool-0-reserve set-use-reserve-data who (contract-of asset) (merge user-data { use-as-collateral: use-as-collateral }))
  )
)

(define-public (init
  (a-token-address principal)
  (asset principal)
  (decimals uint)
  (supply-cap uint)
  (borrow-cap uint)
  (interest-rate-strategy-address principal)
  )
  (begin
    (asserts! (is-configurator tx-sender) (err u9))
    (contract-call? .pool-0-reserve set-reserve
      asset
      {
        last-liquidity-cumulative-index: one-8,
        current-liquidity-rate: u0,
        total-borrows-stable: u0,
        total-borrows-variable: u0,
        current-variable-borrow-rate: u0,
        current-stable-borrow-rate: u0,
        current-average-stable-borrow-rate: u0,
        last-variable-borrow-cumulative-index: one-8,
        base-ltv-as-collateral: u0,
        liquidation-threshold: u0,
        liquidation-bonus: u0,
        decimals: decimals,
        a-token-address: a-token-address,
        interest-rate-strategy-address: interest-rate-strategy-address,
        last-updated-block: u0,
        borrowing-enabled: false,
        supply-cap: supply-cap,
        borrow-cap: borrow-cap,
        debt-ceiling: u0,
        usage-as-collateral-enabled: false,
        is-stable-borrow-rate-enabled: false,
        is-active: true,
        is-frozen: false
      }
    )
  )
)

(define-public (set-borrowing-enabled (asset principal) (enabled bool))
  (let (
    (reserve-data (get-reserve-state asset))
  )
    (asserts! (is-configurator tx-sender) (err u9))
    (contract-call? .pool-0-reserve set-reserve asset (merge reserve-data { borrowing-enabled: enabled }))
  )
)

(define-read-only (get-reserve-state (asset principal))
  (contract-call? .pool-0-reserve get-reserve-state asset)
)

(define-read-only (get-user-reserve-data (user principal) (asset principal))
  (contract-call? .pool-0-reserve get-user-reserve-data user asset)
)

(define-read-only (get-borroweable-isolated)
  (contract-call? .pool-0-reserve get-borroweable-isolated)
)

(define-public (set-usage-as-collateral-enabled
  (asset principal)
  (enabled bool)
  (base-ltv-as-collateral uint)
  (liquidation-threshold uint)
  (liquidation-bonus uint)
  )
  (let (
    (reserve-data (get-reserve-state asset))
  )
    (asserts! (is-configurator tx-sender) (err u9))

    (contract-call? .pool-0-reserve set-reserve
      asset
      (merge
        reserve-data
        (merge
          reserve-data
          {
            usage-as-collateral-enabled: enabled,
            base-ltv-as-collateral: base-ltv-as-collateral,
            liquidation-threshold: liquidation-threshold,
            liquidation-bonus: liquidation-bonus
          }
        )
      ))
  )
)


(define-public (add-isolated-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) (err u9))
    (contract-call? .pool-0-reserve set-isolated-asset asset)
  )
)

(define-public (add-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) (err u9))
    (contract-call? .pool-0-reserve add-asset asset)
  )
)

(define-public (remove-isolated-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) (err u9))
    (contract-call? .pool-0-reserve remove-isolated-asset asset)
  )
)

(define-public (set-borroweable-isolated (asset principal) (debt-ceiling uint))
  (let (
    (reserve-data (get-reserve-state asset))
    (borroweable-assets (get-borroweable-isolated))
  )
    (asserts! (is-configurator tx-sender) (err u9))
    (try! (contract-call? .pool-0-reserve set-borroweable-isolated
      (unwrap-panic (as-max-len? (append borroweable-assets asset) u100))
      )
    )
    (contract-call? .pool-0-reserve set-reserve asset (merge reserve-data { debt-ceiling: debt-ceiling }))
  )
)


(define-public (remove-borroweable-isolated (asset principal))
  (let (
    (borroweable-assets (get-borroweable-isolated))
  )
    (asserts! (is-configurator tx-sender) (err u9))
    (ok
      (contract-call? .pool-0-reserve set-borroweable-isolated
        (get agg (fold filter-asset borroweable-assets { filter-by: asset, agg: (list) }))
      )
    )
  )
)

(define-read-only (filter-asset (asset principal) (ret { filter-by: principal, agg: (list 100 principal) }))
  (if (is-eq asset (get filter-by ret))
    ;; ignore, do not add
    ret
    ;; add back to list
    { filter-by: (get filter-by ret), agg: (unwrap-panic (as-max-len? (append (get agg ret) asset) u100)) }
  )
)
