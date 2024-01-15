(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait a-token .a-token-trait.a-token-trait)
(use-trait flash-loan .flash-loan-trait.flash-loan-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)

(define-constant max-value (contract-call? .math get-max-value))
(define-constant one-8 (contract-call? .math get-one))

(define-public (supply
  (lp <ft-mint-trait>)
  (pool-reserve principal)
  (asset <ft>)
  (amount uint)
  (owner principal)
  )
  (let (
    (supplied-asset-principal (contract-of asset))
    (current-balance (try! (contract-call? lp get-balance owner)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state supplied-asset-principal))
    (user-assets (contract-call? .pool-0-reserve get-user-assets owner))
    (isolated-asset (contract-call? .pool-0-reserve is-in-isolation-mode owner))
    (assets-used-as-collateral (contract-call? .pool-0-reserve get-assets-used-as-collateral owner))
    )
    (asserts! (> amount u0) ERR_NOT_ZERO)
    (asserts! (get is-active reserve-state) ERR_INACTIVE)
    (asserts! (not (get is-frozen reserve-state)) ERR_FROZEN)
    (asserts! (is-eq (contract-of lp) (get a-token-address reserve-state)) ERR_INVALID_Z_TOKEN)

    ;; if first supply
    (if (is-eq current-balance u0)
      (if (unwrap-panic
            (validate-use-as-collateral
              (is-some isolated-asset)
              (get base-ltv-as-collateral reserve-state)
              (get enabled-assets assets-used-as-collateral)
              supplied-asset-principal
              owner
              (get debt-ceiling reserve-state)
            ))
        (try! (contract-call? .pool-0-reserve set-user-reserve-as-collateral owner asset true))
        false
      )
      false
    )

    (asserts! (is-none (index-of? (get assets-borrowed user-assets) supplied-asset-principal)) ERR_SUPPLYING_BORROWED_ASSET)

    (try! (contract-call? .pool-0-reserve update-state-on-deposit asset owner amount (is-eq current-balance u0)))

    (try! (contract-call? lp mint amount owner))
    (try! (contract-call? .pool-0-reserve transfer-to-reserve asset owner amount))

    (ok true)
  )
)

(define-read-only (validate-use-as-collateral
  (is-in-isolation-mode bool)
  (base-ltv-as-collateral uint)
  (assets-enabled-as-collateral (list 100 principal))
  (asset-address principal)
  (who principal)
  (debt-ceiling uint)
  )
    (if (is-eq base-ltv-as-collateral u0)
      (ok false)
      ;; not any as collateral
      (if (is-eq (len assets-enabled-as-collateral) u0)
        (ok true)
        (if (and is-in-isolation-mode)
          (ok (> debt-ceiling u0))
          (ok true)
        )
      )
    )
)

(define-public (redeem-underlying
  (pool-reserve principal)
  (asset <ft>)
  (oracle <oracle-trait>)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  (amount uint)
  (current-balance uint)
  (owner principal)
)
  (let (
    (redeems-everything (>= amount current-balance))
    (current-available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
  )
    (asserts! (> amount u0) ERR_NOT_ZERO)
    (asserts! (is-eq contract-caller (get a-token-address reserve-state)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (contract-of oracle) (get oracle reserve-state)) ERR_INVALID_ORACLE)
    (asserts! (get is-active reserve-state) ERR_INACTIVE)
    (asserts! (>= current-available-liquidity amount) ERR_EXCEEDED_LIQ)

    (try! (contract-call? .pool-0-reserve update-state-on-redeem asset owner amount redeems-everything))
    (try! (contract-call? .pool-0-reserve transfer-to-user asset owner amount))

    (ok amount)
  )
)

(define-public (borrow
  (pool-reserve principal)
  (oracle <oracle-trait>)
  (asset-to-borrow <ft>)
  (lp <ft>)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  (amount-to-be-borrowed uint)
  (fee-calculator principal)
  (interest-rate-mode uint)
  (owner principal))
  (let (
    (asset (contract-of asset-to-borrow))
    (available-liquidity (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset-to-borrow)))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state asset))
    (is-in-isolation-mode (contract-call? .pool-0-reserve is-in-isolation-mode owner))
    (user-assets (contract-call? .pool-0-reserve get-user-assets owner))
  )
    (asserts! (contract-call? .pool-0-reserve is-borrowing-enabled asset) ERR_BORROWING_DISABLED)
    (asserts! (>= available-liquidity amount-to-be-borrowed) ERR_EXCEEDED_LIQ)
    (asserts! (is-eq tx-sender owner) ERR_UNAUTHORIZED)
    (asserts! (> amount-to-be-borrowed u0) ERR_NOT_ZERO)
    (asserts! (not (get is-frozen reserve-state)) ERR_FROZEN)

    (if (is-some is-in-isolation-mode)
      (asserts! (contract-call? .pool-0-reserve is-borroweable-isolated asset) ERR_NOT_SILOED_ASSET)
      true)

    (asserts! (is-eq (get a-token-address reserve-state) (contract-of lp)) ERR_INVALID_Z_TOKEN)
    (asserts! (is-eq (get oracle reserve-state) (contract-of oracle)) ERR_INVALID_ORACLE)
    (asserts! (is-none (index-of? (get assets-supplied user-assets) asset)) ERR_BORROWING_SUPPLIED_ASSET)

    (let (
      (user-global-data (try! (contract-call? .pool-0-reserve calculate-user-global-data owner assets)))
      (borrow-fee (try! (contract-call? .fees-calculator calculate-origination-fee owner amount-to-be-borrowed (get decimals reserve-state))))
      (borrow-balance (unwrap-panic (contract-call? .pool-0-reserve get-user-balance-reserve-data lp asset-to-borrow owner oracle)))
      (amount-collateral-needed
        (contract-call? .pool-0-reserve calculate-collateral-needed-in-USD
          asset-to-borrow
          amount-to-be-borrowed
          (get decimals reserve-state)
          (try! (contract-call? oracle get-asset-price asset-to-borrow))
          borrow-fee
          (get total-borrow-balanceUSD user-global-data)
          (get user-total-feesUSD user-global-data)
          (get current-ltv user-global-data))))
      (asserts! (> borrow-fee u0) ERR_NOT_ZERO)
      (asserts! (> (get total-collateral-balanceUSD user-global-data) u0) ERR_NOT_ZERO)
      (asserts! (<= (get collateral-needed-in-USD amount-collateral-needed) (get total-collateral-balanceUSD user-global-data)) ERR_NOT_ENOUGH_COLLATERAL)
      (asserts! (>= (get borrow-cap reserve-state) (+ (get total-borrows-variable reserve-state) borrow-fee amount-to-be-borrowed)) ERR_EXCEED_BORROW_CAP)

      (if (> (get debt-ceiling reserve-state) u0)
        (asserts! (<= (+ (get requested-borrow-amount-USD amount-collateral-needed) (get total-borrow-balanceUSD user-global-data))
                      (get debt-ceiling reserve-state)) ERR_EXCEED_DEBT_CEIL)
        false)

      ;; conditions passed, can borrow
      (try! (contract-call? .pool-0-reserve update-state-on-borrow asset-to-borrow owner amount-to-be-borrowed borrow-fee))
      (try! (contract-call? .pool-0-reserve transfer-to-user asset-to-borrow owner amount-to-be-borrowed))

      (ok amount-to-be-borrowed))))

(define-public (repay
  (asset <ft>)
  (amount-to-repay uint)
  (on-behalf-of principal)
  )
  (let (
    (ret (unwrap-panic (contract-call? .pool-0-reserve get-user-borrow-balance on-behalf-of asset)))
    (origination-fee (contract-call? .pool-0-reserve get-user-origination-fee on-behalf-of asset))
    (amount-due (+ (get compounded-balance ret) origination-fee))
    (reserve-state (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
    (payback-amount
      (if (is-eq amount-to-repay max-value)
        amount-due
        (if (> amount-to-repay amount-due)
          amount-due
          amount-to-repay ))))
    ;; (asserts! false (err payback-amount))
    (asserts! (> (get compounded-balance ret) u0) ERR_NOT_ZERO)
    (asserts! (get is-active reserve-state) ERR_INACTIVE)
    (asserts! (> amount-to-repay u0) ERR_NOT_ZERO)
    
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
        (ok payback-amount)
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
        (try! (contract-call? .pool-0-reserve transfer-to-reserve asset tx-sender payback-amount-minus-fees))
        (ok payback-amount)
      )
    )
  )
)

(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  (collateral-lp <a-token>)
  (collateral-to-liquidate <ft>)
  (debt-asset <ft>)
  (collateral-oracle <oracle-trait>)
  (debt-oracle <oracle-trait>)
  (liquidated-user principal)
  (debt-amount uint)
  (to-receive-atoken bool))
  (let (
    (reserve-data (get-reserve-state (contract-of debt-asset)))
    (collateral-data (get-reserve-state (contract-of collateral-to-liquidate)))
  )
    (asserts! (get is-active reserve-data) ERR_INACTIVE)
    (asserts! (get is-active collateral-data) ERR_INACTIVE)
    (asserts! (is-eq (contract-of collateral-lp) (get a-token-address collateral-data)) ERR_INVALID_Z_TOKEN)
    (asserts! (is-eq (contract-of collateral-oracle) (get oracle collateral-data)) ERR_INVALID_ORACLE)
    (asserts! (is-eq (contract-of debt-oracle) (get oracle reserve-data)) ERR_INVALID_ORACLE)
    
    (contract-call? .liquidation-manager liquidation-call
      assets
      collateral-lp
      collateral-to-liquidate
      debt-asset
      collateral-oracle
      debt-oracle
      liquidated-user
      debt-amount
      to-receive-atoken
    )
  )
)

(define-public (flashloan
  (receiver principal)
  (lp <ft>)
  (asset <ft>)
  (amount uint)
  (flashloan <flash-loan>))
  (let  (
    (available-liquidity-before (try! (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)))
    (total-fee-bps (unwrap-panic (contract-call? .pool-0-reserve get-flashloan-fee-total (contract-of asset))))
    (protocol-fee-bps (unwrap-panic (contract-call? .pool-0-reserve get-flashloan-fee-protocol (contract-of asset))))
    (amount-fee (/ (* amount total-fee-bps) u10000))
    (protocol-fee (/ (* amount-fee protocol-fee-bps) u10000))
    (reserve-data (get-reserve-state (contract-of asset)))
  )
    (asserts! (>= available-liquidity-before amount) ERR_EXCEEDED_LIQ)
    (asserts! (and (> amount-fee u0) (> protocol-fee u0)) ERR_NOT_ZERO)
    (asserts! (get flashloan-enabled reserve-data) ERR_FLASHLOAN_DISABLED)
    (asserts! (is-eq (contract-of lp) (get a-token-address reserve-data)) ERR_INVALID_Z_TOKEN)

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
      ERR_REPAYMENT_SHOULD_BE_EXACT
    )

    (try!
      (contract-call? .pool-0-reserve update-state-on-flash-loan
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
    (asserts! (is-eq tx-sender (var-get configurator)) ERR_UNAUTHORIZED)
    (ok (var-set configurator new-configurator))))

(define-read-only (is-configurator (caller principal))
  (if (is-eq caller (var-get configurator))
    true
    false))

(define-public (set-user-use-reserve-as-collateral
  (who principal)
  (lp-token <ft>)
  (asset <ft>)
  (enable-as-collateral bool)
  (oracle <oracle-trait>)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> })))
  (let (
    (reserve-data (get-reserve-state (contract-of asset)))
    (underlying-balance (try! (contract-call? lp-token get-balance who)))
    (user-data (get-user-reserve-data who (contract-of asset)))
    (isolation-mode-asset (contract-call? .pool-0-reserve is-in-isolation-mode who)))
    (asserts! (is-eq tx-sender who) ERR_UNAUTHORIZED)
    (asserts! (get is-active reserve-data) ERR_INACTIVE)
    (asserts! (not (get is-frozen reserve-data)) ERR_FROZEN)
    (asserts! (> underlying-balance u0) ERR_NOT_ZERO)
    (asserts! (is-eq (contract-of lp-token) (get a-token-address reserve-data)) ERR_INVALID_Z_TOKEN)

    ;; if in isolation mode, can only disable isolated asset
    (if (is-some isolation-mode-asset)
      (begin
        ;; repay before changing
        (asserts! (not (contract-call? .pool-0-reserve is-borrowing-assets who)) ERR_REPAY_BEFORE_DISABLING)
        ;; if repaid, must be updating the isolated collateral asset
        (asserts! (is-eq (unwrap-panic isolation-mode-asset) (contract-of asset)) ERR_MUST_DISABLE_ISOLATED_ASSET)
        ;; if isolated asset is enabled, can only disable it
        (contract-call? .pool-0-reserve set-user-reserve-data who (contract-of asset) (merge user-data { use-as-collateral: false })))
      (begin
        (if (not enable-as-collateral)
          ;; if disabling as collateral, check user is not using deposited collateral
          (asserts! (try! (contract-call? .pool-0-reserve check-balance-decrease-allowed asset oracle underlying-balance who assets-to-calculate)) ERR_INVALID_DECREASE)
          true)

        (contract-call? .pool-0-reserve set-user-reserve-data who (contract-of asset) (merge user-data { use-as-collateral: enable-as-collateral }))
      )
    )
  )
)

(define-public (init
  (a-token-address principal)
  (asset principal)
  (decimals uint)
  (supply-cap uint)
  (borrow-cap uint)
  (oracle principal)
  (interest-rate-strategy-address principal))
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
        oracle: oracle,
        interest-rate-strategy-address: interest-rate-strategy-address,
        flashloan-enabled: false,
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

(define-public (set-reserve
  (asset principal)
  (state
    (tuple
      (last-liquidity-cumulative-index uint)
      (current-liquidity-rate uint)
      (total-borrows-stable uint)
      (total-borrows-variable uint)
      (current-variable-borrow-rate uint)
      (current-stable-borrow-rate uint)
      (current-average-stable-borrow-rate uint)
      (last-variable-borrow-cumulative-index uint)
      (base-ltv-as-collateral uint)
      (liquidation-threshold uint)
      (liquidation-bonus uint)
      (decimals uint)
      (a-token-address principal)
      (oracle principal)
      (interest-rate-strategy-address principal)
      (flashloan-enabled bool)
      (last-updated-block uint)
      (borrowing-enabled bool)
      (usage-as-collateral-enabled bool)
      (is-stable-borrow-rate-enabled bool)
      (supply-cap uint)
      (borrow-cap uint)
      (debt-ceiling uint)
      (is-active bool)
      (is-frozen bool)
    )))
  (begin
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (contract-call? .pool-reserve-data set-reserve-state asset state)
  )
)

(define-public (set-borrowing-enabled (asset principal) (enabled bool))
  (let ((reserve-data (get-reserve-state asset)))
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (contract-call? .pool-0-reserve set-reserve asset (merge reserve-data { borrowing-enabled: enabled }))))

(define-read-only (get-reserve-state (asset principal))
  (contract-call? .pool-0-reserve get-reserve-state asset))

(define-read-only (get-user-reserve-data (user principal) (asset principal))
  (contract-call? .pool-0-reserve get-user-reserve-data user asset))

(define-read-only (get-borroweable-isolated)
  (contract-call? .pool-0-reserve get-borroweable-isolated))

(define-public (set-usage-as-collateral-enabled
  (asset principal)
  (enabled bool)
  (base-ltv-as-collateral uint)
  (liquidation-threshold uint)
  (liquidation-bonus uint))
  (let (
    (reserve-data (get-reserve-state asset)))
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)

    (contract-call? .pool-0-reserve set-reserve
      asset
      (merge
        reserve-data
        {
          usage-as-collateral-enabled: enabled,
          base-ltv-as-collateral: base-ltv-as-collateral,
          liquidation-threshold: liquidation-threshold,
          liquidation-bonus: liquidation-bonus }))))

(define-public (add-isolated-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (contract-call? .pool-0-reserve set-isolated-asset asset)))

(define-public (add-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (contract-call? .pool-0-reserve add-asset asset)))

(define-public (remove-isolated-asset (asset principal))
  (begin
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (contract-call? .pool-0-reserve remove-isolated-asset asset)))

(define-public (set-borroweable-isolated (asset principal) (debt-ceiling uint))
  (let (
    (reserve-data (get-reserve-state asset))
    (borroweable-assets (get-borroweable-isolated)))
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (try! (contract-call? .pool-0-reserve set-borroweable-isolated
      (unwrap-panic (as-max-len? (append borroweable-assets asset) u100))))
    (contract-call? .pool-0-reserve set-reserve asset (merge reserve-data { debt-ceiling: debt-ceiling }))))

(define-public (remove-borroweable-isolated (asset principal))
  (let ((borroweable-assets (get-borroweable-isolated)))
    (asserts! (is-configurator tx-sender) ERR_UNAUTHORIZED)
    (ok
      (contract-call? .pool-0-reserve set-borroweable-isolated
        (get agg (fold filter-asset borroweable-assets { filter-by: asset, agg: (list) }))))))

(define-read-only (filter-asset (asset principal) (ret { filter-by: principal, agg: (list 100 principal) }))
  (if (is-eq asset (get filter-by ret))
    ret
    { filter-by: (get filter-by ret), agg: (unwrap-panic (as-max-len? (append (get agg ret) asset) u100)) }))

(define-constant ERR_UNAUTHORIZED (err u30000))
(define-constant ERR_BORROW_TOO_SMALL (err u30001))
(define-constant ERR_NOT_ZERO (err u30002))
(define-constant ERR_NOT_ENOUGH_COLLATERAL (err u30003))
(define-constant ERR_EXCEED_BORROW_CAP (err u30004))
(define-constant ERR_EXCEED_DEBT_CEIL (err u30005))
(define-constant ERR_BORROWING_DISABLED (err u30006))
(define-constant ERR_EXCEEDED_LIQ (err u30007))
(define-constant ERR_NOT_SILOED_ASSET (err u30008))
(define-constant ERR_INVALID_Z_TOKEN (err u30009))
(define-constant ERR_INVALID_ORACLE (err u30010))
(define-constant ERR_BORROWING_SUPPLIED_ASSET (err u30011))
(define-constant ERR_INACTIVE (err u30012))
(define-constant ERR_FROZEN (err u30013))
(define-constant ERR_SUPPLYING_BORROWED_ASSET (err u30014))
(define-constant ERR_FLASHLOAN_DISABLED (err u30015))
(define-constant ERR_REPAYMENT_SHOULD_BE_EXACT (err u30016))
(define-constant ERR_REPAY_BEFORE_DISABLING (err u30017))
(define-constant ERR_INVALID_DECREASE (err u30018))
(define-constant ERR_MUST_DISABLE_ISOLATED_ASSET (err u30019))
