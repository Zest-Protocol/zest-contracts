(use-trait ft .ft-trait.ft-trait)
(use-trait a-token .a-token-trait.a-token-trait)
(use-trait oracle .oracle-trait.oracle-trait)

(define-constant ERR_HEALTH_FACTOR_GT_1 (err u90000))
(define-constant ERR_NOT_DEPOSITED (err u90001))
(define-constant ERR_UNAUTHORIZED (err u90002))
(define-constant ERR_NOT_ENABLED_AS_COLL (err u90003))
(define-constant ERR_NO_COLLATERAL (err u90004))
(define-constant ERR_NOT_ENOUGH_COLLATERAL_IN_RESERVE (err u90005))
(define-constant ERR_NOT_SET (err u90006))
(define-constant ERR_IN_GRACE_PERIOD (err u90007))


(define-constant one-8 (contract-call? .math get-one))

(define-read-only (get-liquidation-close-factor-percent (asset principal))
  (unwrap-panic (contract-call? .pool-reserve-data get-liquidation-close-factor-percent-read asset)))

(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y))

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y))


(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle> })))
  (let (
    (global-user-data (try! (contract-call? .pool-0-reserve-v1-2 calculate-user-global-data user assets))))
    (ok {
      total-liquidity-balanceUSD: (get total-liquidity-balanceUSD global-user-data),
      total-collateral-balanceUSD: (get total-collateral-balanceUSD global-user-data),
      total-borrow-balanceUSD: (get total-borrow-balanceUSD global-user-data),
      total-feesUSD: (get user-total-feesUSD global-user-data),
      current-ltv: (get current-ltv global-user-data),
      current-liquidation-threshold: (get current-liquidation-threshold global-user-data),
      health-factor: (get health-factor global-user-data),
      is-health-factor-below-treshold: (get is-health-factor-below-treshold global-user-data)
    })))

;; liquidates 1 undercollateralized position
(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle> }))
  (lp-token <a-token>)
  (collateral <ft>)
  (debt-asset <ft>)
  (collateral-oracle <oracle>)
  (debt-asset-oracle <oracle>)
  (user principal) ;; address of borrower
  (debt-purchase-amount uint) ;; principal amount that liquidator wants to repay
  (to-receive-atoken bool)
  )
  (begin
    (asserts! (is-lending-pool contract-caller) ERR_UNAUTHORIZED)
    (let (
      (ret (try! (calculate-user-global-data user assets)))
      (user-collateral-balance (try! (contract-call? lp-token get-balance user)))
      (collateral-reserve-data (try! (get-reserve-state collateral)))
      (borrower-reserve-data (unwrap-panic (get-user-reserve-state user collateral)))
    )
      ;; has deposited collateral
      (asserts! (> user-collateral-balance u0) ERR_NOT_DEPOSITED)
      ;; health factor below treshold
      (asserts! (get is-health-factor-below-treshold ret) ERR_HEALTH_FACTOR_GT_1)
      ;; collateral is enabled in asset reserve and by user
      (asserts! (get use-as-collateral borrower-reserve-data) ERR_NOT_ENABLED_AS_COLL)
      ;; check if collateral has a grace period
      ;; if grace-period disabled, continue
      ;; else check enough time has passed
      (asserts!
        (or
          (not (try! (get-grace-period-enabled collateral)))
          (> (- burn-block-height (try! (get-freeze-end-block collateral))) (try! (get-grace-period-time collateral)))
        ) ERR_IN_GRACE_PERIOD)

      (let (
        (borrowed-ret (unwrap-panic (get-user-borrow-balance user debt-asset)))
        (debt-reserve-data (unwrap-panic (get-reserve-state debt-asset)))
        (user-compounded-borrow-balance (get compounded-balance borrowed-ret))
        (user-borrow-balance-increase (get balance-increase borrowed-ret))
      )
        ;; not borrowing anything
        (asserts! (> user-compounded-borrow-balance u0) ERR_NO_COLLATERAL)
        (let (
          (max-debt-to-liquidate
            (contract-call? .math mul-perc
              user-compounded-borrow-balance
              (get decimals debt-reserve-data)
              (get-liquidation-close-factor-percent (contract-of debt-asset))))
          (debt-to-liquidate
            (if (> debt-purchase-amount max-debt-to-liquidate)
              max-debt-to-liquidate
              debt-purchase-amount))
          (available-collateral-principal
            (try! 
              (calculate-available-collateral-to-liquidate
                collateral
                debt-asset
                collateral-oracle
                debt-asset-oracle
                debt-to-liquidate
                user-collateral-balance)))
          (origination-fee (get-origination-fee-prc (contract-of collateral)))
          (protocol-fee (/ (* origination-fee (get liquidation-bonus-collateral available-collateral-principal)) u10000))
          (collateral-to-liquidator (- (get collateral-amount available-collateral-principal) protocol-fee))
          (debt-needed (get debt-needed available-collateral-principal))
          (purchasing-all-underlying-collateral (< debt-needed debt-to-liquidate))
          ;; if borrower holds less collateral than there is purchasing power for, only purchase for available collateral
          (actual-debt-to-liquidate
            (if purchasing-all-underlying-collateral
              debt-needed
              debt-to-liquidate))
          (fee-liquidated u0)
          (liquidated-collateral-for-fee u0)
        )
          ;; if liquidator wants underlying asset, check there is enough collateral
          (if (not to-receive-atoken)
            (asserts! (>= (try! (get-reserve-available-liquidity collateral)) (get collateral-amount available-collateral-principal)) ERR_NOT_ENOUGH_COLLATERAL_IN_RESERVE)
            false)

          (try!
            (contract-call? .pool-0-reserve-v1-2 update-state-on-liquidation
              debt-asset
              collateral
              user
              tx-sender
              actual-debt-to-liquidate
              (+ protocol-fee collateral-to-liquidator)
              fee-liquidated
              liquidated-collateral-for-fee
              user-borrow-balance-increase
              to-receive-atoken
            )
          )
          (if to-receive-atoken
            (try! (contract-call? lp-token transfer-on-liquidation collateral-to-liquidator user tx-sender))
            (begin
              (try! (contract-call? lp-token burn-on-liquidation collateral-to-liquidator user))
              (try! (contract-call? .pool-0-reserve-v1-2 transfer-to-user collateral tx-sender collateral-to-liquidator))))
          (try! (contract-call? .pool-0-reserve-v1-2 transfer-to-reserve debt-asset tx-sender actual-debt-to-liquidate))

          (if (> protocol-fee u0)
            (begin
              ;; burn users' lp and transfer to fee collection address
              (try! (contract-call? lp-token burn-on-liquidation protocol-fee user))
              (try! (contract-call? .pool-0-reserve-v1-2 transfer-to-user collateral (contract-call? .pool-0-reserve-v1-2 get-collection-address) protocol-fee)))
            u0)
        )
      )
      (ok u0)
    )
  )
)

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (div-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math div-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (get-origination-fee-prc (asset principal))
  (contract-call? .pool-0-reserve-v1-2 get-origination-fee-prc asset))

(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (contract-call? .math get-y-from-x x x-decimals y-decimals x-price y-price)
)

(define-data-var lending-pool principal .pool-borrow-v1-2)

(define-data-var admin principal tx-sender)
(define-read-only (is-admin (caller principal))
  (if (is-eq caller (var-get admin)) true false))

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set admin new-admin))))

(define-public (set-lending-pool (new-lending-pool principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (ok (var-set lending-pool new-lending-pool))))

(define-read-only (is-lending-pool (caller principal))
  (if (is-eq caller (var-get lending-pool)) true false))

(define-public (calculate-available-collateral-to-liquidate
  (collateral <ft>)
  (principal-asset <ft>)
  (collateral-oracle <oracle>)
  (principal-oracle <oracle>)
  (debt-to-liquidate uint)
  (user-collateral-balance uint))
  (let (
    (collateral-price (try! (contract-call? collateral-oracle get-asset-price collateral)))
    (debt-currency-price (try! (contract-call? principal-oracle get-asset-price principal-asset)))
    (collateral-reserve-data (unwrap-panic (get-reserve-state collateral)))
    (principal-reserve-data (unwrap-panic (get-reserve-state principal-asset)))
    (liquidation-bonus (get liquidation-bonus collateral-reserve-data))
    (original-collateral-purchasing-power
      (contract-call? .math get-y-from-x
        debt-to-liquidate
        (get decimals principal-reserve-data)
        (get decimals collateral-reserve-data)
        debt-currency-price
        collateral-price))
    (max-collateral-amount-from-debt
      (contract-call? .math mul-perc
        original-collateral-purchasing-power
        (get decimals collateral-reserve-data)
        (+ one-8 (get liquidation-bonus collateral-reserve-data)))))
    (ok
      (if (> max-collateral-amount-from-debt user-collateral-balance)
        {
          collateral-amount: user-collateral-balance,
          debt-needed:
            (contract-call? .math mul-perc
              (contract-call? .math get-y-from-x
                user-collateral-balance
                (get decimals collateral-reserve-data)
                (get decimals principal-reserve-data)
                collateral-price
                debt-currency-price
              )
              (get decimals principal-reserve-data)
              (contract-call? .math div one-8 (+ one-8 liquidation-bonus))
            ),
          liquidation-bonus-collateral:
            (contract-call? .math mul-perc
              user-collateral-balance
              (get decimals collateral-reserve-data)
              (get liquidation-bonus collateral-reserve-data)),
          collateral-price: collateral-price,
          debt-currency-price: debt-currency-price
        }
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

(define-read-only (get-user-origination-fee (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve-v1-2 get-user-origination-fee who asset)
)

(define-read-only (get-liquidation-bonus (asset <ft>))
  (ok (get liquidation-bonus (try! (get-reserve-state asset))))
)

(define-public (get-user-borrow-balance (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve-v1-2 get-user-borrow-balance who asset)
)

(define-public (get-reserve-state (asset <ft>))
  (contract-call? .pool-0-reserve-v1-2 get-reserve-state (contract-of asset))
)

(define-public (get-freeze-end-block (asset <ft>))
  (ok (unwrap! (contract-call? .pool-reserve-data-1 get-freeze-end-block-read (contract-of asset)) ERR_NOT_SET))
)

(define-public (get-grace-period-time (asset <ft>))
  (ok (unwrap! (contract-call? .pool-reserve-data-1 get-grace-period-time-read (contract-of asset)) ERR_NOT_SET))
)

(define-public (get-grace-period-enabled (asset <ft>))
  (ok (unwrap! (contract-call? .pool-reserve-data-1 get-grace-period-enabled-read (contract-of asset)) ERR_NOT_SET))
)

(define-public (get-user-reserve-state (user principal) (asset <ft>))
  (ok (contract-call? .pool-0-reserve-v1-2 get-user-reserve-data user (contract-of asset)))
)

(define-public (get-reserve-available-liquidity (asset <ft>))
  (contract-call? .pool-0-reserve-v1-2 get-reserve-available-liquidity asset)
)

