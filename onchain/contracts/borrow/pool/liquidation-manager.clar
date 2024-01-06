(use-trait ft .ft-trait.ft-trait)
(use-trait a-token .a-token-trait.a-token-trait)


;; 50%
(define-data-var liquidation-close-factor-percent uint u50000000)


(define-read-only (mul (x uint) (y uint))
  (contract-call? .math mul x y)
)

(define-read-only (div (x uint) (y uint))
  (contract-call? .math div x y)
)

(define-public (calculate-user-global-data
  (user principal)
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
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
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
  (lp-token <a-token>)
  (collateral <ft>)  ;; borrowed asset
  (principal <ft>) ;; principal
  (collateral-oracle principal)
  (principal-oracle principal)
  (user principal) ;; address of borrower
  (purchase-amount uint)
  (to-receive-atoken bool)
  )
  (let (
    (ret (try! (calculate-user-global-data user assets)))
    (user-collateral-balance (try! (get-user-underlying-asset-balance lp-token collateral user)))
  )
    ;; health factor below treshold
    (asserts! (get is-health-factor-below-treshold ret) (err u1))
    ;; has deposited collateral
    (asserts! (> user-collateral-balance u0) (err u2))
    ;; collateral is enabled in asset reserve and by user
    (asserts! (and
        (is-reserve-collateral-enabled-as-collateral (contract-of collateral))
        (is-user-collateral-enabled-as-collateral user collateral)
      ) (err u3))

    (let (
      (borrowed-ret (try! (get-user-borrow-balance user principal)))
      (user-compounded-borrow-balance (get compounded-balance borrowed-ret))
      (user-borrow-balance-increase (get balance-increase borrowed-ret))
    )
      ;; not borrowing anything
      (asserts! (> user-compounded-borrow-balance u0) (err u4))

      (let (
        (max-principal-amount-to-liquidate 
          (mul
            user-compounded-borrow-balance
            (var-get liquidation-close-factor-percent)
          )
        )
        (amount-to-liquidate
          (if (> purchase-amount max-principal-amount-to-liquidate)
            max-principal-amount-to-liquidate
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
              amount-to-liquidate
              user-collateral-balance
            )
          )
        )
        (max-collateral-to-liquidate (get collateral-amount available-collateral-principal))
        (principal-amount-needed (get principal-amount-needed available-collateral-principal))
        (origination-fee (get-user-origination-fee user principal))
        (required-fees
          (if (> origination-fee u0)
            ;; if fees, take into account when calcualting available collateral
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
            {
              collateral-amount: u0,
              principal-amount-needed: u0
            }
          )
        )
        (actual-amount-to-liquidate
          (if (< principal-amount-needed amount-to-liquidate)
            principal-amount-needed
            amount-to-liquidate
          )
        )
        (fee-liquidated (get principal-amount-needed required-fees))
        (liquidated-collateral-for-fee (get collateral-amount required-fees))
      )
        ;; if liquidator wants underlying asset, check there is enough collateral
        (if (not to-receive-atoken)
          (let (
            (current-available-collateral (try! (get-reserve-available-liquidity collateral)))
          )
            ;; not enough liquidity
            (asserts! (< current-available-collateral max-collateral-to-liquidate) (err u5))
            true
          )
          false
        )

        (try!
          (contract-call? .pool-0-reserve update-state-on-liquidation
            principal
            collateral
            user
            actual-amount-to-liquidate
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
        (try! (contract-call? .pool-0-reserve transfer-to-reserve principal user actual-amount-to-liquidate))
        
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
  (collateral-oracle principal)
  (principal-oracle principal)
  (purchase-amount uint)
  (user-collateral-balance uint)
  )
  (let (
    (collateral-price (try! (contract-call? .oracle get-asset-price collateral)))
    (principal-currency-price (try! (contract-call? .oracle get-asset-price principal-asset)))
    (liquidation-bonus (get-liquidation-bonus collateral))
    (collateral-reserve-data (unwrap-panic (get-reserve-state collateral)))
    (principal-reserve-data (unwrap-panic (get-reserve-state principal-asset)))
    (max-amount-collateral-to-liquidate
      (mul
        (contract-call? .math get-y-from-x
          purchase-amount
          (get decimals principal-reserve-data)
          (get decimals collateral-reserve-data)
          principal-currency-price
          collateral-price
        )
        (get liquidation-bonus collateral-reserve-data)
      )
    )
  )
    (ok
      (if (> max-amount-collateral-to-liquidate  user-collateral-balance)
        {
          collateral-amount: user-collateral-balance,
          principal-amount-needed:
            (div
              (contract-call? .math get-y-from-x
                user-collateral-balance
                (get decimals collateral-reserve-data)
                (get decimals principal-reserve-data)
                collateral-price
                principal-currency-price
              )
              (get liquidation-bonus collateral-reserve-data)
            )
        }
        {
          collateral-amount: max-amount-collateral-to-liquidate,
          principal-amount-needed: purchase-amount
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

