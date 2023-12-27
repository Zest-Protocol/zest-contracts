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

;; liquidates 1 collateral asset
(define-public (liquidation-call
  (assets (list 100 { asset: <ft>, lp-token: <ft>, oracle: principal }))
  (lp-token <a-token>)
  (collateral-to-liquidate <ft>) ;; collateral
  (purchasing-asset <ft>) ;; borrowed asset
  (oracle principal)
  (user principal)
  (purchase-amount uint)
  (to-receive-atoken bool)
  )
  (let (
    (ret (try! (contract-call? .pool-0-reserve calculate-user-global-data user assets)))
    (user-collateral-balance (try! (get-user-underlying-asset-balance lp-token collateral-to-liquidate user)))
  )
    ;; health factor below treshold
    (asserts! (get is-health-factor-below-treshold ret) (err u1))
    ;; has deposited collateral
    (asserts! (> user-collateral-balance u0) (err u2))
    ;; collateral is enabled in asset reserve and by user
    (asserts! (
      and
        (is-reserve-collateral-enabled-as-collateral user)
        (is-user-collateral-enabled-as-collateral user collateral-to-liquidate)
      ) (err u3)
    )

    (let (
      (borrowed-ret (try! (get-user-borrow-balance user purchasing-asset)))
      (compounded-borrow-balance (get compounded-balance borrowed-ret))
    )
      ;; not borrowing anything
      (asserts! (> (get compounded-balance borrowed-ret) u0) (err u4))

      (let (
        (max-principal-amount-to-liquidate 
          (mul
            compounded-borrow-balance
            (var-get liquidation-close-factor-percent)
          )
        )
        (amount-to-liquidate
          (if (> purchase-amount max-principal-amount-to-liquidate)
            max-principal-amount-to-liquidate
            purchase-amount
          )
        )
        (collateral-ret
          (try! 
            (calculate-available-collateral-to-liquidate
              collateral-to-liquidate
              purchasing-asset
              oracle
              amount-to-liquidate
              user-collateral-balance
            )
          )
        )
        (max-collateral-to-liquidate (get collateral-amount collateral-ret))
        (origination-fee (get-user-origination-fee user purchasing-asset))
        (collateral-fees
          (if (> origination-fee u0)
            ;; if fees, take into account when calcualting available collateral
            (try!
              (calculate-available-collateral-to-liquidate
                collateral-to-liquidate
                purchasing-asset
                oracle
                amount-to-liquidate
                (- user-collateral-balance max-collateral-to-liquidate)
              )
            )
            collateral-ret
          )
        )
        (actual-amount-to-liquidate
          (if (< (get principal-amount-needed collateral-ret) amount-to-liquidate)
            (get principal-amount-needed collateral-ret)
            amount-to-liquidate
          )
        )

      )
        ;; if liquidator wants underlying asset, check there is enough collateral
        (if (not to-receive-atoken)
          (let (
            (current-available-collateral (try! (get-reserve-available-liquidity collateral-to-liquidate)))
          )
            ;; not enough liquidity
            (asserts! (< current-available-collateral max-collateral-to-liquidate) (err u5))
            true
          )
          false
        )

        (try!
          (contract-call? .pool-0-reserve update-state-on-liquidation
            purchasing-asset
            collateral-to-liquidate
            user
            actual-amount-to-liquidate
            max-collateral-to-liquidate
            (get principal-amount-needed collateral-fees)
            (get collateral-amount collateral-fees)
            (get balance-increase borrowed-ret)
            to-receive-atoken
          )
        )

        (if to-receive-atoken
          (begin
            (try! (contract-call? lp-token transfer-on-liquidation max-collateral-to-liquidate user tx-sender))
          )
          (begin
            (try! (contract-call? lp-token burn-on-liquidation max-collateral-to-liquidate user))
            (try! (contract-call? .pool-0-reserve transfer-to-user collateral-to-liquidate tx-sender max-collateral-to-liquidate))
          )
        )
        (try! (contract-call? .pool-0-reserve transfer-to-reserve purchasing-asset user actual-amount-to-liquidate))
        
        (if (> (get principal-amount-needed collateral-fees) u0)
          (begin
            (try! (contract-call? lp-token burn-on-liquidation (get collateral-amount collateral-fees) user))
            (try!
              (contract-call? .pool-0-reserve liquidate-fee
                collateral-to-liquidate
                (contract-call? .pool-0-reserve get-collection-address)
                (get collateral-amount collateral-fees)
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

(define-public (calculate-available-collateral-to-liquidate
  (collateral <ft>)
  (asset-borrowed <ft>)
  (oracle principal)
  (purchase-amount uint)
  (user-collateral-balance uint)
  )
  (let (
    (collateral-price (try! (contract-call? .oracle get-asset-price collateral)))
    (principal-current-price (try! (contract-call? .oracle get-asset-price asset-borrowed)))
    (liquidation-bonus (get-liquidation-bonus collateral))
    (max-amount-collateral-to-liquidate
      (div
        (mul
          principal-current-price
          collateral-price
        )
        liquidation-bonus
      )
    )
    (amounts-ret
      (if (> max-amount-collateral-to-liquidate  user-collateral-balance)
        {
          collateral-amount: user-collateral-balance,
          principal-amount-needed:
            (div
              (div
                (mul
                  collateral-price
                  user-collateral-balance
                )
                principal-current-price
              )
              liquidation-bonus
            )
        }
        {
          collateral-amount: max-amount-collateral-to-liquidate,
          principal-amount-needed: purchase-amount
        }
      )
    )
  )
    (ok amounts-ret)
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

(define-read-only (is-reserve-collateral-enabled-as-collateral (user principal))
  (contract-call? .pool-0-reserve is-reserve-collateral-enabled-as-collateral user)
)

(define-read-only (is-user-collateral-enabled-as-collateral (user principal) (asset <ft>))
  (contract-call? .pool-0-reserve is-user-collateral-enabled-as-collateral user asset)
)

