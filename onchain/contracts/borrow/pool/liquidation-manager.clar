(use-trait ft .ft-trait.ft-trait)
(use-trait a-token .a-token-trait.a-token-trait)
(use-trait oracle .oracle-trait.oracle-trait)

;; 50%
(define-data-var liquidation-close-factor-percent uint u50000000)


(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-constant one-8 (contract-call? .math get-one))

(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle> }))
)
  (let (
    (global-user-data (try! (contract-call? .pool-0-reserve calculate-user-global-data user assets)))
  )
    (ok {
      total-liquidity-balanceUSD: (get total-liquidity-balanceUSD global-user-data),
      total-collateral-balanceUSD: (get total-collateral-balanceUSD global-user-data),
      total-borrow-balanceUSD: (get total-borrow-balanceUSD global-user-data),
      total-feesUSD: (get user-total-feesUSD global-user-data),
      current-ltv: (get current-ltv global-user-data),
      current-liquidation-threshold: (get current-liquidation-threshold global-user-data),
      health-factor: (get health-factor global-user-data),
      is-health-factor-below-treshold: (get is-health-factor-below-treshold global-user-data)
    })
  )
)

;; liquidates 1 undercollateralized position
(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: <oracle> }))
  (lp-token <a-token>)
  (collateral <ft>)  ;; borrowed asset
  (principal <ft>) ;; principal
  (collateral-oracle <oracle>)
  (principal-oracle <oracle>)
  (user principal) ;; address of borrower
  (purchase-amount uint) ;; principal amount that liquidator wants to repay
  (to-receive-atoken bool)
  )
  (let (
    (ret (try! (calculate-user-global-data user assets)))
    (user-collateral-balance (try! (get-user-underlying-asset-balance lp-token collateral user)))
  )
    ;; health factor below treshold
    (print {ret: ret})
    (print {user-collateral-balance: user-collateral-balance})
    (asserts! (get is-health-factor-below-treshold ret) (err u1))
    ;; has deposited collateral
    (asserts! (> user-collateral-balance u0) (err u2))
    ;; collateral is enabled in asset reserve and by user
    (asserts! (and
        (is-reserve-collateral-enabled-as-collateral (contract-of collateral))
        (is-user-collateral-enabled-as-collateral user collateral)
      ) (err u3))

    (let (
      (borrowed-ret (unwrap-panic (get-user-borrow-balance user principal)))
      (user-compounded-borrow-balance (get compounded-balance borrowed-ret))
      (user-borrow-balance-increase (get balance-increase borrowed-ret))
    )

      (print {borrower-borrow-info: borrowed-ret})
      ;; not borrowing anything
      (asserts! (> user-compounded-borrow-balance u0) (err u4))

      (let (
        (max-debt-to-liquidate
          (mul
            user-compounded-borrow-balance
            (var-get liquidation-close-factor-percent)
          )
        )
        (debt-to-liquidate
          (if (> purchase-amount max-debt-to-liquidate)
            max-debt-to-liquidate
            purchase-amount
          )
        )
        (available-collateral-principal
          (try! 
            (calculate-available-collateral-to-liquidate
              collateral
              principal
              collateral-oracle
              principal-oracle
              debt-to-liquidate
              user-collateral-balance
            )
          )
        )
        (max-collateral-to-liquidate (get collateral-amount available-collateral-principal))
        (debt-needed (get debt-needed available-collateral-principal))
        (origination-fee (get-user-origination-fee user principal))
        (draw (print {draw: {
          max-debt-to-liquidate: max-debt-to-liquidate,
          debt-to-liquidate: debt-to-liquidate,
          purchasing-more-than-available: (> purchase-amount max-debt-to-liquidate),
          max-collateral-to-liquidate: max-collateral-to-liquidate,
          debt-needed: debt-needed,
          origination-fee: origination-fee,
          }}))
        (required-fees
          (if (> origination-fee u0)
            ;; if fees, take into account when calcualting available collateral
            (begin
              (try!
                (calculate-available-collateral-to-liquidate
                  collateral
                  principal
                  collateral-oracle
                  principal-oracle
                  origination-fee
                  (- user-collateral-balance max-collateral-to-liquidate)
                )
              )
            )
            (begin
              {
                collateral-amount: u0,
                debt-needed: u0
              }
            )
          )
        )
        (draw-1 (print { draw-1: available-collateral-principal}))
        (actual-debt-to-liquidate
          (if (< debt-needed debt-to-liquidate)
            debt-needed
            debt-to-liquidate
          )
        )
        (fee-liquidated (get debt-needed required-fees))
        (liquidated-collateral-for-fee (get collateral-amount required-fees))
      )
        ;; if liquidator wants underlying asset, check there is enough collateral
        (if (not to-receive-atoken)
          (let (
            (current-available-collateral (try! (get-reserve-available-liquidity collateral)))
          )
            (asserts! (>= current-available-collateral max-collateral-to-liquidate) (err u5))
            true
          )
          false
        )

        (try!
          (contract-call? .pool-0-reserve update-state-on-liquidation
            principal
            collateral
            user
            actual-debt-to-liquidate
            max-collateral-to-liquidate
            fee-liquidated
            liquidated-collateral-for-fee
            user-borrow-balance-increase
            to-receive-atoken
          )
        )
        (if to-receive-atoken
          (begin
            (try! (contract-call? lp-token transfer-on-liquidation max-collateral-to-liquidate user tx-sender))
          )
          (begin
            (try! (contract-call? lp-token burn-on-liquidation max-collateral-to-liquidate user))
            (try! (contract-call? .pool-0-reserve transfer-to-user collateral tx-sender max-collateral-to-liquidate))
          )
        )
        (try! (contract-call? .pool-0-reserve transfer-to-reserve principal tx-sender actual-debt-to-liquidate))
        
        (if (> fee-liquidated u0)
          (begin
            (try! (contract-call? lp-token burn-on-liquidation liquidated-collateral-for-fee user))
            (try!
              (contract-call? .pool-0-reserve liquidate-fee
                collateral
                (contract-call? .pool-0-reserve get-collection-address)
                liquidated-collateral-for-fee
              )
            )
            u0
          )
          u0
        )
      )
    )
    (ok u0)
  )
)

(define-read-only (mul-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math mul-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (div-to-fixed-precision (a uint) (decimals-a uint) (b-fixed uint))
  (contract-call? .math div-to-fixed-precision a decimals-a b-fixed)
)

(define-read-only (get-y-from-x
  (x uint)
  (x-decimals uint)
  (y-decimals uint)
  (x-price uint)
  (y-price uint)
  )
  (contract-call? .math get-y-from-x x x-decimals y-decimals x-price y-price)
)

(define-public (calculate-available-collateral-to-liquidate
  (collateral <ft>)
  (principal-asset <ft>)
  (collateral-oracle <oracle>)
  (principal-oracle <oracle>)
  (debt-to-liquidate uint)
  (user-collateral-balance uint)
  )
  (let (
    (collateral-price (try! (contract-call? collateral-oracle get-asset-price collateral)))
    (debt-currency-price (try! (contract-call? principal-oracle get-asset-price principal-asset)))
    (liquidation-bonus (get-liquidation-bonus collateral))
    (collateral-reserve-data (unwrap-panic (get-reserve-state collateral)))
    (principal-reserve-data (unwrap-panic (get-reserve-state principal-asset)))
    (max-collateral-amount-from-debt
      (contract-call? .math mul-perc
        (contract-call? .math get-y-from-x
          debt-to-liquidate
          (get decimals principal-reserve-data)
          (get decimals collateral-reserve-data)
          debt-currency-price
          collateral-price
        )
        (get decimals collateral-reserve-data)
        (+ one-8 (get liquidation-bonus collateral-reserve-data))
      )
    )
  )
    ;; (print { calculate-available-collateral-to-liquidate: {
    ;;   user-collateral-balance: user-collateral-balance,
    ;;   max-collateral-amount-from-debt: max-collateral-amount-from-debt,
    ;;   debt-to-liquidate: debt-to-liquidate,
    ;;   principal-decimals: (get decimals principal-reserve-data),
    ;;   collateral-decimals: (get decimals collateral-reserve-data),
    ;;   principal-currency-price: debt-currency-price,
    ;;   collateral-price: collateral-price,
    ;;   liquidation-bonus: (get liquidation-bonus collateral-reserve-data),
    ;;   collateral-amount: (contract-call? .math get-y-from-x debt-to-liquidate (get decimals principal-reserve-data) (get decimals collateral-reserve-data) debt-currency-price collateral-price),
    ;;   debt-needed: (contract-call? .math get-y-from-x user-collateral-balance (get decimals collateral-reserve-data) (get decimals principal-reserve-data) collateral-price debt-currency-price)
    ;; }})
    (ok
      (if (> max-collateral-amount-from-debt user-collateral-balance)
        (begin
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
                (- one-8 (get liquidation-bonus collateral-reserve-data))
              )
          }
        )
        {
          collateral-amount: max-collateral-amount-from-debt,
          debt-needed: debt-to-liquidate
        }
      )
    )
  )
)

(define-read-only (get-user-origination-fee (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve get-user-origination-fee who asset)
)

(define-read-only (get-liquidation-bonus (asset <ft>))
  (contract-call? .pool-0-reserve get-reserve-liquidation-bonus asset)
)

(define-public (get-user-borrow-balance (who principal) (asset <ft>))
  (contract-call? .pool-0-reserve get-user-borrow-balance who asset)
)

(define-public (get-reserve-state (asset <ft>))
  (ok (contract-call? .pool-0-reserve get-reserve-state (contract-of asset)))
)

(define-public (get-user-underlying-asset-balance
  (lp-token <ft>)
  (asset <ft>)
  (user principal)
  )
  (contract-call? .pool-0-reserve get-user-underlying-asset-balance lp-token asset user)
)

(define-public (get-reserve-available-liquidity (asset <ft>))
  (contract-call? .pool-0-reserve get-reserve-available-liquidity asset)
)

(define-read-only (is-reserve-collateral-enabled-as-collateral (asset principal))
  (contract-call? .pool-0-reserve is-reserve-collateral-enabled-as-collateral asset)
)

(define-read-only (is-user-collateral-enabled-as-collateral (user principal) (asset <ft>))
  (contract-call? .pool-0-reserve is-user-collateral-enabled-as-collateral user asset)
)

