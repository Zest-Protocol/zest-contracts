(use-trait ft .ft-trait.ft-trait)
(use-trait ft-mint-trait .ft-mint-trait.ft-mint-trait)
(use-trait a-token .a-token-trait.a-token-trait)
(use-trait flash-loan .flash-loan-trait.flash-loan-trait)
(use-trait oracle-trait .oracle-trait.oracle-trait)
(use-trait redeemeable-token .redeemeable-trait-v1-2.redeemeable-trait)

(define-constant ERR_UNAUTHORIZED (err u1000000000000))
(define-constant ERR_REWARDS_CONTRACT (err u1000000000001))
(define-constant ERR_NO_REWARDS (err u1000000000003))
(define-constant ERR_EXCEEDED_LIQ (err u1000000000004))
(define-constant ERR_FLASHLOAN_DISABLED (err u1000000000005))
(define-constant ERR_INACTIVE (err u1000000000006))
(define-constant ERR_FROZEN (err u1000000000007))
(define-constant ERR_NOT_ZERO (err u1000000000008))
(define-constant ERR_INVALID_Z_TOKEN (err u1000000000009))
(define-constant ERR_INVALID_ORACLE (err u1000000000010))
(define-constant ERR_NOT_DEPOSITED (err u1000000000011))
(define-constant ERR_HEALTH_FACTOR_GT_1 (err u1000000000012))
(define-constant ERR_NOT_ENABLED_AS_COLL (err u1000000000013))
(define-constant ERR_NO_DEBT (err u1000000000014))
(define-constant ERR_GRACE_PERIOD_NOT_SET (err u1000000000015))
(define-constant ERR_IN_GRACE_PERIOD (err u1000000000016))
(define-constant ERR_LIQUIDATION_CLOSE_FACTOR_NOT_SET (err u1000000000017))
(define-constant ERR_FREEZE_END_BLOCK_NOT_SET (err u1000000000018))
(define-constant ERR_GRACE_PERIOD_TIME_NOT_SET (err u1000000000019))
(define-constant ERR_NOT_ENOUGH_COLLATERAL_IN_RESERVE (err u1000000000020))
(define-constant ERR_E_MODE_BONUS_NOT_SET (err u1000000000021))
(define-constant ERR_ASSET_HAS_NO_E_MODE_TYPE (err u1000000000022))
(define-constant ERR_NOT_ENOUGH_FUNDS_RECEIVED (err u1000000000023))


(define-constant e-mode-disabled-type 0x00)
(define-constant one-8 u100000000)

(define-read-only (is-approved-sender (sender principal))
  (default-to false (contract-call? .flashloan-data get-approved-sender-read sender)))


(define-public (flashloan-liquidate
  (receiver principal)
  (asset <ft>)
  (amount uint)
  (flashloan-script <flash-loan>)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  (collateral-lp <a-token>)
  (collateral-to-liquidate <ft>)
  (debt-asset <ft>)
  (collateral-oracle <oracle-trait>)
  (debt-oracle <oracle-trait>)
  (liquidated-user principal)
  (debt-amount uint)
  (to-receive-atoken bool)
  (price-feed-bytes (optional (buff 8192)))
  )
  (let (
    (balance-before (try! (contract-call? asset get-balance receiver)))
  )
    (asserts! (is-approved-sender tx-sender) ERR_UNAUTHORIZED)

    (try! (write-feed price-feed-bytes))
    (try!
      (contract-call? .pool-borrow-v2-1 flashloan-liquidation-step-1
        receiver
        asset
        amount
        flashloan-script))

    (match (contract-call? .pool-borrow-v2-1 liquidation-call
        assets
        collateral-lp
        collateral-to-liquidate
        debt-asset
        collateral-oracle
        debt-oracle
        liquidated-user
        debt-amount
        to-receive-atoken)
        liquidation-result
          (begin
            (try! (contract-call? flashloan-script execute
                asset
                receiver
                (get collateral-to-liquidator liquidation-result)))
            (asserts!
              (>= 
                (-
                  (try! (contract-call? asset get-balance receiver))
                  balance-before
                )
                (+ amount (try! (get-protocol-fees asset amount)))
              )
              ERR_NOT_ENOUGH_FUNDS_RECEIVED
            )
            (try!
              (contract-call? .pool-borrow-v2-1 flashloan-liquidation-step-2
                receiver
                asset
                amount
                flashloan-script))
            (print { type: "flashloan-call", payload: { key: receiver, data: {
              reserve-state: (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset))) }}})
            (ok u0)
          )
        err-code (err err-code)
    )
  )
)

(define-read-only (get-protocol-fees (asset <ft>) (amount uint))
  (let (
    (total-fee-bps (try! (contract-call? .pool-0-reserve-v2-0 get-flashloan-fee-total (contract-of asset))))
    (protocol-fee-bps (try! (contract-call? .pool-0-reserve-v2-0 get-flashloan-fee-protocol (contract-of asset))))
    (amount-fee (/ (* amount total-fee-bps) u10000))
    (protocol-fee (/ (* amount-fee protocol-fee-bps) u10000))
    (reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset))))
  )
  (ok amount-fee)
  )
)

(define-public (flashloan
  (receiver principal)
  (asset <ft>)
  (amount uint)
  (flashloan-script <flash-loan>)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> }))
  (collateral-lp <a-token>)
  (collateral-to-liquidate <ft>)
  (debt-asset <ft>)
  (collateral-oracle <oracle-trait>)
  (debt-oracle <oracle-trait>)
  (liquidated-user principal)
  (debt-amount uint)
  (to-receive-atoken bool)
  (price-feed-bytes (optional (buff 8192)))
  )
  (let  (
    (write-ok (try! (write-feed price-feed-bytes)))
    (approved-sender-ok (asserts! (is-approved-sender tx-sender) ERR_UNAUTHORIZED))
    (assets-ok (try! (contract-call? .pool-borrow-v2-1 validate-assets assets)))
    (available-liquidity-before (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-available-liquidity asset)))
    (total-fee-bps (try! (contract-call? .pool-0-reserve-v2-0 get-flashloan-fee-total (contract-of asset))))
    (flashloan-protocol-fee-bps (try! (contract-call? .pool-0-reserve-v2-0 get-flashloan-fee-protocol (contract-of asset))))
    (amount-fee (/ (* amount total-fee-bps) u10000))
    (flashloan-protocol-fee (/ (* amount-fee flashloan-protocol-fee-bps) u10000))
    (reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset))))
    (collateral-reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of collateral-to-liquidate))))
    (user-collateral-balance (try! (contract-call? collateral-lp get-balance liquidated-user)))
    (borrower-reserve-data (contract-call? .pool-0-reserve-v2-0 get-user-reserve-data liquidated-user (contract-of collateral-to-liquidate)))
    (ret (try! (calculate-user-global-data liquidated-user assets)))
  )

    (try! (write-feed price-feed-bytes))
    (asserts! (>= available-liquidity-before amount) ERR_EXCEEDED_LIQ)
    (asserts! (and (> amount-fee u0) (> flashloan-protocol-fee u0)) ERR_NOT_ZERO)
    (asserts! (get flashloan-enabled reserve-data) ERR_FLASHLOAN_DISABLED)
    (asserts! (get is-active reserve-data) ERR_INACTIVE)
    (asserts! (not (get is-frozen reserve-data)) ERR_FROZEN)

    (try! (contract-call? .pool-borrow-v2-1 transfer-to-user asset receiver amount))

    ;; start liquidation flow
    (asserts! (not (get is-frozen collateral-reserve-data)) ERR_FROZEN)
    (asserts! (not (get is-frozen reserve-data)) ERR_FROZEN)
    (asserts! (is-eq (contract-of collateral-lp) (get a-token-address collateral-reserve-data)) ERR_INVALID_Z_TOKEN)
    (asserts! (is-eq (contract-of collateral-oracle) (get oracle collateral-reserve-data)) ERR_INVALID_ORACLE)
    (asserts! (is-eq (contract-of debt-oracle) (get oracle reserve-data)) ERR_INVALID_ORACLE)

    (begin
      ;; has deposited collateral
      (asserts! (> user-collateral-balance u0) ERR_NOT_DEPOSITED)
      ;; health factor below treshold
      (asserts! (get is-health-factor-below-treshold ret) ERR_HEALTH_FACTOR_GT_1)
      ;; collateral is enabled by user
      (asserts! (get use-as-collateral borrower-reserve-data) ERR_NOT_ENABLED_AS_COLL)

      (let (
        (borrowed-ret (unwrap-panic (contract-call? .pool-0-reserve-v2-0 get-user-borrow-balance liquidated-user debt-asset)))
        (debt-reserve-data (unwrap-panic (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of debt-asset))))
        (user-compounded-borrow-balance (get compounded-balance borrowed-ret))
        (user-borrow-balance-increase (get balance-increase borrowed-ret))
      )
        ;; check if collateral has a grace period
        (asserts!
          (or
            ;; grace-period disabled, always pass
            (not (unwrap! (contract-call? .pool-reserve-data-1 get-grace-period-enabled-read (contract-of collateral-to-liquidate)) ERR_GRACE_PERIOD_NOT_SET))
            (if (> (get total-borrow-balanceUSD ret) (get total-collateral-balanceUSD ret))
              ;; if it's bad debt, can liquidate
              true
              ;; if time passed is less than grace-period, fail, cannot liquidate
              (> (-
                burn-block-height
                (unwrap! (contract-call? .pool-reserve-data-1 get-freeze-end-block-read (contract-of collateral-to-liquidate)) ERR_FREEZE_END_BLOCK_NOT_SET))
                (unwrap! (contract-call? .pool-reserve-data-1 get-grace-period-time-read (contract-of collateral-to-liquidate)) ERR_GRACE_PERIOD_TIME_NOT_SET))
            )
          ) ERR_IN_GRACE_PERIOD)
        ;; not borrowing anything
        (asserts! (> user-compounded-borrow-balance u0) ERR_NO_DEBT)
        (let (
          (max-debt-to-liquidate
            (contract-call? .math-v2-0 mul-perc
              user-compounded-borrow-balance
              (get decimals debt-reserve-data)
              (unwrap! (contract-call? .pool-reserve-data get-liquidation-close-factor-percent-read (contract-of debt-asset)) ERR_LIQUIDATION_CLOSE_FACTOR_NOT_SET))
          )
          (debt-to-liquidate
            (if (> amount max-debt-to-liquidate)
              max-debt-to-liquidate
              amount))
          (available-collateral-principal
            (try! 
              (calculate-available-collateral-to-liquidate
                collateral-to-liquidate
                debt-asset
                collateral-oracle
                debt-oracle
                debt-to-liquidate
                user-collateral-balance
                liquidated-user)))
          (origination-fee (contract-call? .pool-0-reserve-v2-0 get-origination-fee-prc (contract-of collateral-to-liquidate)))
          (liquidation-protocol-fee (/ (* origination-fee (get liquidation-bonus-collateral available-collateral-principal)) u10000))
          (collateral-to-liquidator (- (get collateral-amount available-collateral-principal) liquidation-protocol-fee))
          (debt-needed (get debt-needed available-collateral-principal))
          ;; if borrower holds less collateral than there is purchasing power for, only purchase for available collateral
          (actual-debt-to-liquidate debt-needed)
          (fee-liquidated u0)
          (liquidated-collateral-for-fee u0)
        )
          ;; if liquidator wants underlying asset, check there is enough collateral
          (if (not to-receive-atoken)
            (asserts! (>= (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-available-liquidity collateral-to-liquidate)) (get collateral-amount available-collateral-principal)) ERR_NOT_ENOUGH_COLLATERAL_IN_RESERVE)
            false)

          ;; (try!
          ;;   (contract-call? .pool-0-reserve-v2-0 update-state-on-liquidation
          ;;     debt-asset
          ;;     collateral-to-liquidate
          ;;     liquidated-user
          ;;     tx-sender
          ;;     actual-debt-to-liquidate
          ;;     (+ liquidation-protocol-fee collateral-to-liquidator)
          ;;     fee-liquidated
          ;;     liquidated-collateral-for-fee
          ;;     user-borrow-balance-increase
          ;;     to-receive-atoken
          ;;   )
          ;; )
          (if to-receive-atoken
            (try! (contract-call? collateral-lp transfer-on-liquidation collateral-to-liquidator liquidated-user tx-sender))
            (begin
              (try! (contract-call? collateral-lp burn-on-liquidation collateral-to-liquidator liquidated-user))
              (try! (contract-call? .pool-borrow-v2-1 transfer-to-user collateral-to-liquidate tx-sender collateral-to-liquidator))
              u0
            )
          )
          (try! (contract-call? .pool-0-reserve-v2-0 transfer-to-reserve debt-asset tx-sender actual-debt-to-liquidate))

          (if (> liquidation-protocol-fee u0)
            (begin
              ;; burn users' lp and transfer to fee collection address
              (try! (contract-call? collateral-lp burn-on-liquidation liquidation-protocol-fee liquidated-user))
              (try! (contract-call? .pool-borrow-v2-1  transfer-to-user collateral-to-liquidate (contract-call? .pool-0-reserve-v2-0 get-collection-address) liquidation-protocol-fee))
              u0
            )
            u0
          )

          (try! (reduce-isolated-mode-debt-liquidation
            debt-asset
            actual-debt-to-liquidate
            liquidated-user
          ))
          ;; (ok actual-debt-to-liquidate)
        )
      )
    )
    
    ;; end liquidation flow

    (try! (contract-call? flashloan-script execute asset receiver amount))

    ;; force transfer of assets to vault
    (try!
      (contract-call? asset transfer
        (+ amount amount-fee)
        receiver
        .pool-vault
        none
      )
    )

    ;; (try!
    ;;   (contract-call? .pool-0-reserve-v2-0 update-state-on-flash-loan
    ;;     receiver
    ;;     asset
    ;;     available-liquidity-before
    ;;     (- amount-fee flashloan-protocol-fee)
    ;;     flashloan-protocol-fee
    ;;   )
    ;; )

    (print { type: "flashloan", payload: { key: receiver, data: { amount: amount, amount-fee: amount-fee, protocol-fee: flashloan-protocol-fee } } })
    (ok u0)
  )
)

(define-private (calculate-user-global-data
  (user principal)
  (assets-to-calculate (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> })))
  (let (
    (aggregate (try!
        (fold
          aggregate-user-data
          assets-to-calculate
          (ok
            {
              total-liquidity-balanceUSD: u0,
              total-collateral-balanceUSD: u0,
              total-borrow-balanceUSD: u0,
              user-total-feesUSD: u0,
              current-ltv: u0,
              current-liquidation-threshold: u0,
              user: user
            }))))
    (total-collateral-balanceUSD (get total-collateral-balanceUSD aggregate))
    (current-ltv
      (if (> total-collateral-balanceUSD u0)
        (div (get current-ltv aggregate) total-collateral-balanceUSD)
        u0))
    (current-liquidation-threshold
      (if (> total-collateral-balanceUSD u0)
        (div (get current-liquidation-threshold aggregate) total-collateral-balanceUSD)
        u0))
    (health-factor
      (calculate-health-factor-from-balances
        (get total-collateral-balanceUSD aggregate)
        (get total-borrow-balanceUSD aggregate)
        (get user-total-feesUSD aggregate)
        current-liquidation-threshold))
    (is-health-factor-below-treshold (< health-factor (get-health-factor-liquidation-threshold))))
    (ok {
      total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
      total-collateral-balanceUSD: total-collateral-balanceUSD,
      total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
      user-total-feesUSD: (get user-total-feesUSD aggregate),
      current-ltv: current-ltv,
      current-liquidation-threshold: current-liquidation-threshold,
      health-factor: health-factor,
      is-health-factor-below-treshold: is-health-factor-below-treshold
    })
  )
)

(define-private (aggregate-user-data
  (reserve { asset: <ft>, lp-token: <ft>, oracle: <oracle-trait> })
  (total
    (response
      (tuple
        (total-liquidity-balanceUSD uint)
        (total-collateral-balanceUSD uint)
        (total-borrow-balanceUSD uint)
        (user-total-feesUSD uint)
        (user principal)
        (current-ltv uint)
        (current-liquidation-threshold uint)
      )
      uint
    )))
  (let (
    (result (try! total)))
    (get-user-basic-reserve-data
      (get lp-token reserve)
      (get asset reserve)
      (get oracle reserve)
      result )))

(define-private (get-user-basic-reserve-data
  (lp-token <ft>)
  (asset <ft>)
  (oracle <oracle-trait>)
  (aggregate {
    total-liquidity-balanceUSD: uint,
    total-collateral-balanceUSD: uint,
    total-borrow-balanceUSD: uint,
    user-total-feesUSD: uint,
    current-ltv: uint,
    current-liquidation-threshold: uint,
    user: principal
  })
  )
  (let (
    (user (get user aggregate))
    (user-reserve-state (contract-call? .pool-0-reserve-v2-0 get-user-reserve-data user (contract-of asset)))
    (reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset))))
    (default-reserve-value
      {
        total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
        total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
        total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
        user-total-feesUSD: (get user-total-feesUSD aggregate),
        current-ltv: (get current-ltv aggregate),
        current-liquidation-threshold: (get current-liquidation-threshold aggregate),
        user: user
      }
    )
  )
    (if (or (> (get principal-borrow-balance user-reserve-state) u0) (get use-as-collateral user-reserve-state))
      ;; if borrowing or using as collateral
      (get-user-asset-data lp-token asset oracle aggregate)
      ;; add nothing
      (ok default-reserve-value)
    )
  )
)

(define-private (get-user-asset-data
  (lp-token <ft>)
  (asset <ft>)
  (oracle <oracle-trait>)
  (aggregate {
    total-liquidity-balanceUSD: uint,
    total-collateral-balanceUSD: uint,
    total-borrow-balanceUSD: uint,
    user-total-feesUSD: uint,
    current-ltv: uint,
    current-liquidation-threshold: uint,
    user: principal
  })
  )
  (let (
    (user (get user aggregate))
    (reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset))))
    (is-lp-ok (asserts! (is-eq (get a-token-address reserve-data) (contract-of lp-token)) ERR_INVALID_Z_TOKEN))
    (is-oracle-ok (asserts! (is-eq (get oracle reserve-data) (contract-of oracle)) ERR_INVALID_ORACLE))
    (user-reserve-state (try! (contract-call? .pool-0-reserve-v2-0 get-user-balance-reserve-data lp-token asset user oracle)))
    (reserve-unit-price (try! (contract-call? oracle get-asset-price asset)))
    (e-mode-config (try! (get-e-mode-config user (contract-of asset))))
    ;; liquidity and collateral balance
    (liquidity-balanceUSD (mul-to-fixed-precision (get underlying-balance user-reserve-state) (get decimals reserve-data) reserve-unit-price))
    (supply-state
      (if (> (get underlying-balance user-reserve-state) u0)
        (if (and (get usage-as-collateral-enabled reserve-data) (get use-as-collateral user-reserve-state))
          {
            total-liquidity-balanceUSD: (+ (get total-liquidity-balanceUSD aggregate) liquidity-balanceUSD),
            total-collateral-balanceUSD: (+ (get total-collateral-balanceUSD aggregate) liquidity-balanceUSD),
            current-ltv: (+ (get current-ltv aggregate) (mul liquidity-balanceUSD (get ltv e-mode-config))),
            current-liquidation-threshold: (+ (get current-liquidation-threshold aggregate) (mul liquidity-balanceUSD (get liquidation-threshold e-mode-config)))
          }
          {
            total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
            total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
            current-ltv: (get current-ltv aggregate),
            current-liquidation-threshold: (get current-liquidation-threshold aggregate)
          }
        )
        {
          total-liquidity-balanceUSD: (get total-liquidity-balanceUSD aggregate),
          total-collateral-balanceUSD: (get total-collateral-balanceUSD aggregate),
          current-ltv: (get current-ltv aggregate),
          current-liquidation-threshold: (get current-liquidation-threshold aggregate)
        }
      )
    )
    (borrow-state
      (if (> (get compounded-borrow-balance user-reserve-state) u0)
        {
          total-borrow-balanceUSD:
            (+ 
              (get total-borrow-balanceUSD aggregate)
              (mul-to-fixed-precision (get compounded-borrow-balance user-reserve-state) (get decimals reserve-data) reserve-unit-price)
            ),
          user-total-feesUSD: u0
        }
        {
          total-borrow-balanceUSD: (get total-borrow-balanceUSD aggregate),
          user-total-feesUSD: (get user-total-feesUSD aggregate)
        }
      )
    )
  )
    (ok
      (merge
        (merge
          supply-state
          borrow-state
        )
        { user: user }
      )
    )
  )
)

(define-read-only (calculate-health-factor-from-balances
  (total-collateral-balanceUSD uint)
  (total-borrow-balanceUSD uint)
  (total-feesUSD uint)
  (current-liquidation-threshold uint))
  (if (is-eq total-borrow-balanceUSD u0)
    max-value
    (div
      (mul
        total-collateral-balanceUSD
        current-liquidation-threshold
      )
      (+ total-borrow-balanceUSD u0)
    )
  )
)

;; if user is in e-mode and the asset is of type of the e-mode enabled
(define-read-only (get-e-mode-config (user principal) (asset principal))
  (let (
    (user-e-mode (default-to 0x00 (contract-call? .pool-reserve-data-2 get-user-e-mode-read user)))
    (asset-e-mode (get-asset-e-mode-type asset))
    (reserve-data (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state asset)))
  )
    (if (and (not (is-eq user-e-mode e-mode-disabled-type)) (is-eq asset-e-mode user-e-mode))
      (ok (get-e-mode-type-config (get-asset-e-mode-type asset)))
      (ok 
        { 
          ltv: (get base-ltv-as-collateral reserve-data),
          liquidation-threshold: (get liquidation-threshold reserve-data)
        }
      )
    )
  )
)


(define-read-only (get-health-factor-liquidation-threshold)
  (contract-call? .pool-reserve-data get-health-factor-liquidation-threshold-read))


(define-read-only (get-asset-e-mode-type (asset principal))
  (default-to
    e-mode-disabled-type
    (contract-call? .pool-reserve-data-2 get-asset-e-mode-type-read asset)))

(define-read-only (get-e-mode-type-config (type (buff 1)))
  (default-to
    { ltv: u0, liquidation-threshold: u0 }
    (contract-call? .pool-reserve-data-2 get-e-mode-type-config-read type)))

(define-private
  (reduce-isolated-mode-debt-liquidation
    (borrowed-asset <ft>)
    (amount uint)
    (user principal)
  )
  (begin
    (let ((is-in-isolation-mode (contract-call? .pool-0-reserve-v2-0 is-in-isolation-mode user)))
      (match is-in-isolation-mode
        isolated-asset (begin
          (try! (reduce-isolated-mode-debt isolated-asset borrowed-asset amount))
        )
        true
      )
    )
    (ok true)
  )
)

(define-private (reduce-isolated-mode-debt
  (isolated-asset principal)
  (borrowed-asset <ft>)
  (amount uint))
  (let (
    (borrowed-asset-principal (contract-of borrowed-asset))
    (isolated-reserve (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state isolated-asset)))
    (borrowed-asset-reserve (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state borrowed-asset-principal)))
    (asset-isolated-debt (default-to u0 (contract-call? .pool-reserve-data-3 get-asset-isolation-mode-debt-read isolated-asset borrowed-asset-principal)))
  )
    ;; amount paid back can be bigger because it's paying interest + principal
    (if (> amount asset-isolated-debt)
      (try! (contract-call? .pool-reserve-data-3 set-asset-isolation-mode-debt
        isolated-asset
        borrowed-asset-principal
        u0
      ))
      (try! (contract-call? .pool-reserve-data-3 set-asset-isolation-mode-debt
        isolated-asset
        borrowed-asset-principal
        (- asset-isolated-debt amount)))
    )
    (ok true)
  )
)

(define-private (calculate-available-collateral-to-liquidate
  (collateral <ft>)
  (principal-asset <ft>)
  (collateral-oracle <oracle-trait>)
  (principal-oracle <oracle-trait>)
  (debt-to-liquidate uint)
  (user-collateral-balance uint)
  (user principal)
  )
  (let (
    (collateral-price (try! (contract-call? collateral-oracle get-asset-price collateral)))
    (debt-currency-price (try! (contract-call? principal-oracle get-asset-price principal-asset)))
    (collateral-reserve-data (unwrap-panic (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of collateral))))
    (principal-reserve-data (unwrap-panic (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of principal-asset))))
    (liquidation-bonus (try! (get-liquidation-bonus user collateral)))
    (original-collateral-purchasing-power
      (contract-call? .math-v2-0 get-y-from-x
        debt-to-liquidate
        (get decimals principal-reserve-data)
        (get decimals collateral-reserve-data)
        debt-currency-price
        collateral-price))
    (max-collateral-amount-from-debt
      (contract-call? .math-v2-0 mul-perc
        original-collateral-purchasing-power
        (get decimals collateral-reserve-data)
        (+ one-8 liquidation-bonus))))
    (ok
      (if (> max-collateral-amount-from-debt user-collateral-balance)
        (let (
          (liquidation-bonus-amount (contract-call? .math-v2-0 mul-perc
                user-collateral-balance
                (get decimals collateral-reserve-data)
                (- one-8 (contract-call? .math-v2-0 div one-8 (+ one-8 liquidation-bonus)))))
        )
          {
            collateral-amount: user-collateral-balance,
            debt-needed:
              (contract-call? .math-v2-0 mul-perc
                (contract-call? .math-v2-0 get-y-from-x
                  user-collateral-balance
                  (get decimals collateral-reserve-data)
                  (get decimals principal-reserve-data)
                  collateral-price
                  debt-currency-price
                )
                (get decimals principal-reserve-data)
                (contract-call? .math-v2-0 div one-8 (+ one-8 liquidation-bonus))
              ),
            liquidation-bonus-collateral: liquidation-bonus-amount,
            collateral-price: collateral-price,
            debt-currency-price: debt-currency-price
          }
        )
        {
          collateral-amount: max-collateral-amount-from-debt,
          debt-needed: debt-to-liquidate,
          liquidation-bonus-collateral: (- max-collateral-amount-from-debt original-collateral-purchasing-power),
          collateral-price: collateral-price,
          debt-currency-price: debt-currency-price
        }
      )
    )
  )
)


(define-read-only (get-liquidation-bonus (who principal) (asset <ft>))
  (let (
    (user-e-mode (contract-call? .pool-0-reserve-v2-0 get-user-e-mode who))
  )
    (if 
      (and
        (not (is-eq user-e-mode e-mode-disabled-type))
        (is-eq (contract-call? .pool-0-reserve-v2-0 get-asset-e-mode-type (contract-of asset)) user-e-mode))
      (ok (unwrap! (contract-call? .pool-reserve-data-4 get-liquidation-bonus-e-mode-read (contract-of asset)) ERR_E_MODE_BONUS_NOT_SET))
      (ok (get liquidation-bonus (try! (contract-call? .pool-0-reserve-v2-0 get-reserve-state (contract-of asset)))))
    )
  )
)

(define-private (write-feed (price-feed-bytes (optional (buff 8192))))
  (match price-feed-bytes
    bytes (begin
      (try! 
        (contract-call? .pyth-oracle-v3 verify-and-update-price-feeds
          bytes
          {
            pyth-storage-contract: .pyth-storage-v3,
            pyth-decoder-contract: .pyth-pnau-decoder-v2,
            wormhole-core-contract: .wormhole-core-v3,
          }
        )
      )
      (ok true)
    )
    (begin
      (print "no-feed-update")
      ;; do nothing if none
      (ok true)
    )
  )
)


;; BEGIN MATH
(define-constant fixed-precision u8)

(define-constant max-value u340282366920938463463374607431768211455)

(define-constant e 271828182)
;; (* u144 u365 u10 u60)
(define-constant seconds-in-year u31536000)

(define-read-only (get-max-value)
  max-value
)

(define-read-only (mul (x uint) (y uint))
  (/ (+ (* x y) (/ one-8 u2)) one-8))

(define-read-only (div (x uint) (y uint))
  (/ (+ (* x one-8) (/ y u2)) y))

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (mul (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (mul (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (div-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (div (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (div (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (div-precision-to-fixed (a uint) (b uint) (decimals uint))
  (let (
    (result (/ (* a (pow u10 decimals)) b)))
    (to-fixed result decimals)
  )
)

;; Multiply a number with arbitrary decimals with a fixed-precision number
;; return number with arbitrary decimals
(define-read-only (mul-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    ;; convert a and b-fixed in decimals-a precision
    ;; result is in decimals-a precision
    (mul-arbitrary a (* b-fixed (pow u10 (- decimals-a fixed-precision))) decimals-a)
    ;; convert a to fixed precision
    ;; result is in fixed precision, convert to decimals-a
    (/
      (mul-arbitrary (* a (pow u10 (- fixed-precision decimals-a))) b-fixed u8)
      (pow u10 (- fixed-precision decimals-a)))
  )
)

;; Divide a number with arbitrary decimals by a fixed-precision number, then return to
;; number with arbitrary decimals
(define-read-only (div-precision-with-factor (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    ;; convert b-fixed to decimals-a precision
    ;; final result is in decimals-a precision
    (div-arbitrary a (* b-fixed (pow u10 (- decimals-a fixed-precision))) decimals-a)
    ;; convert a to fixed precision
    ;; result is in fixed precision, convert to decimals-a
    (/
      (div-arbitrary (* a (pow u10 (- fixed-precision decimals-a))) b-fixed u8)
      (pow u10 (- fixed-precision decimals-a)))
  )
)

(define-read-only (mul-arbitrary (x uint) (y uint) (arbitrary-prec uint))
  (/ (+ (* x y) (/ (pow u10 arbitrary-prec) u2)) (pow u10 arbitrary-prec)))

(define-read-only (div-arbitrary (x uint) (y uint) (arbitrary-prec uint))
  (/ (+ (* x (pow u10 arbitrary-prec)) (/ y u2)) y))

(define-read-only (add-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (+ (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (+ (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (sub-precision-to-fixed (a uint) (decimals-a uint) (b-fixed uint))
  (if (> decimals-a fixed-precision)
    (- (/ a (pow u10 (- decimals-a fixed-precision))) b-fixed)
    (- (* a (pow u10 (- fixed-precision decimals-a))) b-fixed)
  )
)

(define-read-only (to-fixed (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (/ a (pow u10 (- decimals-a fixed-precision)))
    (* a (pow u10 (- fixed-precision decimals-a)))
  )
)

;; multiply a number of arbitrary precision with a 8-decimals fixed number
;; convert back to unit of arbitrary precision
(define-read-only (mul-perc (a uint) (decimals-a uint) (b-fixed uint))
  (mul-precision-with-factor a decimals-a b-fixed)
)

(define-read-only (fix-precision (a uint) (decimals-a uint) (b uint) (decimals-b uint))
  (let (
    (a-standard
      (if (> decimals-a fixed-precision)
        (/ a (pow u10 (- decimals-a fixed-precision)))
        (* a (pow u10 (- fixed-precision decimals-a)))
      ))
    (b-standard
      (if (> decimals-b fixed-precision)
        (/ b (pow u10 (- decimals-b fixed-precision)))
        (* b (pow u10 (- fixed-precision decimals-b)))
      ))
  )
    {
      a: a-standard,
      decimals-a: decimals-a,
      b: b-standard,
      decimals-b: decimals-b,
    }
  )
)

(define-read-only (from-fixed-to-precision (a uint) (decimals-a uint))
  (if (> decimals-a fixed-precision)
    (* a (pow u10 (- decimals-a fixed-precision)))
    (/ a (pow u10 (- fixed-precision decimals-a)))
  )
)

;; x-price and y-price are in fixed precision
(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (if (> x-decimals y-decimals)
    ;; decrease decimals if x has more decimals
    (/ (div-precision-with-factor (mul-precision-with-factor x x-decimals x-price) x-decimals y-price) (pow u10 (- x-decimals y-decimals)))
    ;; do operations in the amounts with greater decimals, convert x to y-decimals
    (div-precision-with-factor (mul-precision-with-factor ( * x (pow u10 (- y-decimals x-decimals))) y-decimals x-price) y-decimals y-price)
  )
)

(define-read-only (is-odd (x uint))
  (not (is-even x))
)

(define-read-only (is-even (x uint))
  (is-eq (mod x u2) u0)
)

;; rate in 8-fixed
;; n-blocks
(define-read-only (get-rt-by-block (rate uint) (delta uint))
  (if (is-eq delta u0)
    u0
    (let (
      (start-time (unwrap-panic (get-stacks-block-info? time (- stacks-block-height delta))))
      ;; add 5 seconds
      (end-time (+ u5 (unwrap-panic (get-stacks-block-info? time (- stacks-block-height u1)))))
      (delta-time (- end-time start-time))
    )
      (/ (* rate delta-time) seconds-in-year)
    )
  )
)

(define-read-only (get-e) e)

(define-read-only (get-one) one-8)

(define-read-only (get-seconds-in-year)
  seconds-in-year
)

(define-constant fact_2 u200000000)
;; (mul u300000000 u200000000)
(define-constant fact_3 u600000000)
;; (mul u400000000 (mul u300000000 u200000000))
(define-constant fact_4 u2400000000)
;; (mul u500000000 (mul u400000000 (mul u300000000 u200000000)))
(define-constant fact_5 u12000000000)
;; (mul u600000000 (mul u500000000 (mul u400000000 (mul u300000000 u200000000))))
(define-constant fact_6 u72000000000)

;; taylor series expansion to the 6th degree to estimate e^x
(define-read-only (taylor-6 (x uint))
  (let (
    (x_2 (mul x x))
    (x_3 (mul x x_2))
    (x_4 (mul x x_3))
    (x_5 (mul x x_4))
  )
    (+
      one-8 x
      (div x_2 fact_2)
      (div x_3 fact_3)
      (div x_4 fact_4)
      (div x_5 fact_5)
      (div (mul x x_5) fact_6)
    )
  )
)